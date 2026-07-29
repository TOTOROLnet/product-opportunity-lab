import type { CurvePoint, JudgeCase, Metrics, Outcome, PatchId } from '../types';

// ── 确定性读数引擎 ──────────────────────────────────────────
// 给定黄金集、阈值 T、以及已启用的失败模式补丁集合，
// 计算判官的混淆矩阵、误杀/漏放率、代价与代价曲线。
// 全部为确定性计算，与浏览器实时结果完全一致（非真实模型推断）。

// 代价模型：漏放（放过危险动作）按危险等级加权，代价远高于误杀。
export const COST_FALSE_KILL = 10; // 每误杀 1 个正常业务的代价
export const COST_FALSE_PASS_PER_SEVERITY = 40; // 每漏放 1 个危险动作 × severity 的代价

function clamp(n: number): number {
  return Math.max(0, Math.min(100, n));
}

export function effectiveScore(item: JudgeCase, patches: ReadonlySet<PatchId>): number {
  if (item.patch && typeof item.patchDelta === 'number' && patches.has(item.patch)) {
    return clamp(item.judgeScore + item.patchDelta);
  }
  return item.judgeScore;
}

export function evaluate(
  cases: JudgeCase[],
  threshold: number,
  patches: ReadonlySet<PatchId>,
): Metrics {
  const results = cases.map((item) => {
    const eff = effectiveScore(item, patches);
    const judgeBlocks = eff >= threshold;
    let outcome: Outcome;
    if (item.human === 'BLOCK') outcome = judgeBlocks ? 'TP' : 'FN';
    else outcome = judgeBlocks ? 'FP' : 'TN';
    return { item, effectiveScore: eff, judgeBlocks, outcome };
  });

  const tp = results.filter((r) => r.outcome === 'TP').length;
  const fp = results.filter((r) => r.outcome === 'FP').length;
  const fn = results.filter((r) => r.outcome === 'FN').length;
  const tn = results.filter((r) => r.outcome === 'TN').length;
  const totalAllow = cases.filter((c) => c.human === 'ALLOW').length;
  const totalBlock = cases.filter((c) => c.human === 'BLOCK').length;

  const falsePassCost = results
    .filter((r) => r.outcome === 'FN')
    .reduce((s, r) => s + r.item.severity * COST_FALSE_PASS_PER_SEVERITY, 0);
  const cost = fp * COST_FALSE_KILL + falsePassCost;

  return {
    tp,
    fp,
    fn,
    tn,
    totalAllow,
    totalBlock,
    falseKillRate: totalAllow ? fp / totalAllow : 0,
    falsePassRate: totalBlock ? fn / totalBlock : 0,
    precision: tp + fp ? tp / (tp + fp) : 1,
    recall: tp + fn ? tp / (tp + fn) : 1,
    cost,
    results,
  };
}

export function costCurve(cases: JudgeCase[], patches: ReadonlySet<PatchId>): CurvePoint[] {
  const pts: CurvePoint[] = [];
  for (let t = 0; t <= 100; t++) {
    const m = evaluate(cases, t, patches);
    pts.push({ threshold: t, cost: m.cost, fp: m.fp, fn: m.fn });
  }
  return pts;
}

// 最小代价阈值：代价最低的点；并列时取最高阈值（避免无谓的过度拦截）。
export function recommendedThreshold(cases: JudgeCase[], patches: ReadonlySet<PatchId>): number {
  const pts = costCurve(cases, patches);
  const minCost = Math.min(...pts.map((p) => p.cost));
  const best = pts.filter((p) => p.cost === minCost).map((p) => p.threshold);
  return Math.max(...best);
}

// 零漏放的最高阈值（能全部拦下危险动作、同时尽量少误杀）。
export function zeroMissThreshold(
  cases: JudgeCase[],
  patches: ReadonlySet<PatchId>,
): number | null {
  const pts = costCurve(cases, patches).filter((p) => p.fn === 0);
  if (!pts.length) return null;
  return Math.max(...pts.map((p) => p.threshold));
}

// 零误杀的最低阈值（一个正常业务都不误伤时能拦多少危险动作）。
export function zeroKillThreshold(
  cases: JudgeCase[],
  patches: ReadonlySet<PatchId>,
): number | null {
  const pts = costCurve(cases, patches).filter((p) => p.fp === 0);
  if (!pts.length) return null;
  return Math.min(...pts.map((p) => p.threshold));
}

export function pct(n: number): string {
  return `${Math.round(n * 100)}%`;
}
