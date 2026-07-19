// 并笔 CoBaton — 确定性协调引擎
// -----------------------------------------------------------------------------
// 把同一条"人机共写"事件序列，分别用两种模式归约成逐步快照：
//   - naive   : last-write-wins / agent 自由编辑（无协调）——现状。
//   - cobaton : 区域所有权状态机 + 接力棒移交 + 延后/再校验（我们的创新切入点）。
// 指标（丢失编辑 / 被打断 / 白做）由引擎在归约过程中算出，绝非硬编码。
// -----------------------------------------------------------------------------

import type {
  Doc,
  Highlight,
  Metrics,
  Mode,
  Owner,
  RunResult,
  Section,
  SectionId,
  TimelineEvent,
  TraceStep,
} from '../types';

function cloneDoc(doc: Doc): Doc {
  return doc.map((s) => ({ ...s }));
}

function findSection(doc: Doc, id: SectionId): Section | undefined {
  return doc.find((s) => s.id === id);
}

/** agent 意图正文与人补充文本合并（再校验的结果：保留人补的那句）。 */
function mergeBodies(agentBody: string, humanText: string): string {
  return `${agentBody}\n${humanText}`;
}

interface EngineState {
  doc: Doc;
  ownership: Record<SectionId, Owner>;
  humanFocus: SectionId | null;
  /** agent 声明/意图落改的正文（按小节）。 */
  agentIntent: Record<SectionId, string>;
  /** CoBaton：因人正在该小节而被延后的 agent 意图正文。 */
  deferred: Record<SectionId, string>;
  /** naive：agent 已实际写入过该小节（用于"删除后判定白做"）。 */
  agentEditApplied: Record<SectionId, boolean>;
  /** 人在各小节补充的文本（用于合并/保留判定）。 */
  humanEditText: Record<SectionId, string>;
  lostHumanEdits: number;
  interruptions: number;
  wastedAgentEdits: number;
}

function initState(doc0: Doc): EngineState {
  const ownership: Record<SectionId, Owner> = {};
  for (const s of doc0) ownership[s.id] = 'free';
  return {
    doc: cloneDoc(doc0),
    ownership,
    humanFocus: null,
    agentIntent: {},
    deferred: {},
    agentEditApplied: {},
    humanEditText: {},
    lostHumanEdits: 0,
    interruptions: 0,
    wastedAgentEdits: 0,
  };
}

/** 由当前文档状态派生"你的编辑"保留率（诚实：来自真实文档内容而非计数器）。 */
function computePreserved(state: EngineState): { total: number; preserved: number } {
  const ids = Object.keys(state.humanEditText);
  let preserved = 0;
  for (const id of ids) {
    const sec = findSection(state.doc, id);
    if (sec && !sec.deleted && sec.body.includes(state.humanEditText[id])) preserved += 1;
  }
  return { total: ids.length, preserved };
}

function snapshotMetrics(state: EngineState): Metrics {
  const { total, preserved } = computePreserved(state);
  return {
    lostHumanEdits: state.lostHumanEdits,
    interruptions: state.interruptions,
    wastedAgentEdits: state.wastedAgentEdits,
    humanEditsTotal: total,
    humanEditsPreserved: preserved,
  };
}

function pendingList(state: EngineState): SectionId[] {
  return Object.keys(state.deferred);
}

function shortOf(doc: Doc, id?: SectionId): string {
  if (!id) return '';
  return findSection(doc, id)?.short ?? id;
}

