import type { Trajectory, ContextItem, StepEvent, CompactionEvent } from '../types';

// ————————————————————————————————————————————————————————————————
// mock 场景：一条真实感的长程编码 Agent 任务
// 目标：把支付模块从 pay-sdk v1 迁移到 v2，且「绝不改动对外 public API 签名」。
// 任务跑了 24 步，中途触发 2 次上下文压缩。
// 厂商默认压缩为了省 token，静默丢掉了硬约束与踩坑经验 → Agent 在后段跑偏。
// 全部为 mock，用于演示「压缩审计 + 保命清单」的机制，不接任何真实模型/后端。
// ————————————————————————————————————————————————————————————————

const items: ContextItem[] = [
  {
    id: 'C1',
    type: 'user_constraint',
    label: '绝不改动 public API 签名',
    content:
      '用户第 2 步明确要求：`PaymentClient` 的对外 public 方法签名（charge / refund / getStatus）必须保持不变——下游有 12 个服务按现签名接了契约测试。',
    tokens: 90,
    riskWeight: 95,
    pinnable: true,
    causesDriftAtStep: 18,
    severity: 'fatal',
    driftNote:
      'Agent 忘了这条约束，为「顺手清理」把 charge(amount) 改成 charge(order)，12 个下游契约测试全红、用户拒收，整段迁移返工。',
    wastedTokens: 15000,
  },
  {
    id: 'C2',
    type: 'decision',
    label: '已定方案：adapter 包一层 v2',
    content:
      '第 6 步与用户敲定：用 adapter 在内部包一层 pay-sdk v2，而不是把 v1 调用点逐个直接替换（降低爆炸半径）。',
    tokens: 80,
    riskWeight: 65,
    pinnable: true,
    causesDriftAtStep: 15,
    severity: 'rework',
    driftNote:
      'Agent 忘了已定方案，重新纠结「要不要直接替换 v1 调用」，来回论证并试写直替方案，绕路 6 步才回到 adapter。',
    wastedTokens: 4200,
  },
  {
    id: 'F1',
    type: 'file_ref',
    label: 'payments/client.ts（工作面）',
    content: '当前正在改的主文件，仍在活跃编辑中。',
    tokens: 60,
    riskWeight: 12,
    pinnable: true,
  },
  {
    id: 'F2',
    type: 'file_ref',
    label: 'payments/legacy_v1.ts（已弃用）',
    content: '旧 v1 封装，迁移完成后已不再引用，可安全淡出上下文。',
    tokens: 50,
    riskWeight: 10,
    pinnable: true,
  },
  {
    id: 'N1',
    type: 'chatter',
    label: '闲聊：下班前给个进度',
    content: '用户随口说的一句「下班前给我个进度」，与任务正确性无关。',
    tokens: 40,
    riskWeight: 5,
    pinnable: false,
  },
  {
    id: 'N2',
    type: 'chatter',
    label: '闲聊：命名口味的一段讨论',
    content: '关于变量命名风格的一段来回，已在 F1 里落定，原文可弃。',
    tokens: 30,
    riskWeight: 3,
    pinnable: false,
  },
  {
    id: 'C4',
    type: 'error_learned',
    label: '踩坑：v2 重试默认关闭',
    content:
      '第 14 步踩到的坑：pay-sdk v2 的自动重试默认关闭，必须显式传 `retries: 3`，否则网络抖动会漏单。',
    tokens: 70,
    riskWeight: 78,
    pinnable: true,
    causesDriftAtStep: 21,
    severity: 'rework',
    driftNote:
      'Agent 忘了这条踩坑经验，未开重试就提交；QA 压测发现偶发漏单，被打回补 `retries: 3` 并回归测试。',
    wastedTokens: 3000,
  },
  {
    id: 'F3',
    type: 'file_ref',
    label: 'payments/adapter_v2.ts（工作面）',
    content: '新建的 adapter 文件，仍在活跃编辑中。',
    tokens: 65,
    riskWeight: 14,
    pinnable: true,
  },
  {
    id: 'T1',
    type: 'todo',
    label: '待办：写迁移说明文档',
    content: '还没做的收尾项，压成一行提醒即可，无需全文保留。',
    tokens: 55,
    riskWeight: 20,
    pinnable: true,
  },
  {
    id: 'T2',
    type: 'todo',
    label: '待办（已完成）：跑单测',
    content: '第 16 步已经跑过并通过，作为「已完成」可安全丢弃。',
    tokens: 35,
    riskWeight: 8,
    pinnable: false,
  },
  {
    id: 'N3',
    type: 'chatter',
    label: '闲聊：工具版本寒暄',
    content: '关于本地 node 版本的一句闲聊，无关任务正确性。',
    tokens: 25,
    riskWeight: 4,
    pinnable: false,
  },
];

