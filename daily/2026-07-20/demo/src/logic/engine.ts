import type {
  ActivityDecision,
  ActivityItem,
  CandidateEval,
  CriticalPair,
  Decision,
  MemoryItem,
  Metrics,
  Mode,
  PushEvent,
  RunResult,
} from '../types';
import { ACTIVITIES, ASSOCIATIONS, MEMORIES, POLICY } from '../data/scenario';

// ── 相关度打分（朴素与知时共用同一套"信号"，差别只在其后的"纪律"）──────────

function assoc(a: string, b: string): number {
  if (a === b) return 0; // 相同标签算"字面命中"，不重复计入关联
  const key = [a, b].sort().join('|');
  return ASSOCIATIONS[key] ?? 0;
}

// 主题相关度：字面命中 + （可选）学习到的主题关联。归一化到 0..1。
function relevance(m: MemoryItem, a: ActivityItem, useAssoc: boolean): number {
  let literal = 0;
  for (const tm of m.topics) {
    if (a.topics.includes(tm)) literal += 1;
  }
  let assocSum = 0;
  if (useAssoc) {
    for (const tm of m.topics) {
      for (const ta of a.topics) {
        assocSum += assoc(tm, ta);
      }
    }
  }
  const base = literal * 1.0 + assocSum * 0.8;
  return Math.min(1, base / Math.max(1, a.topics.length));
}

function importanceWeight(m: MemoryItem): number {
  return m.importance === 'high' ? 1.0 : m.importance === 'med' ? 0.6 : 0.3;
}

function isStale(m: MemoryItem): boolean {
  return !!m.supersededBy;
}

// 知时的综合决策分：相关度 × 重要度。朴素分：仅字面相关度。
function scoreFor(m: MemoryItem, a: ActivityItem, mode: Mode): number {
  if (mode === 'aptly') return relevance(m, a, true) * importanceWeight(m);
  return relevance(m, a, false);
}

// ── 关键时刻（ground truth）：每条"重要且未过时"的记忆，最早变得"当下可行动"的活动 ──
export function computeCriticalPairs(): CriticalPair[] {
  const pairs: CriticalPair[] = [];
  for (const m of MEMORIES) {
    if (m.importance !== 'high' || isStale(m)) continue;
    for (const a of ACTIVITIES) {
      if (relevance(m, a, true) * importanceWeight(m) >= POLICY.aptlyHighThreshold) {
        pairs.push({ memoryId: m.id, activityId: a.id });
        break; // 只取最早的可行动时刻
      }
    }
  }
  return pairs;
}

