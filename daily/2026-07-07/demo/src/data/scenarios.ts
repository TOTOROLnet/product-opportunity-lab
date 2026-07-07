import type { Participant, Scenario } from '../types';

// 通用角色定义（不同场景按需取用）
const P = (
  id: string,
  name: string,
  role: Participant['role'],
  hue: number,
): Participant => ({ id, name, role, hue });

const planner = P('planner', 'Planner', 'planner', 265);
const coder = P('coder', 'Coder', 'coder', 200);
const coderA = P('coderA', 'Coder-A', 'coder', 200);
const coderB = P('coderB', 'Coder-B', 'coder', 155);
const reviewer = P('reviewer', 'Reviewer', 'reviewer', 30);

// ---------------------------------------------------------------------------
// 1) 健康 run（对照组）：分工清晰、单写者、有 progress，Concord 判 HEALTHY。
// ---------------------------------------------------------------------------
const healthy: Scenario = {
  id: 'healthy',
  name: '健康 run（对照组）',
  blurb: '分工清晰、单写者、每步有 progress。用来验证 Concord 不会误报。',
  participants: [planner, coder, reviewer],
  expectedNote: '无反模式 → verdict = HEALTHY。作为"不误报"的对照。',
  events: [
    { id: 'h1', t: 0, type: 'message', from: 'planner', tokens: 400, summary: '拆解目标：实现并评审登录接口' },
    { id: 'h2', t: 500, type: 'assign', from: 'planner', to: 'coder', task: 'T1', tokens: 120, summary: '派给 Coder：实现登录接口' },
    { id: 'h3', t: 900, type: 'function_call', from: 'coder', resource: 'file:auth.ts', task: 'T1', write: true, tokens: 900, summary: '写 auth.ts 登录逻辑' },
    { id: 'h4', t: 1500, type: 'state', from: 'coder', task: 'T1', progress: true, tokens: 200, summary: 'T1 完成，单测通过' },
    { id: 'h5', t: 1700, type: 'assign', from: 'planner', to: 'reviewer', task: 'T2', tokens: 100, summary: '派给 Reviewer：评审登录接口' },
    { id: 'h6', t: 2100, type: 'function_call', from: 'reviewer', resource: 'file:auth.ts', task: 'T2', write: false, tokens: 300, summary: '读 auth.ts + 跑测试（只读）' },
    { id: 'h7', t: 2600, type: 'state', from: 'reviewer', task: 'T2', progress: true, tokens: 150, summary: 'T2 通过评审' },
    { id: 'h8', t: 2900, type: 'state', from: 'planner', progress: true, tokens: 100, summary: '目标达成，run 收尾' },
  ],
};

// ---------------------------------------------------------------------------
// 2) 活锁 ping-pong：Planner 与 Coder 反复 handoff，无任何 progress → STUCK。
//    同时会触发"空转不前进"（窗口够长且零 progress）。
//    全部事件挂 task T1，使 Coder 对该任务"有活动"，避免误报为无主任务。
// ---------------------------------------------------------------------------
const livelock: Scenario = {
  id: 'livelock',
  name: '活锁 · Ping-Pong',
  blurb: 'Planner 与 Coder 因验收标准模糊反复退回，任务被踢来踢去，目标零前进。',
  participants: [planner, coder],
  expectedNote: '反复 handoff ≥4 次且无 progress → 活锁（致命）；窗口够长且零 progress → 同时空转。verdict = STUCK。',
  events: [
    { id: 'l1', t: 0, type: 'assign', from: 'planner', to: 'coder', task: 'T1', tokens: 120, summary: '派给 Coder：优化查询性能' },
    { id: 'l2', t: 500, type: 'message', from: 'coder', task: 'T1', tokens: 200, summary: '需求不清：要优化到多少 ms？' },
    { id: 'l3', t: 900, type: 'handoff', from: 'coder', to: 'planner', task: 'T1', tokens: 150, summary: '退回：验收标准缺失' },
    { id: 'l4', t: 1400, type: 'handoff', from: 'planner', to: 'coder', task: 'T1', tokens: 160, summary: '你先按 200ms 试' },
    { id: 'l5', t: 2000, type: 'handoff', from: 'coder', to: 'planner', task: 'T1', tokens: 180, summary: '200ms 不现实，请重新定' },
    { id: 'l6', t: 2600, type: 'handoff', from: 'planner', to: 'coder', task: 'T1', tokens: 160, summary: '那按 500ms' },
    { id: 'l7', t: 3200, type: 'handoff', from: 'coder', to: 'planner', task: 'T1', tokens: 180, summary: '500ms 与产品预期冲突' },
    { id: 'l8', t: 3800, type: 'handoff', from: 'planner', to: 'coder', task: 'T1', tokens: 140, summary: '你自己判断吧' },
    { id: 'l9', t: 4400, type: 'handoff', from: 'coder', to: 'planner', task: 'T1', tokens: 160, summary: '无法自行决定，退回' },
    { id: 'l10', t: 5600, type: 'message', from: 'planner', task: 'T1', tokens: 120, summary: '再想想…' },
    { id: 'l11', t: 8300, type: 'handoff', from: 'planner', to: 'coder', task: 'T1', tokens: 150, summary: '还是没结论，再看看' },
  ],
};

