import type {
  Trajectory,
  ContextItem,
  CompactionEvent,
  FoldState,
  FoldRow,
  CompactionResult,
  Incident,
  RunStep,
  RunResult,
} from './types';

// ————————————————————————————————————————————————————————————————
// 留痕 Liúhén 的确定性模拟引擎
// 输入：轨迹 + 保命清单（pinned item ids）
// 输出：每次压缩的折叠差异 / 风险分 / token 账单 / 事故回放 / 最终结局
// 规则可解释、无随机：钉住 => 强制 'kept'（绝不丢）；只有「完全丢弃」才会引爆事故。
// ————————————————————————————————————————————————————————————————

function itemById(traj: Trajectory, id: string): ContextItem {
  const it = traj.items.find((x) => x.id === id);
  if (!it) throw new Error(`unknown item ${id}`);
  return it;
}

// lossy（有损压缩）保住要点，估算省下约 55% 的 token
const LOSSY_SAVE_RATIO = 0.55;

// 单个条目在某状态下省下的 token
function savedTokens(item: ContextItem, state: FoldState): number {
  if (state === 'dropped') return item.tokens;
  if (state === 'lossy') return Math.round(item.tokens * LOSSY_SAVE_RATIO);
  return 0;
}

// 单个条目在某状态下贡献的风险分（丢弃=全额，有损=半额，保留=0）
function riskOf(item: ContextItem, state: FoldState): number {
  if (state === 'dropped') return item.riskWeight;
  if (state === 'lossy') return Math.round(item.riskWeight * 0.5);
  return 0;
}

// 计算一次压缩事件在给定保命清单下的结果
export function evaluateCompaction(
  traj: Trajectory,
  event: CompactionEvent,
  pinned: Set<string>,
): CompactionResult {
  const rows: FoldRow[] = event.windowItemIds.map((id) => {
    const item = itemById(traj, id);
    const defaultState = event.defaultFold[id] ?? 'kept';
    const isPinned = pinned.has(id);
    const effectiveState: FoldState = isPinned ? 'kept' : defaultState;
    const protectedItem = effectiveState !== 'dropped';
    const triggersIncident = !protectedItem && item.causesDriftAtStep !== undefined;
    return {
      item,
      defaultState,
      effectiveState,
      pinned: isPinned,
      protected: protectedItem,
      triggersIncident,
    };
  });

  const tokensSaved = rows.reduce((s, r) => s + savedTokens(r.item, r.effectiveState), 0);
  const riskScore = rows.reduce((s, r) => s + riskOf(r.item, r.effectiveState), 0);

  return { event, rows, tokensSaved, riskScore };
}

// 跑完整条轨迹，产出可回放的时间线与账单
export function runTrajectory(traj: Trajectory, pinnedList: string[]): RunResult {
  const pinned = new Set(pinnedList);
  const compactions = traj.compactions.map((e) => evaluateCompaction(traj, e, pinned));

  // 收集所有被引爆的事故
  const incidents: Incident[] = [];
  for (const cr of compactions) {
    for (const row of cr.rows) {
      if (row.triggersIncident) {
        const it = row.item;
        incidents.push({
          atStep: it.causesDriftAtStep!,
          itemId: it.id,
          itemLabel: it.label,
          severity: it.severity ?? 'rework',
          note: it.driftNote ?? '',
          wastedTokens: it.wastedTokens ?? 0,
        });
      }
    }
  }
  incidents.sort((a, b) => a.atStep - b.atStep);

  const tokensSaved = compactions.reduce((s, c) => s + c.tokensSaved, 0);
  const tokensWasted = incidents.reduce((s, i) => s + i.wastedTokens, 0);
  const totalRisk = compactions.reduce((s, c) => s + c.riskScore, 0);
  const fatalCount = incidents.filter((i) => i.severity === 'fatal').length;
  const reworkCount = incidents.filter((i) => i.severity === 'rework').length;
  const outcome: 'PASS' | 'FAIL' = fatalCount > 0 ? 'FAIL' : 'PASS';

  // 组装可逐步回放的时间线：基础步 + 压缩摘要 + 事故行 + 结局行
  const timeline: RunStep[] = [];
  const incidentByStep = new Map<number, Incident[]>();
  for (const inc of incidents) {
    const arr = incidentByStep.get(inc.atStep) ?? [];
    arr.push(inc);
    incidentByStep.set(inc.atStep, arr);
  }

  for (const st of traj.steps) {
    if (st.kind === 'compaction') {
      const cr = compactions.find((c) => c.event.id === st.compactionId);
      const dropped = cr ? cr.rows.filter((r) => r.effectiveState === 'dropped') : [];
      const riskyDropped = dropped.filter((r) => r.item.causesDriftAtStep !== undefined);
      timeline.push({
        step: st.step,
        kind: 'compaction',
        title: st.title,
        detail: cr
          ? `丢弃 ${dropped.length} 条 · 省 ${cr.tokensSaved} tok · 风险分 ${cr.riskScore}` +
            (riskyDropped.length
              ? ` · ⚠ 丢了 ${riskyDropped.map((r) => r.item.label).join('、')}`
              : ' · 仅丢安全条目')
          : undefined,
        tone: riskyDropped.length ? 'warn' : 'info',
      });
    } else {
      timeline.push({
        step: st.step,
        kind: st.kind,
        title: st.title,
        detail: st.detail,
        tone: st.kind === 'goal' ? 'info' : 'normal',
      });
    }

    // 事故在其所属步「引爆」
    const incs = incidentByStep.get(st.step);
    if (incs) {
      for (const inc of incs) {
        timeline.push({
          step: st.step,
          kind: 'incident',
          title:
            (inc.severity === 'fatal' ? '💥 跑偏（致命）：' : '↩ 跑偏（返工）：') + inc.itemLabel,
          detail: `${inc.note}（返工 ~${inc.wastedTokens} tok）`,
          tone: inc.severity === 'fatal' ? 'danger' : 'warn',
        });
      }
    }
  }

  // 结局行
  timeline.push({
    step: traj.totalSteps,
    kind: 'result',
    title: outcome === 'PASS' ? '✅ 任务通过 · 契约测试全绿' : '❌ 任务失败 · 契约测试红 / 被打回',
    detail:
      outcome === 'PASS'
        ? '无跑偏，一次通过评审。'
        : `触发 ${fatalCount} 次致命 + ${reworkCount} 次返工，整段返工。`,
    tone: outcome === 'PASS' ? 'good' : 'danger',
  });

  return {
    pinned: pinnedList,
    compactions,
    incidents,
    timeline,
    tokensSaved,
    tokensWasted,
    netTokens: tokensSaved - tokensWasted,
    totalRisk,
    fatalCount,
    reworkCount,
    outcome,
  };
}
