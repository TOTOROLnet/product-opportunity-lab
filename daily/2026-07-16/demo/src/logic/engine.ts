import type { Applied, Candidate, Rule, Verdict } from '../types';

// 把"当前技能卡里被激活的规则"应用到一个 case，得到最终判定。
// 从 agent 的基线判定出发；按规则数组顺序应用，靠后的命中规则覆盖靠前的。
// 这是一个真实（虽小）的确定性规则引擎——一致率由它实算，不是编的数字。
export function applyRules(c: Candidate, activeRules: Rule[]): Applied {
  let verdict: Verdict = c.baseVerdict;
  let decidingRuleId: string | null = null;
  for (const rule of activeRules) {
    if (rule.match(c.features)) {
      verdict = rule.setTo;
      decidingRuleId = rule.id;
    }
  }
  return { verdict, decidingRuleId };
}

export type CaseCategory = 'fixed' | 'broke' | 'stillWrong' | 'alreadyRight';

export interface PerCaseResult {
  candidate: Candidate;
  baseVerdict: Verdict;
  finalVerdict: Verdict;
  expert: Verdict;
  baseCorrect: boolean;
  finalCorrect: boolean;
  decidingRuleId: string | null;
  category: CaseCategory;
}

export interface AgreementResult {
  total: number;
  agree: number;
  rate: number; // 0..1
  perCase: PerCaseResult[];
}

export function evaluate(cases: Candidate[], activeRules: Rule[]): AgreementResult {
  const perCase: PerCaseResult[] = cases.map((candidate) => {
    const applied = applyRules(candidate, activeRules);
    const baseCorrect = candidate.baseVerdict === candidate.expertVerdict;
    const finalCorrect = applied.verdict === candidate.expertVerdict;
    let category: CaseCategory;
    if (baseCorrect && finalCorrect) category = 'alreadyRight';
    else if (!baseCorrect && finalCorrect) category = 'fixed';
    else if (baseCorrect && !finalCorrect) category = 'broke';
    else category = 'stillWrong';
    return {
      candidate,
      baseVerdict: candidate.baseVerdict,
      finalVerdict: applied.verdict,
      expert: candidate.expertVerdict,
      baseCorrect,
      finalCorrect,
      decidingRuleId: applied.decidingRuleId,
      category,
    };
  });
  const agree = perCase.filter((p) => p.finalCorrect).length;
  return { total: perCase.length, agree, rate: perCase.length ? agree / perCase.length : 0, perCase };
}

// 基线一致率（完全没有规则时）。
export function baselineRate(cases: Candidate[]): number {
  const agree = cases.filter((c) => c.baseVerdict === c.expertVerdict).length;
  return cases.length ? agree / cases.length : 0;
}
