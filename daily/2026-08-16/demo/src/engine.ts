// ---- 确定性护栏引擎：Policy + Action[] → Verdict[] + Scorecard ----
// 纯函数、可解释、可复现。不接 LLM / 后端 / 真实 agent 运行时。
// 这里演示的是「设计期策略预演」的价值形态，判定精度不代表生产级。

import type { Action, Decision, Policy, Scorecard, Verdict } from './types';
import { CAT_LABEL, DEC_LABEL, DATA_LABEL, SCOPE_LABEL } from './labels';

const SEV: Record<Decision, number> = { allow: 0, review: 1, deny: 2 };
const BY_SEV: Decision[] = ['allow', 'review', 'deny'];

/** 若一条动作被自动放行，它的「爆炸半径」贡献分。强调不可逆与数据敏感度。 */
export function blastOf(a: Action): number {
  let r = a.riskBase; // 1..5
  r += a.reversible ? 0 : 4; // 不可逆是爆炸半径的主要来源
  r += { none: 0, internal: 0, pii: 3, secret: 5 }[a.dataClass];
  r += { local: 0, staging: 0, prod: 2, external: 1 }[a.scope];
  return r;
}

/** 对单条动作求判决。守卫只会「抬高」严格度（allow<review<deny），显式 deny 为终态。 */
export function evaluate(action: Action, policy: Policy): Verdict {
  const reasons: string[] = [];
  let matched = false;
  let sev = -1; // 未定

  const raise = (d: Decision) => {
    sev = Math.max(sev, SEV[d]);
  };

  // 1. fail-closed 硬拦截：secret 外发
  if (policy.blockSecretExfil && action.dataClass === 'secret' && action.scope === 'external') {
    matched = true;
    raise('deny');
    reasons.push('secret 数据外发 → fail-closed 一票否决');
  }

  // 2. 分类规则（显式表态）
  const catRule = policy.categoryRules[action.category];
  if (catRule !== 'inherit') {
    matched = true;
    raise(catRule);
    reasons.push(`分类规则「${CAT_LABEL[action.category]}」→ ${DEC_LABEL[catRule]}`);
  }

  // 3. 抬高型守卫（至少人审）
  if (policy.requireHumanForIrreversible && !action.reversible) {
    matched = true;
    raise('review');
    reasons.push('不可逆动作 → 强制人审');
  }
  if (policy.requireHumanForProd && action.scope === 'prod') {
    matched = true;
    raise('review');
    reasons.push('prod 范围动作 → 强制人审');
  }
  if (action.riskBase > policy.maxAutoRisk) {
    matched = true;
    raise('review');
    reasons.push(`基础风险 ${action.riskBase} > 自动放行阈值 ${policy.maxAutoRisk} → 需人审`);
  }

  // 4. 无任何规则/守卫命中 → 走默认路径（策略盲区）
  if (sev === -1) {
    matched = false;
    raise(policy.defaultForUnmatched);
    reasons.push(`无规则命中 → 走默认路径（${DEC_LABEL[policy.defaultForUnmatched]}）`);
  }

  const decision = BY_SEV[sev];
  const isAllow = decision === 'allow';
  const radius = isAllow ? blastOf(action) : 0;
  const leaked =
    isAllow && (!action.reversible || action.dataClass === 'pii' || action.dataClass === 'secret');

  return { action, decision, reasons, matchedByRule: matched, leaked, radius };
}

export function evaluateAll(actions: Action[], policy: Policy): Verdict[] {
  return actions.map((a) => evaluate(a, policy));
}

export function score(verdicts: Verdict[], reviewBudget: number): Scorecard {
  const s: Scorecard = {
    total: verdicts.length,
    allow: 0,
    review: 0,
    deny: 0,
    leakedCount: 0,
    blastRadius: 0,
    reviewLoad: 0,
    reviewBudget,
    gaps: 0,
  };
  for (const v of verdicts) {
    s[v.decision] += 1;
    s.blastRadius += v.radius;
    if (v.leaked) s.leakedCount += 1;
    if (!v.matchedByRule) s.gaps += 1;
  }
  s.reviewLoad = s.review;
  return s;
}

export function runPolicy(actions: Action[], policy: Policy) {
  const verdicts = evaluateAll(actions, policy);
  return { verdicts, scorecard: score(verdicts, policy.reviewBudget) };
}

/** 爆炸半径象限分类：仅统计「自动放行」的动作。 */
export function quadrantOf(a: Action): { irreversible: boolean; highImpact: boolean } {
  const highImpact =
    a.scope === 'prod' ||
    a.scope === 'external' ||
    a.dataClass === 'pii' ||
    a.dataClass === 'secret';
  return { irreversible: !a.reversible, highImpact };
}

export const RISK_HINT = { SCOPE_LABEL, DATA_LABEL };
