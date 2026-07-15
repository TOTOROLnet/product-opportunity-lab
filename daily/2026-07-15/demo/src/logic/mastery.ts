import type {
  AnswerMap,
  AnswerRecord,
  Confidence,
  Doc,
  MasteryStatus,
  UnitMastery,
} from '../types';

/**
 * 把"作答正确性 × 把握度"映射为单题掌握分（0–100）。
 *
 * 设计理念（主动回忆学习的核心）：
 * - 答对且高把握 → 真掌握；答对但没把握 → 记住了但脆弱，需巩固；
 * - 答错且低把握 → 知道自己不会，好过"自信地错"；
 * - 答错且高把握 → "危险的自信"（confidently wrong），最需要纠偏，给最低分。
 */
export function scoreAnswer(rec: AnswerRecord): number {
  const table: Record<'correct' | 'wrong', Record<Confidence, number>> = {
    correct: { high: 96, mid: 80, low: 64 },
    wrong: { low: 34, mid: 18, high: 4 },
  };
  return table[rec.correct ? 'correct' : 'wrong'][rec.confidence];
}

export function statusOf(score: number, answered: boolean): MasteryStatus {
  if (!answered) return 'weak';
  if (score >= 75) return 'mastered';
  if (score >= 45) return 'shaky';
  return 'weak';
}

/** 计算每个概念单元的掌握情况。 */
export function computeUnitMastery(doc: Doc, answers: AnswerMap): UnitMastery[] {
  return doc.units.map((unit) => {
    const perQ = unit.questions
      .map((q) => answers[unit.id]?.[q.id])
      .filter((r): r is AnswerRecord => Boolean(r));

    const answered = perQ.length > 0;
    const score = answered
      ? Math.round(perQ.reduce((s, r) => s + scoreAnswer(r), 0) / perQ.length)
      : 0;
    const confidentlyWrong = perQ.some((r) => !r.correct && r.confidence === 'high');

    return {
      unitId: unit.id,
      title: unit.title,
      score,
      status: statusOf(score, answered),
      answered,
      confidentlyWrong,
    };
  });
}

/** 被动听（TTS/播客一镜到底）的经验留存基线——教育学经验值，非精确数据。 */
export const PASSIVE_BASELINE = 22;

/**
 * 主动回忆式收听的估算留存：已作答概念掌握分的均值。
 * 若一个都没答，退化为被动听基线。
 */
export function estimatedRetention(mastery: UnitMastery[]): number {
  const answered = mastery.filter((m) => m.answered);
  if (answered.length === 0) return PASSIVE_BASELINE;
  return Math.round(answered.reduce((s, m) => s + m.score, 0) / answered.length);
}

/** 薄弱/模糊概念按掌握分升序，组成"重听队列"。 */
export function relistenQueue(mastery: UnitMastery[]): UnitMastery[] {
  return mastery
    .filter((m) => m.answered && m.status !== 'mastered')
    .sort((a, b) => a.score - b.score);
}

export const STATUS_LABEL: Record<MasteryStatus, string> = {
  mastered: '已掌握',
  shaky: '模糊',
  weak: '薄弱',
};
