import type { MemoryItem, ActivityItem } from '../types';

// ── 场景：一位知识工作者的"一个上午" ───────────────────────────────
// 环境记忆源（模拟 Rewisp 这类"屏幕文本记忆"的产物）：今早你在各 App 里看过、
// 但很快会忘的文本。知时 Aptly 不负责"存"，只负责"在正确的时刻决定要不要开口"。

export const MEMORIES: MemoryItem[] = [
  {
    id: 'M7',
    time: '07:40',
    minute: 7 * 60 + 40,
    app: 'Notion（旧版）',
    text: '旧版《退款 SOP》：单笔退款上限 ¥500。',
    topics: ['refund', 'sop'],
    importance: 'med',
    kind: 'fact',
    supersededBy: 'M1', // 已被 08:00 的新版取代 → 过时
  },
  {
    id: 'M3',
    time: '07:50',
    minute: 7 * 60 + 50,
    app: 'Safari',
    text: '读了一篇讲 Apple Silicon 本地推理（Metal）的博客。',
    topics: ['infra', 'reading'],
    importance: 'low',
    kind: 'fact',
  },
  {
    id: 'M1',
    time: '08:00',
    minute: 8 * 60 + 0,
    app: 'Notion',
    text: '《退款 SOP》改动：单笔退款上限 ¥500 → ¥1000。',
    topics: ['refund', 'sop'],
    importance: 'high',
    kind: 'change',
  },
  {
    id: 'M2',
    time: '08:12',
    minute: 8 * 60 + 12,
    app: 'Slack',
    text: '你对 Bob 说："周五把报价发给你。"',
    topics: ['quote', 'bob'],
    importance: 'high',
    kind: 'promise',
  },
  {
    id: 'M4',
    time: '08:20',
    minute: 8 * 60 + 20,
    app: 'Slack',
    text: 'Acme 群消息：deadline 从下周提前到"本周四"。',
    topics: ['acme', 'deadline'],
    importance: 'high',
    kind: 'change',
  },
  {
    id: 'M5',
    time: '08:25',
    minute: 8 * 60 + 25,
    app: '天气',
    text: '今天下午有雨。',
    topics: ['personal', 'weather'],
    importance: 'low',
    kind: 'fact',
  },
  {
    id: 'M6',
    time: '08:30',
    minute: 8 * 60 + 30,
    app: 'API 文档',
    text: 'refund endpoint 参数改名：amount → amount_cents。',
    topics: ['api', 'endpoint'],
    importance: 'high',
    kind: 'change',
  },
];

export const ACTIVITIES: ActivityItem[] = [
  { id: 'T1', time: '08:35', minute: 8 * 60 + 35, label: '写本周周报', topics: ['report', 'writing'] },
  { id: 'T2', time: '08:50', minute: 8 * 60 + 50, label: '给 Acme 回一封客户邮件', topics: ['acme', 'email'] },
  { id: 'T3', time: '09:05', minute: 9 * 60 + 5, label: '继续写这封 Acme 邮件', topics: ['acme', 'email'] },
  { id: 'T4', time: '09:15', minute: 9 * 60 + 15, label: '改退款相关代码（refund service）', topics: ['refund', 'code'] },
  { id: 'T5', time: '09:30', minute: 9 * 60 + 30, label: '继续调退款代码', topics: ['refund', 'code'] },
  { id: 'T6', time: '09:45', minute: 9 * 60 + 45, label: '准备把报价发给 Bob', topics: ['quote', 'bob'] },
  { id: 'T7', time: '10:00', minute: 10 * 60 + 0, label: '顺手又翻了下 Metal 推理博客', topics: ['infra', 'reading'] },
];

// 学习到的主题关联（只有"知时"会用；朴素推送只认字面相同的标签）。
// 例：正在"改退款代码"时，"退款 API endpoint 变更"其实高度相关，
// 但二者没有字面相同的标签 —— 这正是朴素关键词匹配会漏掉、而知时能接住的关键差异。
export const ASSOCIATIONS: Record<string, number> = {
  'api|refund': 1.0,
  'api|code': 1.0,
  'code|endpoint': 1.0,
  'endpoint|refund': 0.5,
  'code|refund': 0.5,
};

// 策略参数
export const POLICY = {
  naiveLowThreshold: 0.25, // 朴素：字面相关度 ≥ 此值即推送（无预算/无去重/不判过时）
  aptlyHighThreshold: 0.45, // 知时：综合分（相关度×重要度）≥ 此值才考虑推送
  budgetPerWindow: 3, // 知时：任意滚动窗口内最多推送次数
  windowMinutes: 30, // 知时：预算滚动窗口大小（分钟）
};
