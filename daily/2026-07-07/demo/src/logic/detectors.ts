import type {
  Detection,
  DiagnosisResult,
  Participant,
  RunEvent,
  Verdict,
} from '../types';

// ---- 检测阈值（真实产品会做成可配置 + 去噪，这里用固定阈值示意）----
const RETRY_MIN = 3; // 同一 (agent, resource) 连续错误达到几次算重试风暴
const PINGPONG_MIN = 4; // 一对 agent 间来回 handoff 达到几次算活锁
const ORPHAN_MS = 6000; // 任务被派后无人接手多久算无主
const STALL_MS = 8000; // 空转窗口长度
const STALL_MIN_EVENTS = 6; // 空转窗口内的最少事件数

function nameOf(participants: Participant[], id: string): string {
  return participants.find((p) => p.id === id)?.name ?? id;
}

function secs(ms: number): string {
  return (ms / 1000).toFixed(1);
}

/**
 * 重试风暴：同一 agent 对同一 resource 连续报错并重试，token 在无效重试里空烧。
 * 这是"警告级"——run 还在推进，但在烧钱。
 */
function detectRetryStorm(
  events: RunEvent[],
  participants: Participant[],
): Detection[] {
  const groups = new Map<string, RunEvent[]>();
  for (const e of events) {
    if (e.type === 'error' && e.resource) {
      const key = `${e.from}::${e.resource}`;
      const arr = groups.get(key) ?? [];
      arr.push(e);
      groups.set(key, arr);
    }
  }
  const detections: Detection[] = [];
  for (const [key, errs] of groups) {
    if (errs.length < RETRY_MIN) continue;
    const sep = key.indexOf('::');
    const from = key.slice(0, sep);
    const resource = key.slice(sep + 2);
    const related = events.filter(
      (e) =>
        e.from === from &&
        e.resource === resource &&
        (e.type === 'error' || e.type === 'function_call'),
    );
    const wastedTokens = related.reduce((s, e) => s + e.tokens, 0);
    const wastedMs = related.length
      ? related[related.length - 1].t - related[0].t
      : 0;
    detections.push({
      kind: 'retry-storm',
      title: '重试风暴 · Retry Storm',
      severity: 'warning',
      agents: [from],
      eventIds: related.map((e) => e.id),
      wastedTokens,
      wastedMs,
      cause: `${nameOf(participants, from)} 对 ${resource} 连续失败并重试 ${errs.length} 次，没有退避或熔断，token 在无效重试里空烧。`,
      fix: `给 ${resource} 的调用加 max-retry + 指数退避；连续失败超阈值后熔断并升级为人工/换路由，而不是无限重试。`,
    });
  }
  return detections;
}

/**
 * 活锁 / Ping-Pong：一对 agent 反复 handoff 却无任何 state 前进，双方都在等对方定夺。
 * 这是"致命级"——run 卡死。
 */
function detectLivelock(
  events: RunEvent[],
  participants: Participant[],
): Detection[] {
  const handoffs = events.filter((e) => e.type === 'handoff' && e.to);
  const detections: Detection[] = [];
  if (handoffs.length < PINGPONG_MIN) return detections;

  const pairKey = (a: string, b: string) => [a, b].sort().join('::');
  const byPair = new Map<string, RunEvent[]>();
  for (const h of handoffs) {
    const key = pairKey(h.from, h.to as string);
    const arr = byPair.get(key) ?? [];
    arr.push(h);
    byPair.set(key, arr);
  }

  for (const [key, arr] of byPair) {
    if (arr.length < PINGPONG_MIN) continue;
    // 校验方向是否交替（真正的来回，而不是单向连发）
    let alternating = true;
    for (let i = 1; i < arr.length; i++) {
      if (arr[i].from === arr[i - 1].from) {
        alternating = false;
        break;
      }
    }
    if (!alternating) continue;

    const first = arr[0].t;
    const last = arr[arr.length - 1].t;
    const progressBetween = events.some(
      (e) => e.type === 'state' && e.progress && e.t >= first && e.t <= last,
    );
    if (progressBetween) continue;

    const sep = key.indexOf('::');
    const a = key.slice(0, sep);
    const b = key.slice(sep + 2);
    const window = events.filter((e) => e.t >= first && e.t <= last);
    const wastedTokens = window.reduce((s, e) => s + e.tokens, 0);
    detections.push({
      kind: 'livelock',
      title: '活锁 / Ping-Pong · Livelock',
      severity: 'critical',
      agents: [a, b],
      eventIds: arr.map((e) => e.id),
      wastedTokens,
      wastedMs: last - first,
      cause: `${nameOf(participants, a)} 与 ${nameOf(participants, b)} 之间反复 handoff ${arr.length} 次，任务被踢来踢去却没有任何 state 前进——典型活锁，双方都在等对方定夺。`,
      fix: `设"决策仲裁者"或强制默认值：ping-pong 超过 N 次自动升级到 planner/人类拍板；把模糊的验收标准在派活前变成可判定契约，杜绝无休止退回。`,
    });
  }
  return detections;
}

/**
 * 无主任务 / 黑洞：任务被 assign 后，owner 长时间零动作、也无完成/失败信号，整条目标被静默阻塞。
 * 这是"致命级"。
 */