/** 处理单个事件，就地更新 state，返回本步的 note 与 highlight。 */
function applyEvent(
  state: EngineState,
  ev: TimelineEvent,
  mode: Mode,
): { note: string; highlight: Highlight } {
  const hl: Highlight = {};
  const sid = ev.section;
  const label = () => shortOf(state.doc, sid);

  switch (ev.type) {
    case 'agent_task': {
      return { note: `🤖 agent 领取任务：「${ev.desc ?? ''}」`, highlight: hl };
    }

    case 'human_focus': {
      if (sid) {
        state.humanFocus = sid;
        state.ownership[sid] = 'human';
        hl.humanActive = sid;
      }
      return { note: `🧑 你聚焦 §${label()}（光标进入，开始查看/编辑）`, highlight: hl };
    }

    case 'human_edit': {
      if (sid && ev.humanText) {
        const sec = findSection(state.doc, sid);
        if (sec) sec.body = `${sec.body} ${ev.humanText}`;
        state.humanEditText[sid] = ev.humanText;
        hl.humanActive = sid;
      }
      return { note: `🧑 你在 §${label()} 补了一句：「${ev.humanText ?? ''}」`, highlight: hl };
    }

    case 'human_blur': {
      if (sid) {
        if (state.humanFocus === sid) state.humanFocus = null;
        state.ownership[sid] = 'free';
        hl.humanActive = null;

        // CoBaton：接力棒移交——若该小节有延后的 agent 意图，现在再校验后落改。
        if (mode === 'cobaton' && state.deferred[sid] !== undefined) {
          const agentBody = state.deferred[sid];
          delete state.deferred[sid];
          const sec = findSection(state.doc, sid);
          const humanText = state.humanEditText[sid];
          if (sec) {
            if (humanText && !agentBody.includes(humanText)) {
              // 陈旧 claim：人已在此处补过内容 → agent 基于最新改动再推导，保留人补的那句。
              sec.body = mergeBodies(agentBody, humanText);
              state.agentEditApplied[sid] = true;
              hl.revalidatedAt = sid;
              hl.agentEdited = sid;
              return {
                note: `🔁 你离开 §${label()} → 执笔权移交；agent 的改写基于你的最新改动**重新校验**后落改（保留了你补的那句）`,
                highlight: hl,
              };
            }
            sec.body = agentBody;
            state.agentEditApplied[sid] = true;
            hl.agentEdited = sid;
            return {
              note: `🔁 你离开 §${label()} → 执笔权移交；agent 落改（无需合并）`,
              highlight: hl,
            };
          }
        }
      }
      return { note: `🧑 你离开 §${label()}`, highlight: hl };
    }

    case 'agent_claim': {
      if (sid && ev.agentBody !== undefined) {
        state.agentIntent[sid] = ev.agentBody;
        if (mode === 'cobaton') {
          if (state.ownership[sid] === 'human') {
            state.deferred[sid] = ev.agentBody;
            hl.deferredAt = sid;
            return {
              note: `🤖 agent 声明想改 §${label()}，但你正在此处 → **延后**（绝不打断你）`,
              highlight: hl,
            };
          }
          // 空闲 → 认领，进入 AGENT_WORKING，可与你在别处并行。
          state.ownership[sid] = 'agent';
          return { note: `🤖 agent 认领 §${label()}（此处空闲，可并行推进）`, highlight: hl };
        }
        // naive：无协调，声明被忽略。
        return { note: `🤖 agent 声明想改 §${label()}（朴素模式无协调，直接忽略）`, highlight: hl };
      }
      return { note: 'agent_claim', highlight: hl };
    }

    case 'agent_edit': {
      if (!sid) return { note: 'agent_edit', highlight: hl };
      const sec = findSection(state.doc, sid);
      const agentBody = state.agentIntent[sid] ?? ev.agentBody ?? '';

      if (mode === 'naive') {
        // 覆盖式写入，无视你是否正在此处。
        const humanText = state.humanEditText[sid];
        const clobbersHuman = humanText && sec && sec.body.includes(humanText);
        if (sec) sec.body = agentBody;
        state.agentEditApplied[sid] = true;
        hl.agentEdited = sid;
        let note = `🤖 agent 覆盖式重写 §${label()}`;
        if (clobbersHuman) {
          state.lostHumanEdits += 1;
          hl.lostAt = sid;
          note += `　⚠️ 你刚补的那句被静默覆盖 —— 编辑丢失`;
        }
        if (state.humanFocus === sid) {
          state.interruptions += 1;
          hl.interruptedAt = sid;
          note += `　⚠️ 你正在此处 —— 光标/心流被打断`;
        }
        return { note, highlight: hl };
      }

      // CoBaton
      if (state.ownership[sid] === 'human') {
        // 你仍在此处 → 继续延后，绝不覆盖。
        state.deferred[sid] = agentBody;
        hl.deferredAt = sid;
        return {
          note: `🤖 agent 想落改 §${label()}，但你仍在此处 → 继续**延后**，绝不覆盖`,
          highlight: hl,
        };
      }
      if (state.ownership[sid] === 'agent') {
        if (sec) sec.body = agentBody;
        state.agentEditApplied[sid] = true;
        state.ownership[sid] = 'free';
        hl.agentEdited = sid;
        hl.parallelAt = sid;
        return { note: `🤖 agent 在 §${label()} 落改（与你在别处并行，无冲突）`, highlight: hl };
      }
      // 无人占用且未认领：直接落改。
      if (sec) sec.body = agentBody;
      state.agentEditApplied[sid] = true;
      hl.agentEdited = sid;
      return { note: `🤖 agent 落改 §${label()}`, highlight: hl };
    }

    case 'human_delete': {
      if (sid) {
        const sec = findSection(state.doc, sid);
        if (sec) sec.deleted = true;
        hl.deletedAt = sid;
        if (mode === 'naive') {
          if (state.agentEditApplied[sid]) {
            state.wastedAgentEdits += 1;
            hl.wastedAt = sid;
            return {
              note: `🧑 你删除 §${label()} → agent 刚才对它的改写**白做了**`,
              highlight: hl,
            };
          }
        } else {
          // CoBaton：agent 从未真正动它（延后中）→ 直接作废延后意图，没有白做。
          if (state.deferred[sid] !== undefined) {
            delete state.deferred[sid];
            return {
              note: `🧑 你删除 §${label()} → agent 的延后改写随之作废（它**没有白做**）`,
              highlight: hl,
            };
          }
        }
        return { note: `🧑 你删除 §${label()}`, highlight: hl };
      }
      return { note: 'human_delete', highlight: hl };
    }

    default:
      return { note: '', highlight: hl };
  }
}

