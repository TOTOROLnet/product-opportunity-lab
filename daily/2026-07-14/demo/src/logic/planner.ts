import type { CallRecord, PlanResult, Scenario, Source, SubNeed, Verdict } from '../types';

// ---------------------------------------------------------------------------
// 值当 Worthwhile — 真实运行的花费规划算法（mock 数据，真实逻辑）。
//
// 核心思想：
//  - 有效覆盖质量 effQ = 原始覆盖 * 可靠度；低于"可用下限"的覆盖视为无效（0）。
//  - 某信息需求的覆盖 = 已调用源中该需求的最高 effQ（天然建模去重：重叠源边际≈0）。
//  - 单次调用的边际价值 = Σ 权重 *（新覆盖 - 旧覆盖，均按够用线 qualityBar 截断）。
//  - 值当 = 反复挑"边际价值/价格"最高、且边际>阈值、且预算够的源；够用即止。
//  - 贪婪 = 一把梭调用所有源。
//  - 对账裁决：worth（边际>阈值）/ redundant（独立有价值但已被覆盖）/ wasted（独立即无效）。
// ---------------------------------------------------------------------------

const USEFUL_FLOOR = 0.3; // 有效覆盖下限：低于此的覆盖质量视为噪声
const MEANINGFUL_GAIN = 0.08; // 认为"值"的最小边际价值（权重单位）
const ORDER_EPSILON = 0.02; // 价值排序时纳入下一个源的最小边际价值

type CoverageState = Record<string, number>;

function effQuality(source: Source, needId: string): number {
  const raw = source.covers[needId] ?? 0;
  const eff = raw * source.reliability;
  return eff >= USEFUL_FLOOR ? eff : 0;
}

/** 该源覆盖到可用下限以上的信息需求。 */
function coveredNeedLabels(source: Source, subNeeds: SubNeed[]): string[] {
  return subNeeds.filter((n) => effQuality(source, n.id) > 0).map((n) => n.label);
}

/** 计算把某源加入当前状态后的边际价值（权重单位，按够用线截断）。 */
function marginalGain(
  source: Source,
  state: CoverageState,
  subNeeds: SubNeed[],
  qualityBar: number,
): number {
  let gain = 0;
  for (const need of subNeeds) {
    const eff = effQuality(source, need.id);
    if (eff <= 0) continue;
    const old = state[need.id] ?? 0;
    const before = Math.min(old, qualityBar);
    const after = Math.min(Math.max(old, eff), qualityBar);
    if (after > before) {
      gain += (need.weight * (after - before)) / qualityBar;
    }
  }
  return gain;
}

function applySource(source: Source, state: CoverageState, subNeeds: SubNeed[]): void {
  for (const need of subNeeds) {
    const eff = effQuality(source, need.id);
    if (eff <= 0) continue;
    state[need.id] = Math.max(state[need.id] ?? 0, eff);
  }
}

