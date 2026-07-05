import type { Scenario, Finding, Recommendation, Severity } from '../types';

export interface Verdict {
  /** Agent 自称的完成度 —— 它总说"完成了、改动很小"，恒为 100。 */
  agentScore: number;
  /** Contour 依据意图/不变量 findings 得出的"意图保真分"。 */
  contourScore: number;
  recommendation: Recommendation;
  critical: number;
  warn: number;
  info: number;
  /** 有多少条风险在行级 diff 里根本看不见（核心价值主张）。 */
  invisibleCount: number;
}

const WEIGHT: Record<Severity, number> = {
  critical: 30,
  warn: 12,
  info: 0,
};

export function countBySeverity(findings: Finding[], sev: Severity): number {
  return findings.filter((f) => f.severity === sev).length;
}

/**
 * 确定性评分：从"Agent 自称 100 分"出发，按 finding 严重度扣分，得到"意图保真分"。
 * info 不扣分（预期改动），warn 各 -12，critical 各 -30，下限 0。
 * 推荐档：有 critical → BLOCK；否则有 warn → REVIEW；否则 SAFE。
 */
export function computeVerdict(scenario: Scenario): Verdict {
  const critical = countBySeverity(scenario.findings, 'critical');
  const warn = countBySeverity(scenario.findings, 'warn');
  const info = countBySeverity(scenario.findings, 'info');
  const invisibleCount = scenario.findings.filter((f) => f.invisibleInLineDiff).length;

  const penalty = critical * WEIGHT.critical + warn * WEIGHT.warn + info * WEIGHT.info;
  const contourScore = Math.max(0, 100 - penalty);

  let recommendation: Recommendation = 'SAFE';
  if (critical > 0) recommendation = 'BLOCK';
  else if (warn > 0) recommendation = 'REVIEW';

  return { agentScore: 100, contourScore, recommendation, critical, warn, info, invisibleCount };
}

const SEVERITY_ORDER: Record<Severity, number> = { critical: 0, warn: 1, info: 2 };

/** 按严重度排序：Critical 顶到最前，这是"狙击高危改动"的关键交互。 */
export function sortFindings(findings: Finding[]): Finding[] {
  return [...findings].sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
}
