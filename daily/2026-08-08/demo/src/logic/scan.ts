import type { Claim, ClaimStatus, Scenario, Severity } from '../types';

// 确定性引擎：给定「已采纳的修复集合」，算出每条声明的有效状态、契约健康分与分状态统计。
// 无随机、无副作用——相同输入永远得到相同输出。

export interface EffectiveClaim extends Claim {
  effectiveStatus: ClaimStatus;
  effectiveSeverity: Severity;
  fixed: boolean;
}

export interface ScanResult {
  claims: EffectiveClaim[];
  health: number; // 0–100
  counts: Record<ClaimStatus, number>;
  problemCount: number; // 非 aligned 的声明数
}

// 每条声明对健康分的贡献权重（0–1）。conflict 最伤，aligned 满分。
function weightOf(status: ClaimStatus, severity: Severity): number {
  switch (status) {
    case 'aligned':
      return 1;
    case 'unverifiable':
      return 0.5;
    case 'conflict':
      return 0;
    case 'stale':
      if (severity === 'high') return 0.2;
      if (severity === 'medium') return 0.4;
      return 0.6; // low
  }
}

export function scan(scenario: Scenario, appliedFixes: Set<string>): ScanResult {
  const claims: EffectiveClaim[] = scenario.claims.map((c) => {
    const fixed = Boolean(c.fix) && appliedFixes.has(c.id);
    const effectiveStatus = fixed ? c.fix!.resultStatus : c.status;
    // 修复后：若仍为 unverifiable 保留 low 提示，否则严重度归零。
    const effectiveSeverity: Severity = fixed
      ? effectiveStatus === 'aligned'
        ? 'none'
        : 'low'
      : c.severity;
    return { ...c, fixed, effectiveStatus, effectiveSeverity };
  });

  const counts: Record<ClaimStatus, number> = {
    aligned: 0,
    stale: 0,
    conflict: 0,
    unverifiable: 0,
  };
  let sum = 0;
  for (const c of claims) {
    counts[c.effectiveStatus] += 1;
    sum += weightOf(c.effectiveStatus, c.effectiveSeverity);
  }

  const health = Math.round((100 * sum) / claims.length);
  const problemCount = claims.length - counts.aligned;

  return { claims, health, counts, problemCount };
}

/** 所有可修复声明的 id（用于「一键全部对表」）。 */
export function fixableIds(scenario: Scenario): string[] {
  return scenario.claims.filter((c) => c.fix).map((c) => c.id);
}