/** 判定最终文档是否"一致"：你的编辑全保留 且 agent 的 v2 更新都在。 */
function isConsistent(state: EngineState): boolean {
  const { total, preserved } = computePreserved(state);
  if (total > 0 && preserved !== total) return false;
  // agent 更新是否落地：所有被 agent 声明过、且未删除的小节应包含其 v2 意图正文。
  for (const id of Object.keys(state.agentIntent)) {
    const sec = findSection(state.doc, id);
    if (!sec || sec.deleted) continue;
    if (!sec.body.includes(state.agentIntent[id])) return false;
  }
  return true;
}

/** 用指定模式回放整条时间轴，返回逐步 trace 与最终结果。 */
export function runTimeline(doc0: Doc, events: TimelineEvent[], mode: Mode): RunResult {
  const state = initState(doc0);
  const steps: TraceStep[] = [];

  for (const ev of events) {
    const { note, highlight } = applyEvent(state, ev, mode);
    steps.push({
      event: ev,
      doc: cloneDoc(state.doc),
      ownership: { ...state.ownership },
      pending: pendingList(state),
      note,
      highlight,
      metrics: snapshotMetrics(state),
    });
  }

  return {
    mode,
    steps,
    final: snapshotMetrics(state),
    finalDoc: cloneDoc(state.doc),
    consistent: isConsistent(state),
  };
}

/** 便捷：一次性跑两种模式，供对比页使用。 */
export function runBoth(doc0: Doc, events: TimelineEvent[]): Record<Mode, RunResult> {
  return {
    naive: runTimeline(doc0, events, 'naive'),
    cobaton: runTimeline(doc0, events, 'cobaton'),
  };
}