const compactions: CompactionEvent[] = [
  {
    id: 'K1',
    atStep: 12,
    title: '压缩 #1 · 探索阶段后窗口膨胀',
    reason: '前 11 步读了大量文件、上下文逼近阈值，harness 触发一次压缩以降本提速。',
    windowItemIds: ['C1', 'C2', 'F1', 'F2', 'N1', 'N2'],
    defaultFold: {
      C1: 'dropped', // ← 硬约束被静默丢弃（本 Demo 的主反例）
      C2: 'dropped', // ← 已定方案被丢
      F1: 'kept',
      F2: 'dropped', // 安全：已弃用
      N1: 'dropped', // 安全：闲聊
      N2: 'dropped', // 安全：闲聊
    },
  },
  {
    id: 'K2',
    atStep: 20,
    title: '压缩 #2 · 迁移中段再次触顶',
    reason: '改到一半上下文又膨胀，harness 二次压缩。',
    windowItemIds: ['C4', 'F3', 'T1', 'T2', 'N3'],
    defaultFold: {
      C4: 'dropped', // ← 踩坑经验被丢
      F3: 'kept',
      T1: 'lossy', // 压成一行，尚可
      T2: 'dropped', // 安全：已完成
      N3: 'dropped', // 安全：闲聊
    },
  },
];

const steps: StepEvent[] = [
  { step: 1, kind: 'goal', title: '接到任务：pay-sdk v1 → v2 迁移' },
  { step: 2, kind: 'note', title: '用户追加硬约束：绝不改动 public API 签名', detail: '下游 12 个服务依赖现签名' },
  { step: 3, kind: 'tool', title: 'read payments/client.ts' },
  { step: 4, kind: 'tool', title: 'grep 调用点 charge/refund/getStatus' },
  { step: 5, kind: 'tool', title: 'read pay-sdk v2 迁移指南' },
  { step: 6, kind: 'note', title: '与用户敲定方案：adapter 包一层 v2', detail: '不逐点直替，降低爆炸半径' },
  { step: 7, kind: 'tool', title: 'read payments/legacy_v1.ts' },
  { step: 8, kind: 'tool', title: 'write adapter_v2.ts 骨架' },
  { step: 9, kind: 'tool', title: 'read 12 个下游服务的契约测试' },
  { step: 10, kind: 'tool', title: 'note 命名风格 & 进度闲聊' },
  { step: 11, kind: 'tool', title: '继续读依赖，上下文逼近阈值' },
  { step: 12, kind: 'compaction', title: '⟳ 触发上下文压缩 #1', compactionId: 'K1' },
  { step: 13, kind: 'tool', title: 'write adapter_v2.ts charge 通道' },
  { step: 14, kind: 'note', title: '踩坑：v2 重试默认关闭，需 retries:3' },
  { step: 15, kind: 'tool', title: '实现 refund 通道' },
  { step: 16, kind: 'tool', title: 'run 单元测试（通过）' },
  { step: 17, kind: 'tool', title: '接线 client.ts → adapter' },
  { step: 18, kind: 'tool', title: '清理与收口 charge 入口' },
  { step: 19, kind: 'tool', title: 'write 迁移收尾' },
  { step: 20, kind: 'compaction', title: '⟳ 触发上下文压缩 #2', compactionId: 'K2' },
  { step: 21, kind: 'tool', title: '提交前自检 & 打包' },
  { step: 22, kind: 'tool', title: 'run 契约测试' },
  { step: 23, kind: 'tool', title: '整理变更说明' },
  { step: 24, kind: 'tool', title: '交付评审' },
];

export const TRAJECTORY: Trajectory = {
  id: 'pay-sdk-migration',
  title: '支付模块 pay-sdk v1 → v2 迁移',
  goal: '把支付模块迁移到 pay-sdk v2',
  goalDetail: '硬约束：绝不改动对外 public API 签名（下游 12 个服务依赖）。',
  totalSteps: 24,
  items,
  steps,
  compactions,
};

// 被引擎判定为「值得钉」的高风险条目（供「一键钉住风险项」用）
export const SUGGESTED_PINS = ['C1', 'C2', 'C4'];
