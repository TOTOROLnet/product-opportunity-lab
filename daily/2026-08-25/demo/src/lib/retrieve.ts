import type { FleetRun, Fingerprint, Match, MatchReason, Adaptation } from '../types';

// 检索打分：确定性函数。
// 说明：真实系统会用 embedding 对「意图」做语义检索、并对环境指纹做结构匹配；
// 本 Demo 用「关键词重合 + 指纹标签重合」的确定性加权来 *模拟* 这一过程，
// 好处是可解释、可复现，且能诚实地展示「为何匹配」与「适配差异」。

const W_INTENT = 0.55;
const W_ENV = 0.45;

function norm(s: string): string {
  return s.trim().toLowerCase();
}

function intentOverlap(queryKeywords: string[], runKeywords: string[]): { score: number; hits: string[] } {
  if (queryKeywords.length === 0) return { score: 0, hits: [] };
  const runSet = new Set(runKeywords.map(norm));
  const hits: string[] = [];
  for (const k of queryKeywords) {
    if (runSet.has(norm(k))) hits.push(k);
  }
  return { score: hits.length / queryKeywords.length, hits };
}

function envMatch(
  queryFp: Fingerprint[],
  runFp: Fingerprint[],
): { score: number; matched: Fingerprint[]; adaptations: Adaptation[] } {
  if (queryFp.length === 0) return { score: 0, matched: [], adaptations: [] };
  const matched: Fingerprint[] = [];
  const adaptations: Adaptation[] = [];
  for (const q of queryFp) {
    const sameKey = runFp.find((r) => r.key === q.key);
    if (sameKey && norm(sameKey.value) === norm(q.value)) {
      matched.push(q);
    } else if (sameKey && norm(sameKey.value) !== norm(q.value)) {
      // 同一维度但取值不同 —— 可复用，但这一步需要适配
      adaptations.push({ key: q.key, yours: q.value, recipeUses: sameKey.value });
    }
    // 若该运行没有这个维度：既不加分也不算适配（信息缺失，保守处理）
  }
  return { score: matched.length / queryFp.length, matched, adaptations };
}

export function scoreRun(
  queryKeywords: string[],
  queryFp: Fingerprint[],
  run: FleetRun,
): Match {
  const io = intentOverlap(queryKeywords, run.keywords);
  const em = envMatch(queryFp, run.fingerprint);

  const score = Math.round(100 * (W_INTENT * io.score + W_ENV * em.score));

  const reasons: MatchReason[] = [];
  for (const h of io.hits) reasons.push({ kind: 'intent', label: h });
  for (const m of em.matched) reasons.push({ kind: 'env', label: `${m.key}:${m.value}` });

  return {
    run,
    score,
    intentScore: io.score,
    envScore: em.score,
    reasons,
    adaptations: em.adaptations,
  };
}

export interface RetrieveOptions {
  verifiedOnly: boolean;
  minScore?: number; // 低于该分视为「无现成可用」
}

export function retrieve(
  runs: FleetRun[],
  queryKeywords: string[],
  queryFp: Fingerprint[],
  opts: RetrieveOptions,
): Match[] {
  const min = opts.minScore ?? 12;
  let matches = runs.map((r) => scoreRun(queryKeywords, queryFp, r));
  matches = matches.filter((m) => m.score >= min);
  if (opts.verifiedOnly) matches = matches.filter((m) => m.run.verified);
  // 排序：先按分数，分数相近时已验证的优先。
  matches.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.run.verified !== b.run.verified) return a.run.verified ? -1 : 1;
    return 0;
  });
  return matches;
}
