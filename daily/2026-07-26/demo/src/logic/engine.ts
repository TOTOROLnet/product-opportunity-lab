// 岔口 Forkpoint — 确定性归因/重放引擎。
// 一个引擎驱动全部三个视图：会话回放、纠偏分叉、归因台账。
// 「折返步」的判定完全可复算：最早「被违反且——单独修正它就能让最终结论翻转为正确——」的步。

import type {
  CompareRow,
  Conclusion,
  Decisions,
  ForkOption,
  ForkResult,
  Health,
  InvariantResult,
  MetricColumn,
  Recommend,
  RunResult,
  StepResult,
  ValueMetrics,
} from '../types';
import {
  BASE_ROWS,
  COLUMN_LABEL,
  DEFAULT_DECISIONS,
  DROPPED,
  GOAL,
  STATS,
  STEPS,
} from '../data/session';
import { fmtP, pct, pp } from './format';

function recommendFor(metricColumn: MetricColumn): Recommend {
  const s = STATS[metricColumn];
  return s.redesign - s.control > 0 && s.p < GOAL.alpha ? 'rollout' : 'hold';
}

/** 用目标指标算出的「正确结论建议」——判定 correct 的基准。 */
export function referenceRecommend(): Recommend {
  return recommendFor(GOAL.metric);
}

export function computeConclusion(d: Decisions): Conclusion {
  const s = STATS[d.metricColumn];
  const lift = s.redesign - s.control;
  const significant = s.p < GOAL.alpha;
  const recommend: Recommend = lift > 0 && significant ? 'rollout' : 'hold';
  const text =
    recommend === 'rollout'
      ? `${GOAL.metricLabel} 显著提升 ${pp(lift)}（${fmtP(s.p)}），建议全量上线`
      : `${GOAL.metricLabel} 未见显著提升（${pp(lift)}，${fmtP(s.p)}）；改版仅提升了 D1（疑似新鲜感效应），不建议全量上线，建议延长观察窗口`;
  return {
    metricColumn: d.metricColumn,
    controlRate: s.control,
    redesignRate: s.redesign,
    lift,
    p: s.p,
    significant,
    recommend,
    text,
    correct: recommend === referenceRecommend(),
  };
}

const FIX_VALUE: { metricColumn: MetricColumn; dropRule: Decisions['dropRule'] } = {
  metricColumn: GOAL.metric, // 'retained_d7'
  dropRule: 'lenient',
};

/** 单独修正某个决策（相对默认缺陷会话），最终结论是否会翻转为正确。 */
function isolatedFixFixesConclusion(key: keyof Decisions): boolean {
  const baseWrong = !computeConclusion(DEFAULT_DECISIONS).correct;
  const fixed: Decisions = { ...DEFAULT_DECISIONS, [key]: FIX_VALUE[key] };
  return baseWrong && computeConclusion(fixed).correct;
}

/** 各步不变量的校验（violated + outcomeRelevant）。 */
function invariantFor(seq: number, d: Decisions): InvariantResult {
  const metricWrong = d.metricColumn !== GOAL.metric;
  const dropped = DROPPED[d.dropRule];
  const kind = d.metricColumn === 'retained_d7' ? 'D7' : 'D1';
  const mk = (
    id: string,
    label: string,
    expected: string,
    actual: string,
    violated: boolean,
    dependsOn?: keyof Decisions,
  ): InvariantResult => ({
    id,
    label,
    expected,
    actual,
    violated,
    outcomeRelevant: violated && dependsOn !== undefined && isolatedFixFixesConclusion(dependsOn),
  });

  switch (seq) {
    case 1:
      return mk('goal-declared', '目标指标已在配置中声明', 'goalMetric = retained_d7', `goalMetric = ${GOAL.metric}`, false);
    case 2:
      return mk('schema-has-d7', '数据含 D7 留存列', '存在 retained_d7 列', '存在 retained / retained_d7 两列', false);
    case 3:
      return mk(
        'cohort-complete',
        '队列完整（无静默丢弃）',
        '丢弃行数 = 0',
        `丢弃 ${dropped} 行（${pct(dropped / BASE_ROWS)}）`,
        dropped > 0,
        'dropRule',
      );
    case 4:
      return mk('groups-comparable', '两组样本量可比', '两组样本量相近', 'control ≈ redesign（各约 2,440）', false);
    case 5:
      return mk(
        'metric-matches-goal',
        '所选指标列 == 目标指标',
        `指标列 = retained_d7`,
        `指标列 = ${d.metricColumn}`,
        metricWrong,
        'metricColumn',
      );
    case 6:
      return mk('rate-on-goal', '留存率基于目标指标列', '基于 retained_d7', `基于 ${d.metricColumn}`, metricWrong, 'metricColumn');
    case 7:
      return mk(
        'sig-on-goal',
        '显著性检验基于目标指标',
        '基于 retained_d7',
        `基于 ${d.metricColumn}（${fmtP(STATS[d.metricColumn].p)}）`,
        metricWrong,
        'metricColumn',
      );
    case 8:
      return mk('summary-on-goal', '摘要口径 == 目标指标', 'D7 口径', `${kind} 口径`, metricWrong, 'metricColumn');
    case 9:
      return mk('conclusion-on-goal', '结论指标 == 目标指标', '结论谈 D7', `结论谈 ${kind}`, metricWrong, 'metricColumn');
    default:
      return mk('unknown', '未知', '', '', false);
  }
}

