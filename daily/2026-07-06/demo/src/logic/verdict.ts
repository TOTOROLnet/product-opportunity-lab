import type { Criterion, Scenario } from '../types';

export type Transition = 'held-pass' | 'held-fail' | 'regressed' | 'improved';
export type GlobalVerdict = 'HELD' | 'REGRESSED' | 'IMPROVED';

/** 单条验收标准在 基线→当前 之间的状态迁移。 */
export function transitionOf(c: Criterion): Transition {
  const b = c.baselineStatus;
  const cur = c.currentStatus;
  if (b === 'pass' && cur === 'pass') return 'held-pass';
  if (b === 'fail' && cur === 'fail') return 'held-fail';
  if (b === 'pass' && cur === 'fail') return 'regressed';
  return 'improved'; // fail -> pass
}

export interface VerdictSummary {
  verdict: GlobalVerdict;
  regressions: number;
  improvements: number;
  heldPass: number;
  heldFail: number;
  /** 证据发生变化但状态守住的条数（去噪/容差演示）。 */
  toleratedChanges: number;
  total: number;
}

/**
 * 汇总规则（刻意简单、确定、可解释）：
 * - 只要有 PASS→FAIL 的回归，全局判 REGRESSED（回归优先，最危险的信号）。
 * - 无回归但有 FAIL→PASS 的改善，判 IMPROVED。
 * - 否则判 HELD（守住）。
 */
export function summarize(scenario: Scenario): VerdictSummary {
  let regressions = 0;
  let improvements = 0;
  let heldPass = 0;
  let heldFail = 0;
  let toleratedChanges = 0;

  for (const c of scenario.criteria) {
    const t = transitionOf(c);
    if (t === 'regressed') regressions += 1;
    else if (t === 'improved') improvements += 1;
    else if (t === 'held-pass') heldPass += 1;
    else heldFail += 1;

    if (c.evidenceChanged && (t === 'held-pass' || t === 'held-fail')) {
      toleratedChanges += 1;
    }
  }

  let verdict: GlobalVerdict;
  if (regressions > 0) verdict = 'REGRESSED';
  else if (improvements > 0) verdict = 'IMPROVED';
  else verdict = 'HELD';

  return {
    verdict,
    regressions,
    improvements,
    heldPass,
    heldFail,
    toleratedChanges,
    total: scenario.criteria.length,
  };
}

export const TRANSITION_META: Record<
  Transition,
  { label: string; tone: 'good' | 'bad' | 'neutral' | 'warn' }
> = {
  'held-pass': { label: '守住 · 仍通过', tone: 'good' },
  'held-fail': { label: '仍失败', tone: 'neutral' },
  regressed: { label: '回归 · 通过→失败', tone: 'bad' },
  improved: { label: '改善 · 失败→通过', tone: 'warn' },
};

export const VERDICT_META: Record<
  GlobalVerdict,
  { label: string; tone: 'good' | 'bad' | 'warn'; blurb: string }
> = {
  HELD: {
    label: 'HELD · 守住',
    tone: 'good',
    blurb: '所有此前被证明能用的验收项，本次重跑依旧成立。无静默回归。',
  },
  REGRESSED: {
    label: 'REGRESSED · 出现回归',
    tone: 'bad',
    blurb: '有验收项从"通过"变成了"失败"——即使源码 diff 很小很绿，行为已经坏了。',
  },
  IMPROVED: {
    label: 'IMPROVED · 有改善',
    tone: 'warn',
    blurb: '无回归，且有此前失败的验收项本次被修复。',
  },
};
