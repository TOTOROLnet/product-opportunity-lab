// 众读 Zhòngdú — 接收引擎（纯函数，确定性）
// 输入：一段样本文字 + 脚本化读者反应 + 当前勾选的“改法”；
// 输出：逐读者阅读轨迹、回放事件流、句级热力图、目标读者流失点、Top 摩擦点、接收分。
// 数值全部由脚本化 mock 反应推导，无随机、无外部依赖。

import type {
  Analysis,
  Edit,
  Friction,
  Reaction,
  Reader,
  ReaderTrace,
  ReplayEvent,
  Sample,
  SampleData,
  SentenceHeat,
  ReactionKind,
  TraceStep,
} from '../types';

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));

const SEVERITY: Record<ReactionKind, number> = {
  drop: 4,
  skeptical: 3,
  confused: 2,
  bored: 1,
  engaged: 0,
};

export const KIND_LABEL: Record<ReactionKind, string> = {
  engaged: '投入',
  bored: '走神',
  confused: '困惑',
  skeptical: '反感',
  drop: '流失',
};

const key = (readerId: string, sentenceId: string) => `${readerId}|${sentenceId}`;

// 解析当前反应表：基线 + 勾选的改法覆盖（后应用的改法覆盖先前）
export function resolveReactions(data: SampleData, activeEditIds: string[]): Map<string, Reaction> {
  const map = new Map<string, Reaction>();
  for (const r of data.baseReactions) map.set(key(r.readerId, r.sentenceId), r);
  for (const e of data.edits) {
    if (!activeEditIds.includes(e.id)) continue;
    for (const o of e.overrides) map.set(key(o.readerId, o.sentenceId), o);
  }
  return map;
}

// 单个读者的阅读轨迹：逐句累计注意力，命中 drop 或注意力见底则弃读
export function readerTrace(
  sample: Sample,
  reader: Reader,
  reactions: Map<string, Reaction>,
): ReaderTrace {
  let attention = clamp(reader.patience);
  let dropped = false;
  let dropIndex: number | null = null;
  const steps: TraceStep[] = [];

  sample.sentences.forEach((s, i) => {
    const index = i + 1;
    if (dropped) {
      steps.push({
        sentenceId: s.id,
        index,
        kind: 'drop',
        note: '（已离开，未读到此处）',
        attentionAfter: 0,
        dropped: true,
      });
      return;
    }
    const r = reactions.get(key(reader.id, s.id));
    // 数据完整性：每个 (reader, sentence) 都应有反应；缺失则视为中性 bored，避免静默崩坏
    const kind: ReactionKind = r ? r.kind : 'bored';
    const delta = r ? r.attentionDelta : -5;
    const note = r ? r.note : '（无脚本反应）';

    attention = clamp(attention + delta);
    let stepDropped = false;
    if (kind === 'drop' || attention <= 0) {
      stepDropped = true;
      dropped = true;
      dropIndex = index;
      attention = 0;
    }
    steps.push({ sentenceId: s.id, index, kind, note, attentionAfter: attention, dropped: stepDropped });
  });

  const sentencesRead = dropIndex ?? sample.sentences.length;
  const readThroughRatio = sentencesRead / sample.sentences.length;
  const finalAttention = attention;
  const score = Math.round(50 * readThroughRatio + 50 * (finalAttention / 100));

  return { readerId: reader.id, steps, dropIndex, finalAttention, readThroughRatio, score };
}

function readThisSentence(trace: ReaderTrace, index: number): boolean {
  return trace.dropIndex === null || index <= trace.dropIndex;
}

// 句级热力：取“读到该句的读者”里最严重的反应等级为主导等级
export function buildHeatmap(
  sample: Sample,
  traces: ReaderTrace[],
): SentenceHeat[] {
  return sample.sentences.map((s, i) => {
    const index = i + 1;
    const byReader = traces.map((t) => {
      const step = t.steps[i];
      const reached = readThisSentence(t, index);
      return {
        readerId: t.readerId,
        kind: reached ? step.kind : ('drop' as ReactionKind),
        note: reached ? step.note : '（未读到此处）',
        dropped: !reached || step.dropped,
      };
    });
    const reached = byReader.filter((b) => b.note !== '（未读到此处）');
    let level: ReactionKind = 'engaged';
    if (reached.length === 0) {
      level = 'drop';
    } else {
      for (const b of reached) {
        if (SEVERITY[b.kind] > SEVERITY[level]) level = b.kind;
      }
    }
    return { sentenceId: s.id, index, level, byReader };
  });
}

// 逐句、逐读者交织成回放事件流（先按句子顺序，再按面板顺序）
export function replayEvents(sample: Sample, traces: ReaderTrace[]): ReplayEvent[] {
  const events: ReplayEvent[] = [];
  let order = 0;
  sample.sentences.forEach((s, i) => {
    traces.forEach((t) => {
      const step = t.steps[i];
      const reached = readThisSentence(t, i + 1);
      if (!reached) return; // 已离开的读者不再产生新事件
      events.push({
        order: order++,
        readerId: t.readerId,
        sentenceId: s.id,
        sentenceIndex: i + 1,
        kind: step.kind,
        note: step.note,
        attentionAfter: step.attentionAfter,
        dropped: step.dropped,
      });
    });
  });
  return events;
}

// Top 摩擦点：按严重度排序，目标读者踩雷额外加权
export function topFrictions(
  sample: Sample,
  traces: ReaderTrace[],
  heatmap: SentenceHeat[],
  targetReaderId: string,
): Friction[] {
  const frictions: Friction[] = [];
  heatmap.forEach((h) => {
    if (SEVERITY[h.level] === 0) return; // engaged 不算摩擦
    const negatives = h.byReader.filter(
      (b) => b.note !== '（未读到此处）' && SEVERITY[b.kind] > 0,
    );
    if (negatives.length === 0) return;
    const targetNeg = negatives.find((b) => b.readerId === targetReaderId);
    const severity =
      SEVERITY[h.level] * 10 + negatives.length + (targetNeg ? 6 : 0);
    const lead = targetNeg ?? negatives.slice().sort((a, b) => SEVERITY[b.kind] - SEVERITY[a.kind])[0];
    frictions.push({
      sentenceId: h.sentenceId,
      index: h.index,
      severity,
      kind: h.level,
      reason: lead.note,
      readerIds: negatives.map((n) => n.readerId),
    });
  });
  return frictions.sort((a, b) => b.severity - a.severity).slice(0, 3);
}

export function analyze(
  data: SampleData,
  readerPool: Record<string, Reader>,
  activeEditIds: string[],
): Analysis {
  const reactions = resolveReactions(data, activeEditIds);
  const traces = data.sample.panel.map((rid) => readerTrace(data.sample, readerPool[rid], reactions));
  const heatmap = buildHeatmap(data.sample, traces);
  const targetTrace = traces.find((t) => t.readerId === data.sample.targetReaderId)!;
  const nonTarget = traces.filter((t) => t.readerId !== data.sample.targetReaderId);
  const avgNon = nonTarget.length
    ? nonTarget.reduce((a, t) => a + t.score, 0) / nonTarget.length
    : targetTrace.score;
  const receptionScore = Math.round(0.5 * targetTrace.score + 0.5 * avgNon);
  const frictions = topFrictions(data.sample, traces, heatmap, data.sample.targetReaderId);

  return {
    traces,
    heatmap,
    targetDropIndex: targetTrace.dropIndex,
    topFrictions: frictions,
    receptionScore,
  };
}