// ---------------------------------------------------------------------------
// 3) 重试风暴：Coder 对同一工具反复失败重试，token 空烧 → DEGRADED（仅警告）。
// ---------------------------------------------------------------------------
const retryStorm: Scenario = {
  id: 'retry-storm',
  name: '重试风暴 · Retry Storm',
  blurb: 'Coder 对支付网关连续 429 失败，无退避无熔断，一路硬重试。',
  participants: [planner, coder],
  expectedNote: '同一 (Coder, tool:pay_api) 错误 ≥3 次 → 重试风暴（警告）。run 仍在推进，故 verdict = DEGRADED。',
  events: [
    { id: 'r1', t: 0, type: 'assign', from: 'planner', to: 'coder', task: 'T1', tokens: 100, summary: '派给 Coder：联调支付网关' },
    { id: 'r2', t: 400, type: 'function_call', from: 'coder', resource: 'tool:pay_api', task: 'T1', tokens: 800, summary: '调用支付网关' },
    { id: 'r3', t: 900, type: 'error', from: 'coder', resource: 'tool:pay_api', task: 'T1', tokens: 120, summary: '429 Too Many Requests' },
    { id: 'r4', t: 1200, type: 'function_call', from: 'coder', resource: 'tool:pay_api', task: 'T1', tokens: 800, summary: '重试：调用支付网关' },
    { id: 'r5', t: 1700, type: 'error', from: 'coder', resource: 'tool:pay_api', task: 'T1', tokens: 120, summary: '429 Too Many Requests' },
    { id: 'r6', t: 2000, type: 'function_call', from: 'coder', resource: 'tool:pay_api', task: 'T1', tokens: 800, summary: '重试：调用支付网关' },
    { id: 'r7', t: 2500, type: 'error', from: 'coder', resource: 'tool:pay_api', task: 'T1', tokens: 120, summary: '429 Too Many Requests' },
    { id: 'r8', t: 2800, type: 'function_call', from: 'coder', resource: 'tool:pay_api', task: 'T1', tokens: 800, summary: '重试：调用支付网关' },
    { id: 'r9', t: 3300, type: 'error', from: 'coder', resource: 'tool:pay_api', task: 'T1', tokens: 120, summary: '429 Too Many Requests' },
    { id: 'r10', t: 3600, type: 'handoff', from: 'coder', to: 'planner', task: 'T1', tokens: 150, summary: '升级：支付网关持续 429' },
  ],
};

