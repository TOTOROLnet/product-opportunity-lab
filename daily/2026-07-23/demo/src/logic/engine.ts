import type {
  Attempt,
  DiagnosisResult,
  Outcome,
  Signature,
  SignatureDiagnosis,
  SignatureId,
} from '../types';
import { CORPUS, SIGNATURES } from '../data/corpus';

// ─────────────────────────────────────────────────────────────────────────────
// 上手 Knack — 确定性诊断引擎
// 同一套逻辑同时驱动「诊断台」与「长进」两页：给定「已掌握的招式集合」，
// 计算每条协作的质量分、聚合出上手指数与各项指标。掌握一招≠该失手清零：
// 招式使该 primary 失手的伤害按 70% 修复（残留 30%），保证长进真实、不会瞬间满分。
// ─────────────────────────────────────────────────────────────────────────────

const IDEAL_SCORE = 0.95; // 即便掌握了招式，也不假设做到满分
const FIX_STRENGTH = 0.7; // 掌握一招后，对该失手伤害的修复比例

/** 单条协作的「质量分」0..1（越高越好） */
export function attemptScore(rounds: number, outcome: Outcome): number {
  if (outcome === 'gaveup') return 0;
  if (outcome === 'settled') return 0.4;
  // satisfied：一次过为 1.0，每多一轮扣 0.12，最低 0.5
  return Math.max(0.5, 1 - 0.12 * (rounds - 1));
}

/** 掌握 primary 招式后，这条协作的「修复后」轮数与结果 */
function repaired(a: Attempt): { rounds: number; outcome: Outcome; score: number } {
  const base = attemptScore(a.rounds, a.outcome);
  const score = base + FIX_STRENGTH * (IDEAL_SCORE - base);
  const rounds = Math.max(1, Math.round(1 + (a.rounds - 1) * (1 - FIX_STRENGTH)));
  // 由修复后的质量分反推展示用的结果标签
  const outcome: Outcome = score >= 0.75 ? 'satisfied' : score >= 0.4 ? 'settled' : 'gaveup';
  return { rounds, outcome, score };
}

/** 给定已掌握招式集合，得到每条协作的有效（轮数、结果、分数） */
function effectiveAttempts(
  mastered: Set<SignatureId>,
): Array<{ a: Attempt; rounds: number; outcome: Outcome; score: number }> {
  return CORPUS.map((a) => {
    if (mastered.has(a.primary)) {
      const r = repaired(a);
      return { a, ...r };
    }
    return { a, rounds: a.rounds, outcome: a.outcome, score: attemptScore(a.rounds, a.outcome) };
  });
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/**
 * 运行一次全量诊断。
 * @param mastered 已掌握的招式集合（默认空集 = 基线「生手」画像）
 */
export function diagnose(mastered: Set<SignatureId> = new Set()): DiagnosisResult {
  const eff = effectiveAttempts(mastered);
  const total = eff.length;

  const meanScore = eff.reduce((s, e) => s + e.score, 0) / total;
  const proficiency = Math.round(meanScore * 100);

  const firstPass = eff.filter((e) => e.outcome === 'satisfied' && e.rounds === 1).length;
  const gaveup = eff.filter((e) => e.outcome === 'gaveup').length;
  const settled = eff.filter((e) => e.outcome === 'settled').length;
  const avgRounds = round1(eff.reduce((s, e) => s + e.rounds, 0) / total);

  // 比率保留原始精度（0..1），只在展示时 Math.round(x*100)，避免 0.15→0.2 之类的取整失真

  // 按 primary 聚合每个失手签名的诊断（用"当前有效状态"计算，掌握后残余也会体现）
  const perSignature: SignatureDiagnosis[] = (Object.keys(SIGNATURES) as SignatureId[])
    .map((sid) => {
      const sig: Signature = SIGNATURES[sid];
      const group = eff.filter((e) => e.a.primary === sid);
      const frequency = group.length;
      const totalExtraRounds = group.reduce((s, e) => s + Math.max(0, e.rounds - 1), 0);
      const lostQuality = group.reduce((s, e) => s + (1 - e.score), 0);
      const impact = round1(sig.severity * lostQuality);
      return {
        signature: sig,
        frequency,
        totalExtraRounds,
        avgExtraRounds: frequency ? round1(totalExtraRounds / frequency) : 0,
        impact,
        exampleIds: group.map((e) => e.a.id),
      };
    })
    .filter((d) => d.frequency > 0)
    .sort((x, y) => y.impact - x.impact || y.frequency - x.frequency);

  return {
    proficiency,
    firstPassRate: firstPass / total,
    avgRounds,
    gaveupRate: gaveup / total,
    settledRate: settled / total,
    perSignature,
    total,
  };
}

/** 便捷：基线（未掌握任何招式）诊断 */
export function baseline(): DiagnosisResult {
  return diagnose(new Set());
}

/** Top-N 影响力最大的失手签名 id（基于基线诊断） */
export function topSignatures(n: number): SignatureId[] {
  return baseline()
    .perSignature.slice(0, n)
    .map((d) => d.signature.id);
}