/** 各步写出的状态键值（展示用）。 */
function writesFor(seq: number, d: Decisions): Record<string, string> {
  const s = STATS[d.metricColumn];
  const dropped = DROPPED[d.dropRule];
  const clean = BASE_ROWS - dropped;
  switch (seq) {
    case 1:
      return { 'task.goal': GOAL.metric, 'exp.alpha': String(GOAL.alpha), window: GOAL.window };
    case 2:
      return { 'users.raw': `${BASE_ROWS} 行`, columns: 'signup_ts, variant, retained, retained_d7' };
    case 3:
      return { 'users.clean': `${clean} 行`, dropped: `${dropped} 行` };
    case 4:
      return { 'groups.control': '≈2,440', 'groups.redesign': '≈2,440' };
    case 5:
      return { 'metric.column': d.metricColumn, note: COLUMN_LABEL[d.metricColumn] };
    case 6:
      return { 'rate.control': pct(s.control), 'rate.redesign': pct(s.redesign), lift: pp(s.redesign - s.control) };
    case 7:
      return { p: s.p.toFixed(3), significant: s.p < GOAL.alpha ? 'true' : 'false' };
    case 8:
      return { summary: `${d.metricColumn === 'retained_d7' ? 'D7' : 'D1'} ${pct(s.redesign)} vs ${pct(s.control)}` };
    case 9:
      return { recommend: recommendFor(d.metricColumn) === 'rollout' ? '全量上线' : '暂不上线' };
    default:
      return {};
  }
}

function summaryFor(seq: number, d: Decisions): string {
  const s = STATS[d.metricColumn];
  const dropped = DROPPED[d.dropRule];
  switch (seq) {
    case 1:
      return `目标 = ${GOAL.metricLabel}；显著性阈值 ${fmtP(GOAL.alpha).replace('p=', 'α=')}`;
    case 2:
      return `拉取 ${BASE_ROWS} 行新用户明细（含 retained 与 retained_d7 两列）`;
    case 3:
      return `窗口过滤 + 清洗，丢弃 ${dropped} 行（${pct(dropped / BASE_ROWS)}）`;
    case 4:
      return `分为 control / redesign 两组，样本量相近`;
    case 5:
      return d.metricColumn === GOAL.metric
        ? `选用 retained_d7 列（＝目标指标）`
        : `选用 retained 列——列名歧义，误把 D1 留存当成了 D7`;
    case 6:
      return `两组留存率：redesign ${pct(s.redesign)} vs control ${pct(s.control)}（${pp(s.redesign - s.control)}）`;
    case 7:
      return `显著性：${fmtP(s.p)}，${s.p < GOAL.alpha ? '显著' : '不显著'}`;
    case 8:
      return `摘要：${d.metricColumn === 'retained_d7' ? 'D7' : 'D1'} 口径的对比图与文字`;
    case 9:
      return recommendFor(d.metricColumn) === 'rollout' ? `结论：建议全量上线` : `结论：暂不上线，延长观察`;
    default:
      return '';
  }
}

