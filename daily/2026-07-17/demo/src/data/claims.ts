import type { Claim } from '../types';

// 「客服退款处理 SOP」正文，被拆成 12 条承重论断，每条绑定一个真实来源。
// 其中 5 条对应"已变更来源"（会变腐）：c_window / c_fee / c_api / c_payout（可自动修复），
// c_dispute（口径变模糊，需人判断）；其余 7 条来源未变，保持鲜。
// 初始（今天）：7 鲜 / 12 承重 = 58%。

export const CLAIMS: Claim[] = [
  // 一、申请时限与范围
  {
    id: 'c_window',
    section: '一、申请时限与范围',
    template: '全额退款须在{value}内提出申请。',
    sourceId: 'policy_window',
    loadBearing: true,
  },
  {
    id: 'c_partial',
    section: '一、申请时限与范围',
    template: '未使用完的订阅可申请部分退款，{value}，多退少补。',
    sourceId: 'partial_rule',
    loadBearing: true,
  },

  // 二、金额与手续费
  {
    id: 'c_fee',
    section: '二、金额与手续费',
    template: '跨境订单退款将收取{value}。',
    sourceId: 'fee_table',
    loadBearing: true,
  },
  {
    id: 'c_threshold',
    section: '二、金额与手续费',
    template: '单笔{value}以下的退款，客服可直接审批，无需上报。',
    sourceId: 'approval_threshold',
    loadBearing: true,
  },
  {
    id: 'c_currency',
    section: '二、金额与手续费',
    template: '退款一律{value}，不支持跨币种或换卡退款。',
    sourceId: 'currency_rule',
    loadBearing: true,
  },

  // 三、支付渠道与操作
  {
    id: 'c_api',
    section: '三、支付渠道与操作',
    template: '客服在后台通过{value}发起退款。',
    sourceId: 'payment_api',
    loadBearing: true,
  },
  {
    id: 'c_channel',
    section: '三、支付渠道与操作',
    template: '当前{value}。',
    sourceId: 'channel_coverage',
    loadBearing: true,
  },

  // 四、到账与对账
  {
    id: 'c_payout',
    section: '四、到账与对账',
    template: '退款发起后将在{value}到账，可据此答复客户。',
    sourceId: 'payout_time',
    loadBearing: true,
  },
  {
    id: 'c_record',
    section: '四、到账与对账',
    template: '每笔退款须{value}，以备月度对账核查。',
    sourceId: 'record_keeping',
    loadBearing: true,
  },

  // 五、特殊情形与升级
  {
    id: 'c_dispute',
    section: '五、特殊情形与升级',
    template: '超时申请的订单，{value}。',
    sourceId: 'dispute_policy',
    loadBearing: true,
    manualOnly: true,
    manualOptions: [
      '超时申请的订单，由客服按个案酌情处理，须在工单注明理由并经组长复核。',
      '超时申请的订单，维持从严一律拒绝，仅重大异常升级主管处理。',
    ],
  },
  {
    id: 'c_identity',
    section: '五、特殊情形与升级',
    template: '处理任何退款前须先核验{value}以确认身份。',
    sourceId: 'identity_verify',
    loadBearing: true,
  },
  {
    id: 'c_fraud',
    section: '五、特殊情形与升级',
    template: '疑似欺诈或异常批量的退款，一律{value}后再处理。',
    sourceId: 'fraud_escalation',
    loadBearing: true,
  },
];
