import type { AgentRun, Claim, Verdict } from '../types';

// 判定 → 权重。核验的核心张力：agent 自称 100% 完成，但证据只支撑其中一部分。
// contradicted 给负分作为惩罚（被证据反证比"没证据"更糟）。
export const VERDICT_WEIGHT: Record<Verdict, number> = {
  verified: 1,
  weak: 0.5,
  unsupported: 0,
  contradicted: -0.5,
};

export const VERDICT_LABEL: Record<Verdict, string> = {
  verified: '有证据支撑',
  weak: '证据薄弱',
  unsupported: '无证据',
  contradicted: '被证据反证',
};

export const VERDICT_SHORT: Record<Verdict, string> = {
  verified: 'Verified',
  weak: 'Weak',
  unsupported: 'Unsupported',
  contradicted: 'Contradicted',
};

// 自述信任分：agent 把每条 claim 都当作"已完成"陈述，所以它眼里永远是 100%。
export const SELF_REPORTED_SCORE = 100;

// 证据信任分：对每条 claim 的判定权重求平均，clamp 到 [0,1]，再 ×100。
export function evidenceScore(claims: Claim[]): number {
  if (claims.length === 0) return 0;
  const sum = claims.reduce((acc, c) => acc + VERDICT_WEIGHT[c.verdict], 0);
  const avg = sum / claims.length;
  const clamped = Math.max(0, Math.min(1, avg));
  return Math.round(clamped * 100);
}

export function countByVerdict(claims: Claim[]): Record<Verdict, number> {
  const base: Record<Verdict, number> = {
    verified: 0,
    weak: 0,
    unsupported: 0,
    contradicted: 0,
  };
  for (const c of claims) base[c.verdict] += 1;
  return base;
}

// 需要人工重点复核的声明：没有证据的 + 被反证的。
export function riskyClaims(claims: Claim[]): Claim[] {
  return claims.filter((c) => c.verdict === 'unsupported' || c.verdict === 'contradicted');
}

// 声明缺口：有 claim 却连不到任何证据（unsupported，evidenceIds 为空）。
export function claimGaps(run: AgentRun): Claim[] {
  return run.claims.filter((c) => c.evidenceIds.length === 0);
}

// 孤儿证据：本次运行里存在、却没有任何 claim 引用它的 artifact。
export function orphanEvidence(run: AgentRun): string[] {
  const referenced = new Set<string>();
  for (const c of run.claims) for (const id of c.evidenceIds) referenced.add(id);
  return run.evidence.filter((e) => !referenced.has(e.id)).map((e) => e.id);
}