/** 依当前 decisions 复算整条会话。 */
export function runSession(decisions: Decisions): RunResult {
  const invByStep = STEPS.map((m) => invariantFor(m.seq, decisions));
  const firstIdx = invByStep.findIndex((inv) => inv.violated && inv.outcomeRelevant);
  const pivotalSeq = firstIdx >= 0 ? STEPS[firstIdx].seq : null;

  const steps: StepResult[] = STEPS.map((m, i) => {
    const inv = invByStep[i];
    let health: Health;
    if (pivotalSeq !== null && m.seq === pivotalSeq) health = 'pivotal';
    else if (pivotalSeq !== null && m.seq > pivotalSeq && inv.violated && inv.outcomeRelevant) health = 'tainted';
    else if (inv.violated) health = 'anomaly';
    else health = 'ok';

    return {
      seq: m.seq,
      action: m.action,
      summary: summaryFor(m.seq, decisions),
      reads: m.reads,
      writes: writesFor(m.seq, decisions),
      invariant: inv,
      health,
      hasFix: m.decisionKey !== undefined,
    };
  });

  return { decisions, steps, conclusion: computeConclusion(decisions), pivotalSeq };
}

export function defaultRun(): RunResult {
  return runSession(DEFAULT_DECISIONS);
}

/** 可纠偏的步（Demo：第 3 步脏数据规则、第 5 步指标列）。 */
export function forkOptions(): ForkOption[] {
  const opts: ForkOption[] = [];
  for (const m of STEPS) {
    if (!m.decisionKey) continue;
    const key = m.decisionKey;
    if (key === 'metricColumn') {
      opts.push({
        seq: m.seq,
        decisionKey: key,
        label: '改用正确的指标列 retained_d7',
        fromLabel: 'retained（D1）',
        toLabel: 'retained_d7（D7）',
      });
    } else {
      opts.push({
        seq: m.seq,
        decisionKey: key,
        label: '放宽清洗规则、回收可修复行',
        fromLabel: 'strict（丢弃 120 行）',
        toLabel: 'lenient（丢弃 20 行）',
      });
    }
  }
  return opts;
}

/** 从某步 fork 一条纠偏轨迹并确定性重放，返回 before/after 与是否命中折返步。 */
export function applyFork(seq: number): ForkResult {
  const opt = forkOptions().find((o) => o.seq === seq);
  const before = runSession(DEFAULT_DECISIONS);
  if (!opt) {
    return { seq, before, after: before, flipped: false, hitPivotal: false, correctedNow: before.conclusion.correct };
  }
  const after = runSession({ ...DEFAULT_DECISIONS, [opt.decisionKey]: FIX_VALUE[opt.decisionKey] });
  return {
    seq,
    before,
    after,
    flipped: before.conclusion.recommend !== after.conclusion.recommend,
    hitPivotal: before.pivotalSeq === seq,
    correctedNow: after.conclusion.correct,
  };
}

export function compareRows(before: RunResult, after: RunResult): CompareRow[] {
  const b = before.conclusion;
  const a = after.conclusion;
  const rows: [string, string, string][] = [
    ['指标列', b.metricColumn, a.metricColumn],
    ['control 留存', pct(b.controlRate), pct(a.controlRate)],
    ['redesign 留存', pct(b.redesignRate), pct(a.redesignRate)],
    ['提升幅度 (lift)', pp(b.lift), pp(a.lift)],
    ['显著性', fmtP(b.p), fmtP(a.p)],
    ['是否显著', b.significant ? '显著' : '不显著', a.significant ? '显著' : '不显著'],
    ['上线建议', b.recommend === 'rollout' ? '全量上线' : '暂不上线', a.recommend === 'rollout' ? '全量上线' : '暂不上线'],
  ];
  return rows.map(([label, bv, av]) => ({ label, before: bv, after: av, changed: bv !== av }));
}

export function valueMetrics(): ValueMetrics {
  const run = runSession(DEFAULT_DECISIONS);
  const taintedCount = run.steps.filter((s) => s.health === 'tainted').length;
  return {
    foldSeq: run.pivotalSeq,
    totalSteps: run.steps.length,
    taintedCount,
    stepsSaved: run.steps.length - 1,
    avoidedBadRollout: run.conclusion.correct ? 0 : 1,
  };
}