function detectOrphaned(
  events: RunEvent[],
  participants: Participant[],
): Detection[] {
  const detections: Detection[] = [];
  if (events.length === 0) return detections;
  const maxT = events[events.length - 1].t;
  const assigns = events.filter((e) => e.type === 'assign' && e.to && e.task);
  for (const a of assigns) {
    const owner = a.to as string;
    const task = a.task as string;
    const ownerActivity = events.some(
      (e) => e.from === owner && e.task === task && e.t > a.t,
    );
    const done = events.some(
      (e) => e.type === 'state' && e.task === task && e.progress && e.t > a.t,
    );
    const idle = maxT - a.t;
    if (!ownerActivity && !done && idle > ORPHAN_MS) {
      detections.push({
        kind: 'orphaned-task',
        title: '无主任务 · Orphaned Task（黑洞）',
        severity: 'critical',
        agents: [a.from, owner],
        eventIds: [a.id],
        wastedTokens: 0,
        wastedMs: idle,
        cause: `任务「${a.summary}」在 ${secs(a.t)}s 被派给 ${nameOf(participants, owner)}，此后 ${secs(idle)}s 内该 owner 对此任务零动作、也无完成/失败信号——任务掉进黑洞，整条目标被静默阻塞。`,
        fix: `为每个 assign 设 dead-owner 超时（如 30s 无响应）自动重派或升级；planner 维护未完成任务看板，杜绝"派了就没人管"。`,
      });
    }
  }
  return detections;
}

/**
 * 重复写入冲突：多个 agent 在没有加锁的情况下并发写同一资源，产生重复工作与合并冲突。
 * 警告级——有一份 token 是白花的。
 */
function detectCollision(
  events: RunEvent[],
  participants: Participant[],
): Detection[] {
  const writesByResource = new Map<string, RunEvent[]>();
  for (const e of events) {
    if (e.type === 'function_call' && e.write && e.resource) {
      const arr = writesByResource.get(e.resource) ?? [];
      arr.push(e);
      writesByResource.set(e.resource, arr);
    }
  }
  const detections: Detection[] = [];
  for (const [resource, writes] of writesByResource) {
    const agents = Array.from(new Set(writes.map((w) => w.from)));
    if (agents.length < 2) continue;
    const wastedTokens = writes.reduce((s, e) => s + e.tokens, 0);
    const first = writes[0].t;
    const last = writes[writes.length - 1].t;
    detections.push({
      kind: 'write-collision',
      title: '重复写入冲突 · Write Collision',
      severity: 'warning',
      agents,
      eventIds: writes.map((e) => e.id),
      wastedTokens,
      wastedMs: last - first,
      cause: `${agents
        .map((x) => nameOf(participants, x))
        .join(' 与 ')} 在没有加锁的情况下并发写同一资源 ${resource}，产生重复工作与合并冲突，双方的 token 有一份是白花的。`,
      fix: `对共享资源引入串行化/租约锁：同一时刻只允许一个 agent 持写权限；planner 派活时避免把同一文件拆给两人并行。`,
    });
  }
  return detections;
}

/**
 * 空转不前进：一个窗口内产生了大量事件，但目标状态一次都没前进（无任何 progress state）。
 * 致命级——团队在忙，却没在推进目标。
 */
function detectStall(events: RunEvent[]): Detection[] {
  if (events.length < STALL_MIN_EVENTS) return [];
  const first = events[0].t;
  const last = events[events.length - 1].t;
  if (last - first < STALL_MS) return [];
  const anyProgress = events.some((e) => e.type === 'state' && e.progress);
  if (anyProgress) return [];
  const wastedTokens = events.reduce((s, e) => s + e.tokens, 0);
  return [
    {
      kind: 'progress-stall',
      title: '空转不前进 · Progress Stall',
      severity: 'critical',
      agents: Array.from(new Set(events.map((e) => e.from))),
      eventIds: events.slice(-4).map((e) => e.id),
      wastedTokens,
      wastedMs: last - first,
      cause: `过去 ${secs(last - first)}s 内产生了 ${events.length} 个事件，但目标状态一次都没有前进（无任何 progress state）——团队在忙，却没在推进目标。`,
      fix: `设"无进展看门狗"：一个窗口内若无 progress state 就暂停 run 并告警；顺藤查是否卡在活锁或在等外部输入。`,
    },
  ];
}

/**
 * 主入口：对（已按时间切片的）事件流做协作失调诊断。
 * 检测全部是确定性的关系/时间分析，不是硬编码 verdict。
 */
export function diagnose(
  events: RunEvent[],
  participants: Participant[],
): DiagnosisResult {
  const sorted = [...events].sort((a, b) => a.t - b.t);
  const detections: Detection[] = [
    ...detectLivelock(sorted, participants),
    ...detectOrphaned(sorted, participants),
    ...detectStall(sorted),
    ...detectRetryStorm(sorted, participants),
    ...detectCollision(sorted, participants),
  ];

  // 头条"浪费 token"取所有被标记事件的并集，避免不同检测器重复计数。
  const idToTokens = new Map(sorted.map((e) => [e.id, e.tokens] as const));
  const wastedIds = new Set<string>();
  for (const d of detections) for (const id of d.eventIds) wastedIds.add(id);
  const totalWastedTokens = Array.from(wastedIds).reduce(
    (s, id) => s + (idToTokens.get(id) ?? 0),
    0,
  );
  const totalWastedMs = detections.reduce((s, d) => Math.max(s, d.wastedMs), 0);

  let verdict: Verdict = 'HEALTHY';
  if (detections.some((d) => d.severity === 'critical')) verdict = 'STUCK';
  else if (detections.length > 0) verdict = 'DEGRADED';

  return { detections, verdict, totalWastedTokens, totalWastedMs };
}