// ---------------------------------------------------------------------------
// 4) 无主任务黑洞：任务派给 Reviewer 后无人接手，目标静默阻塞 → STUCK。
//    存在一处 progress（T1 完成），因此不触发"空转"，让无主任务成为唯一致命项。
// ---------------------------------------------------------------------------
const orphaned: Scenario = {
  id: 'orphaned',
  name: '无主任务 · 黑洞',
  blurb: '导出功能实现完成后，评审任务派给 Reviewer，但 Reviewer 全程零响应。',
  participants: [planner, coder, reviewer],
  expectedNote: 'T2 派给 Reviewer 后 owner 长时间零动作、无完成信号 → 无主任务（致命）。verdict = STUCK。',
  events: [
    { id: 'o1', t: 0, type: 'message', from: 'planner', tokens: 300, summary: '拆解：实现 + 评审导出功能' },
    { id: 'o2', t: 400, type: 'assign', from: 'planner', to: 'coder', task: 'T1', tokens: 120, summary: '派给 Coder：实现导出功能' },
    { id: 'o3', t: 800, type: 'function_call', from: 'coder', resource: 'file:export.ts', task: 'T1', write: true, tokens: 900, summary: '写 export.ts' },
    { id: 'o4', t: 1500, type: 'state', from: 'coder', task: 'T1', progress: true, tokens: 200, summary: 'T1 完成' },
    { id: 'o5', t: 1700, type: 'assign', from: 'planner', to: 'reviewer', task: 'T2', tokens: 120, summary: '派给 Reviewer：评审并合并导出功能' },
    { id: 'o6', t: 2200, type: 'message', from: 'planner', tokens: 100, summary: '等待 Reviewer 评审…' },
    { id: 'o7', t: 9200, type: 'message', from: 'planner', tokens: 100, summary: '还在等 Reviewer…（T2 无人接）' },
  ],
};

// ---------------------------------------------------------------------------
// 5) 重复写入冲突：Coder-A 与 Coder-B 无锁并发写同一文件 → DEGRADED（警告）。
// ---------------------------------------------------------------------------
const collision: Scenario = {
  id: 'collision',
  name: '重复写入冲突 · Collision',
  blurb: '为"提速"把结账页拆给两人并行，两个 Coder 无锁并发写同一文件。',
  participants: [planner, coderA, coderB],
  expectedNote: '同一 file:checkout.tsx 被两个不同 agent 并发写入 → 写入冲突（警告）。verdict = DEGRADED。',
  events: [
    { id: 'c1', t: 0, type: 'message', from: 'planner', tokens: 200, summary: '并行提速：两人一起改结账' },
    { id: 'c2', t: 300, type: 'assign', from: 'planner', to: 'coderA', task: 'T1', tokens: 120, summary: '派给 Coder-A：重写结账逻辑' },
    { id: 'c3', t: 500, type: 'assign', from: 'planner', to: 'coderB', task: 'T2', tokens: 120, summary: '派给 Coder-B：改结账样式' },
    { id: 'c4', t: 900, type: 'function_call', from: 'coderA', resource: 'file:checkout.tsx', task: 'T1', write: true, tokens: 950, summary: '重写 checkout.tsx 结账逻辑' },
    { id: 'c5', t: 1200, type: 'function_call', from: 'coderB', resource: 'file:checkout.tsx', task: 'T2', write: true, tokens: 700, summary: '改 checkout.tsx 样式' },
    { id: 'c6', t: 1600, type: 'function_call', from: 'coderA', resource: 'file:checkout.tsx', task: 'T1', write: true, tokens: 500, summary: '继续改 checkout.tsx 逻辑' },
    { id: 'c7', t: 1900, type: 'error', from: 'coderB', resource: 'file:checkout.tsx', task: 'T2', tokens: 150, summary: '合并冲突：checkout.tsx' },
    { id: 'c8', t: 2200, type: 'state', from: 'coderA', task: 'T1', progress: true, tokens: 150, summary: 'Coder-A 自认为完成 T1（实际已冲突）' },
  ],
};

export const SCENARIOS: Scenario[] = [
  livelock,
  retryStorm,
  orphaned,
  collision,
  healthy,
];

export function maxT(s: Scenario): number {
  return s.events.reduce((m, e) => Math.max(m, e.t), 0);
}
