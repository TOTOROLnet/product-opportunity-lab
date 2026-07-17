import type { TimelineEvent } from '../types';

// 过去 30 天里，这些"来源"悄悄变了——但退款 SOP 一直没跟上。
// 从旧到新排序；应用前 k 个事件 = 时间线位置 k。位置 = 事件总数时即"今天"。

export const TIMELINE: TimelineEvent[] = [
  {
    id: 'e_payout',
    date: '2026-06-21',
    sourceId: 'payout_time',
    toVersionIndex: 1,
    headline: '财务把退款到账时效从 T+3 提升到 T+1',
  },
  {
    id: 'e_window',
    date: '2026-06-24',
    sourceId: 'policy_window',
    toVersionIndex: 1,
    headline: '退款政策把全额退款窗口从 14 天缩短到 7 天',
  },
  {
    id: 'e_fee',
    date: '2026-07-01',
    sourceId: 'fee_table',
    toVersionIndex: 1,
    headline: '促销期跨境退款手续费从 3% 临时免收',
  },
  {
    id: 'e_dispute',
    date: '2026-07-06',
    sourceId: 'dispute_policy',
    toVersionIndex: 1,
    headline: '争议口径从"一律拒绝"改为"酌情处理"（含义模糊）',
  },
  {
    id: 'e_api',
    date: '2026-07-08',
    sourceId: 'payment_api',
    toVersionIndex: 1,
    headline: '支付网关废弃 /v1/refunds，须改用 /v2/refunds',
  },
];

/** 文档最初依据的基线日期，用于回放展示。 */
export const BASELINE_DATE = '2026-06-16';
/** "今天"——SOP 已 30 天没人核对来源。 */
export const TODAY = '2026-07-16';