/** 整体进度：各需求按够用线截断后的加权平均，范围 0..1。 */
function progressOf(state: CoverageState, subNeeds: SubNeed[], qualityBar: number): number {
  const totalWeight = subNeeds.reduce((s, n) => s + n.weight, 0);
  if (totalWeight === 0) return 1;
  let acc = 0;
  for (const need of subNeeds) {
    const cov = Math.min(state[need.id] ?? 0, qualityBar);
    acc += (need.weight * cov) / qualityBar;
  }
  return acc / totalWeight;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function fmt(n: number): string {
  return `$${n.toFixed(2)}`;
}

export function plan(scenario: Scenario, budget: number, qualityBar: number): PlanResult {
  const { subNeeds, sources } = scenario;

  // 1) 计算"价值排序"：反复挑边际价值/价格最高的源，直到没有源能带来有意义的边际。
  const orderState: CoverageState = {};
  const remaining = [...sources];
  const ordered: { source: Source; marginalGain: number }[] = [];

  while (remaining.length > 0) {
    let best: Source | null = null;
    let bestScore = -Infinity;
    let bestGain = 0;
    for (const s of remaining) {
      const g = marginalGain(s, orderState, subNeeds, qualityBar);
      if (g <= ORDER_EPSILON) continue;
      const score = g / s.priceUSD;
      // 打分更高者优先；打分相同则更便宜、id 更小者优先（确定性）。
      if (
        score > bestScore + 1e-9 ||
        (Math.abs(score - bestScore) <= 1e-9 && best !== null && s.priceUSD < best.priceUSD)
      ) {
        best = s;
        bestScore = score;
        bestGain = g;
      }
    }
    if (!best) break;
    ordered.push({ source: best, marginalGain: bestGain });
    applySource(best, orderState, subNeeds);
    remaining.splice(remaining.indexOf(best), 1);
  }

  // 剩余源（在价值排序里边际≈0）按目录顺序补入，边际按当前状态计算。
  const tail = remaining.map((s) => ({
    source: s,
    marginalGain: marginalGain(s, orderState, subNeeds, qualityBar),
  }));
  const fullOrder = [...ordered, ...tail];

  // 2) 逐源裁决 + 组装值当计划（够用即止 + 预算封顶）。
  const emptyState: CoverageState = {};
  const worthwhileState: CoverageState = {};
  let worthwhileSpent = 0;
  const worthwhileCalls: CallRecord[] = [];
  const classified: CallRecord[] = [];
  let stopReason = '';

  fullOrder.forEach((rec, idx) => {
    const s = rec.source;
    const standalone = marginalGain(s, emptyState, subNeeds, qualityBar);
    let verdict: Verdict;
    let reason: string;
    const needs = coveredNeedLabels(s, subNeeds);
    const needsText = needs.length ? `「${needs.join('、')}」` : '任何信息需求';

    if (standalone <= MEANINGFUL_GAIN) {
      verdict = 'wasted';
      const maxEff = Math.max(0, ...subNeeds.map((n) => (s.covers[n.id] ?? 0) * s.reliability));
      reason = `有效覆盖质量仅 ${maxEff.toFixed(2)}（低于可用下限 ${USEFUL_FLOOR}），几乎无有效信息 → 跳过，省 ${fmt(s.priceUSD)}`;
    } else if (rec.marginalGain > MEANINGFUL_GAIN) {
      // 值当会考虑调用它——但要看预算。
      if (worthwhileSpent + s.priceUSD <= budget + 1e-9) {
        verdict = 'worth';
        reason = `覆盖${needsText}至够用线（边际价值 +${rec.marginalGain.toFixed(2)}），单位成本性价比最高 → 调用 ${fmt(s.priceUSD)}`;
      } else {
        verdict = 'skipped-budget';
        reason = `本可覆盖${needsText}，但预算已不足（剩余 ${fmt(Math.max(0, budget - worthwhileSpent))} < ${fmt(s.priceUSD)}）→ 受预算约束跳过`;
      }
    } else {
      verdict = 'redundant';
      reason = `${needsText}已被更省的来源覆盖至够用线，本次边际贡献≈0 → 跳过，省 ${fmt(s.priceUSD)}`;
    }

    const record: CallRecord = {
      source: s,
      order: idx,
      marginalGain: round2(rec.marginalGain),
      standaloneGain: round2(standalone),
      verdict,
      coveredNeeds: needs,
      reason,
    };
    classified.push(record);

    if (verdict === 'worth') {
      worthwhileCalls.push(record);
      worthwhileSpent += s.priceUSD;
      applySource(s, worthwhileState, subNeeds);
    }
  });

  // 值当停手原因
  const worthwhileProgress = progressOf(worthwhileState, subNeeds, qualityBar);
  if (worthwhileCalls.length === 0) {
    stopReason = '没有任何来源能带来高于成本的边际价值 → 一次付费都不发生。';
  } else if (worthwhileProgress >= 0.999) {
    stopReason = '所有信息需求已达够用线，其余来源边际收益≈0 → 够用即止，停手。';
  } else if (classified.some((c) => c.verdict === 'skipped-budget')) {
    stopReason = '预算已用尽：优先满足高权重需求，低优先需求受预算约束未继续购买。';
  } else {
    stopReason = '其余来源的边际收益已低于成本阈值 → 停手，不做无谓付费。';
  }

  // 3) 贪婪基线：一把梭调用所有源。
  const greedyState: CoverageState = {};
  const greedyCalls: CallRecord[] = classified.map((c) => {
    applySource(c.source, greedyState, subNeeds);
    return c;
  });
  const greedyTotalUSD = round2(sources.reduce((s, x) => s + x.priceUSD, 0));
  const greedyProgress = progressOf(greedyState, subNeeds, qualityBar);

  const worthwhileTotalUSD = round2(worthwhileSpent);
  const savedUSD = round2(greedyTotalUSD - worthwhileTotalUSD);
  const savedPct = greedyTotalUSD > 0 ? savedUSD / greedyTotalUSD : 0;

  const coverageByNeed = subNeeds.map((need) => ({
    need,
    greedyCoverage: round2(greedyState[need.id] ?? 0),
    worthwhileCoverage: round2(worthwhileState[need.id] ?? 0),
  }));

  const nearOptimal = savedPct < 0.1;

  return {
    greedyCalls,
    greedyTotalUSD,
    greedyProgress,
    worthwhileCalls,
    worthwhileTotalUSD,
    worthwhileProgress,
    savedUSD,
    savedPct,
    coverageByNeed,
    stopReason,
    nearOptimal,
  };
}

export const plannerConstants = { USEFUL_FLOOR, MEANINGFUL_GAIN };
