import type { Memory, Scenario } from '../types';

// 演示世界的"现在"：固定为北京时间 2026-07-31 08:00，用于计算记忆年龄。
export const NOW = new Date('2026-07-31T08:00:00+08:00');

// 场景：一个酒店/民宿运营 agent（呼应报告里的 Conduit）正准备"自动退款 $500"给住客 Charlie。
export const SCENARIO: Scenario = {
  id: 'refund-charlie',
  actionTitle: '自动退款 $500 给住客 Charlie（争议订单 #A-7731）',
  actionDetail:
    'agent 计划：直接批准 $500 争议退款并邮件通知住客。理由 = 记忆 m1「Charlie 是 VIP，争议一律退款至 $1000」。',
  amount: 500,
  reliesOn: 'm1',
  recalledIds: ['m1', 'm2', 'm3', 'm6'], // 朴素语义检索会召回的（忆证会再追加其矛盾记忆 m4/m5）
  policyThreshold: 200,
};

// 约 10 条 mock 记忆，带丰富 provenance。所有对话/工具/文档片段均为虚构。
export const INITIAL_MEMORIES: Memory[] = [
  {
    id: 'm1',
    statement: 'Charlie 是 VIP，争议一律退款至 $1000（无需额外审批）。',
    category: 'volatile',
    sources: [
      {
        type: 'chat',
        label: '客服对话 #4821',
        excerpt: '“Charlie 是我们老客户，这种小争议你直接退给他就行，别来回问。”—— 当时的值班主管随口交代',
        at: '2025-11-20',
        authority: 0.4,
      },
    ],
    confirmations: 1,
    lastConfirmedAt: '2025-11-20',
    conflictsWith: ['m4'],
    pinned: false,
    retired: false,
    actionRelevant: true,
  },
  {
    id: 'm4',
    statement: '新政策：$200 以上的争议退款一律需经理审批，VIP 不例外（2026-07 起）。',
    category: 'durable',
    sources: [
      {
        type: 'doc',
        label: '退款政策文档 v2026.07',
        excerpt: '§3.2 争议退款：单笔 > $200 必须经由经理在后台二次审批后方可执行，会员等级不作为豁免条件。',
        at: '2026-07-25',
        authority: 0.96,
      },
    ],
    confirmations: 1,
    lastConfirmedAt: '2026-07-25',
    conflictsWith: ['m1'],
    pinned: false,
    retired: false,
    actionRelevant: true,
  },
  {
    id: 'm2',
    statement: '住客 Charlie 偏好邮件联系，不喜欢电话。',
    category: 'volatile',
    sources: [
      {
        type: 'chat',
        label: '客服对话 #3980',
        excerpt: '“别打电话给我，有事发邮件。”',
        at: '2025-09-02',
        authority: 0.5,
      },
      {
        type: 'chat',
        label: '客服对话 #4102',
        excerpt: '（Charlie 再次要求"邮件沟通即可"）',
        at: '2025-10-11',
        authority: 0.5,
      },
    ],
    confirmations: 2,
    lastConfirmedAt: '2025-10-11',
    conflictsWith: ['m5'],
    pinned: false,
    retired: false,
    actionRelevant: true,
  },
  {
    id: 'm5',
    statement: 'Charlie 上月起要求改用 WhatsApp 沟通，不再看邮件。',
    category: 'volatile',
    sources: [
      {
        type: 'chat',
        label: '客服对话 #5219',
        excerpt: '“以后都发我 WhatsApp 吧，邮件我基本不看了。”',
        at: '2026-06-28',
        authority: 0.55,
      },
    ],
    confirmations: 1,
    lastConfirmedAt: '2026-06-28',
    conflictsWith: ['m2'],
    pinned: false,
    retired: false,
    actionRelevant: true,
  },
  {
    id: 'm3',
    statement: 'Charlie 的会员号是 88231。',
    category: 'durable',
    sources: [
      {
        type: 'doc',
        label: 'CRM 会员档案',
        excerpt: 'Member ID: 88231 · Tier: Gold · since 2023',
        at: '2023-04-10',
        authority: 0.9,
      },
      {
        type: 'tool',
        label: 'CRM 同步 job',
        excerpt: '每周同步核对：88231 一致',
        at: '2026-07-24',
        authority: 0.85,
      },
    ],
    confirmations: 4,
    lastConfirmedAt: '2026-07-24',
    conflictsWith: [],
    pinned: false,
    retired: false,
    actionRelevant: true,
  },
  {
    id: 'm6',
    statement: 'Room 402 空调损坏，维修中（Charlie 本次争议的直接原因）。',
    category: 'volatile',
    sources: [
      {
        type: 'tool',
        label: '维修工单 T-0912',
        excerpt: 'AC unit failure, parts ordered, ETA 2 days. Guest in 402 affected.',
        at: '2026-07-28',
        authority: 0.8,
      },
      {
        type: 'chat',
        label: '前台交班记录',
        excerpt: '“402 空调还没修好，住客已投诉。”',
        at: '2026-07-29',
        authority: 0.6,
      },
    ],
    confirmations: 2,
    lastConfirmedAt: '2026-07-29',
    conflictsWith: [],
    pinned: false,
    retired: false,
    actionRelevant: true,
  },
  {
    id: 'm7',
    statement: 'Charlie 情绪激动，暗示会给差评。',
    category: 'volatile',
    sources: [
      {
        type: 'chat',
        label: '客服对话 #5301',
        excerpt: '“再处理不好我就上点评网站了。”',
        at: '2026-07-21',
        authority: 0.5,
      },
    ],
    confirmations: 1,
    lastConfirmedAt: '2026-07-21',
    conflictsWith: [],
    pinned: false,
    retired: false,
    actionRelevant: false,
  },
  {
    id: 'm8',
    statement: '所有退款一律原路退回（不发现金/储值）。',
    category: 'durable',
    sources: [
      {
        type: 'doc',
        label: '财务政策手册',
        excerpt: '§1.1 Refunds must be issued to the original payment method.',
        at: '2025-01-15',
        authority: 0.95,
      },
    ],
    confirmations: 3,
    lastConfirmedAt: '2026-05-30',
    conflictsWith: [],
    pinned: false,
    retired: false,
    actionRelevant: false,
  },
  {
    id: 'm9',
    statement: 'Charlie 去年有一次信用卡 chargeback 记录。',
    category: 'durable',
    sources: [
      {
        type: 'tool',
        label: '支付网关记录',
        excerpt: 'Chargeback filed 2025-03, later resolved.',
        at: '2025-03-18',
        authority: 0.75,
      },
    ],
    confirmations: 1,
    lastConfirmedAt: '2025-03-18',
    conflictsWith: [],
    pinned: false,
    retired: false,
    actionRelevant: false,
  },
  {
    id: 'm10',
    statement: '本店对 VIP 免费升级房型。',
    category: 'volatile',
    sources: [
      {
        type: 'chat',
        label: '内部群消息',
        excerpt: '“旺季就先别给 VIP 免费升了。”（后半句常被忽略）',
        at: '2025-08-05',
        authority: 0.35,
      },
    ],
    confirmations: 1,
    lastConfirmedAt: '2025-08-05',
    conflictsWith: [],
    pinned: false,
    retired: false,
    actionRelevant: false,
  },
];

// 信任阈值：低于此值，gate 不允许静默执行。
export const TRUST_THRESHOLD = 0.6;
