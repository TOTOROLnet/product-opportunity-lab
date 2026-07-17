import type { Source } from '../types';

// 全部为围绕"客服退款"场景虚构的示例来源，用于演示机制，不代表任何真实公司。
// 前 5 个来源在过去 30 天发生过变更（会让文档变腐）；后 7 个来源未变（对应鲜的论断）。

export const SOURCES: Source[] = [
  {
    id: 'policy_window',
    name: '退款政策 · 全额退款申请时限',
    kind: 'policy',
    versions: [
      { value: '下单后 14 天', label: '14 天', date: '2026-06-16', note: '基线版本' },
      {
        value: '下单后 7 天',
        label: '7 天',
        date: '2026-06-24',
        note: '政策收紧：全额退款窗口由 14 天缩短为 7 天',
      },
    ],
  },
  {
    id: 'fee_table',
    name: '定价 · 跨境退款手续费',
    kind: 'pricing',
    versions: [
      { value: '3% 手续费', label: '3%', date: '2026-06-16', note: '基线版本' },
      {
        value: '0 手续费（促销期免收）',
        label: '0%',
        date: '2026-07-01',
        note: '促销期跨境退款手续费临时免收',
      },
    ],
  },
  {
    id: 'payment_api',
    name: '支付网关 · 退款接口',
    kind: 'api',
    versions: [
      { value: '/v1/refunds 接口', label: '/v1/refunds', date: '2026-06-16', note: '基线版本' },
      {
        value: '/v2/refunds 接口（/v1 已废弃）',
        label: '/v2/refunds',
        date: '2026-07-08',
        note: '支付网关废弃 /v1/refunds，全部改用 /v2/refunds',
      },
    ],
  },
  {
    id: 'payout_time',
    name: '财务 · 退款到账时效',
    kind: 'finance',
    versions: [
      { value: 'T+3 个工作日', label: 'T+3', date: '2026-06-16', note: '基线版本' },
      {
        value: 'T+1 个工作日',
        label: 'T+1',
        date: '2026-06-21',
        note: '对账周期优化，到账时效由 T+3 提升为 T+1',
      },
    ],
  },
  {
    id: 'dispute_policy',
    name: '争议处理 · 超时申请口径',
    kind: 'policy',
    versions: [
      { value: '一律拒绝', label: '一律拒绝', date: '2026-06-16', note: '基线版本' },
      {
        value: '由客服酌情处理',
        label: '酌情处理',
        date: '2026-07-06',
        note: '口径由"一律拒绝"改为"客服酌情处理"——含义模糊，需人工判断如何改写',
      },
    ],
  },

  // —— 以下来源在本周期未发生变更，对应的论断保持"鲜" ——
  {
    id: 'partial_rule',
    name: '政策 · 部分退款折算',
    kind: 'policy',
    versions: [{ value: '按实际使用天数折算', label: '按天折算', date: '2026-06-16' }],
  },
  {
    id: 'approval_threshold',
    name: '权限 · 客服直批额度',
    kind: 'ops',
    versions: [{ value: '500 元', label: '500 元', date: '2026-06-16' }],
  },
  {
    id: 'currency_rule',
    name: '财务 · 退款币种',
    kind: 'finance',
    versions: [{ value: '按原支付币种原路返回', label: '原路返回', date: '2026-06-16' }],
  },
  {
    id: 'channel_coverage',
    name: '支付 · 退回渠道覆盖',
    kind: 'ops',
    versions: [{ value: '微信 / 支付宝 / 银行卡原路退回', label: '三渠道', date: '2026-06-16' }],
  },
  {
    id: 'record_keeping',
    name: '合规 · 留痕要求',
    kind: 'ops',
    versions: [{ value: '在工单中留存退款原因', label: '工单留痕', date: '2026-06-16' }],
  },
  {
    id: 'identity_verify',
    name: '风控 · 身份核验',
    kind: 'ops',
    versions: [{ value: '下单手机号后四位', label: '手机号后四位', date: '2026-06-16' }],
  },
  {
    id: 'fraud_escalation',
    name: '风控 · 欺诈升级',
    kind: 'ops',
    versions: [{ value: '升级风控团队复核', label: '升级风控', date: '2026-06-16' }],
  },
];

export const SOURCE_MAP: Record<string, Source> = Object.fromEntries(
  SOURCES.map((s) => [s.id, s]),
);