// ── 核心：在整条时间线上回放某一模式，产出每步决策 + 汇总指标 ──────────────
export function runMode(mode: Mode): RunResult {
  const surfacedAt = new Map<string, number>(); // memoryId -> 首次推送的分钟
  const surfacedMinutes: number[] = []; // 已推送时刻（用于知时预算窗口）
  const perActivity: ActivityDecision[] = [];
  const pushes: PushEvent[] = [];

  for (const a of ACTIVITIES) {
    const candidates: CandidateEval[] = [];
    const surfacedHere: string[] = [];

    // 按分排序，保证"预算有限时优先推高价值"
    const ranked = [...MEMORIES]
      .filter((m) => m.minute <= a.minute) // 只考虑已经发生过的记忆
      .map((m) => ({ m, s: scoreFor(m, a, mode) }))
      .sort((x, y) => y.s - x.s);

    for (const { m, s } of ranked) {
      const rel = relevance(m, a, mode === 'aptly');
      let decision: Decision;
      let reason: string;

      if (mode === 'naive') {
        // 朴素：字面相关度 ≥ 低阈值即推送。不去重、不判过时、无预算。
        if (rel >= POLICY.naiveLowThreshold) {
          decision = 'SHOW';
          reason = `字面相关度 ${rel.toFixed(2)} ≥ ${POLICY.naiveLowThreshold}，直接推送（不去重/不判过时/无预算）`;
        } else {
          decision = 'HOLD';
          reason = `字面相关度 ${rel.toFixed(2)} < ${POLICY.naiveLowThreshold}，不相关`;
        }
      } else {
        // 知时：阈值 → 过时抑制 → 去重 → 预算，层层"克制"。
        if (s < POLICY.aptlyHighThreshold) {
          decision = 'HOLD';
          reason = `综合分 ${s.toFixed(2)} < ${POLICY.aptlyHighThreshold}（相关度或重要度不足），保持安静`;
        } else if (isStale(m)) {
          decision = 'SUPPRESS_STALE';
          reason = `已被更新版本（${m.supersededBy}）取代，抑制过时信息`;
        } else if (surfacedAt.has(m.id)) {
          decision = 'DEDUP';
          reason = `同一条记忆已提示过，不再重复打扰`;
        } else {
          const windowStart = a.minute - POLICY.windowMinutes;
          const usedInWindow = surfacedMinutes.filter((mm) => mm > windowStart && mm <= a.minute).length;
          if (usedInWindow >= POLICY.budgetPerWindow) {
            decision = 'BUDGET';
            reason = `本 ${POLICY.windowMinutes} 分钟窗口打扰已达上限 ${POLICY.budgetPerWindow}，延后`;
          } else {
            decision = 'SHOW';
            reason = `综合分 ${s.toFixed(2)} ≥ ${POLICY.aptlyHighThreshold}，重要且当下可行动、未过时、未重复、预算内 → 主动提示`;
          }
        }
      }

      if (decision === 'SHOW') {
        if (!surfacedAt.has(m.id)) surfacedAt.set(m.id, a.minute);
        surfacedMinutes.push(a.minute);
        surfacedHere.push(m.id);
      }

      candidates.push({ memoryId: m.id, relevance: rel, score: s, decision, reason });
    }

    perActivity.push({ activityId: a.id, candidates, surfaced: surfacedHere });
  }

  // ── 逐条推送标注 useful / stale / duplicate ──
  const firstSurface = new Map<string, string>(); // memoryId -> 首个推送它的 activityId
  for (const ad of perActivity) {
    for (const mid of ad.surfaced) {
      if (!firstSurface.has(mid)) firstSurface.set(mid, ad.activityId);
    }
  }
  const memById = new Map(MEMORIES.map((m) => [m.id, m]));
  const actById = new Map(ACTIVITIES.map((a) => [a.id, a]));
  for (const ad of perActivity) {
    for (const mid of ad.surfaced) {
      const m = memById.get(mid)!;
      const a = actById.get(ad.activityId)!;
      const duplicate = firstSurface.get(mid) !== ad.activityId;
      const stale = isStale(m);
      const actionableNow = relevance(m, a, true) * importanceWeight(m) >= POLICY.aptlyHighThreshold;
      const useful = m.importance === 'high' && !stale && !duplicate && actionableNow;
      pushes.push({ activityId: ad.activityId, memoryId: mid, useful, stale, duplicate });
    }
  }

  const metrics = computeMetrics(perActivity, pushes);
  return { mode, perActivity, pushes, metrics };
}

function computeMetrics(perActivity: ActivityDecision[], pushes: PushEvent[]): Metrics {
  const interruptions = pushes.length;
  const useful = pushes.filter((p) => p.useful).length;
  const harmful = pushes.filter((p) => p.stale).length;
  const precision = interruptions === 0 ? 1 : useful / interruptions;

  const critical = computeCriticalPairs();
  const surfacedPairs = new Set(perActivity.flatMap((ad) => ad.surfaced.map((mid) => `${mid}@${ad.activityId}`)));
  const criticalCovered = critical.filter((c) => surfacedPairs.has(`${c.memoryId}@${c.activityId}`)).length;

  // 理应安静的活动 = 不是任何关键时刻的活动。
  const criticalActs = new Set(critical.map((c) => c.activityId));
  const silenceActs = ACTIVITIES.filter((a) => !criticalActs.has(a.id));
  const surfacedByAct = new Map(perActivity.map((ad) => [ad.activityId, ad.surfaced.length]));
  const correctSilence = silenceActs.filter((a) => (surfacedByAct.get(a.id) ?? 0) === 0).length;

  return {
    interruptions,
    useful,
    precision,
    criticalCovered,
    criticalTotal: critical.length,
    harmful,
    correctSilence,
    silenceTotal: silenceActs.length,
  };
}

export function runAll(): Record<Mode, RunResult> {
  return { naive: runMode('naive'), aptly: runMode('aptly') };
}
