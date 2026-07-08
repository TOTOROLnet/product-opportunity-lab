import type { Scenario } from '../types'

// 5 mock consumer-dispute scenarios. Field values feed the deterministic
// analysis engine in ../logic/analyze.ts. All rules are ILLUSTRATIVE.

export const SCENARIOS: Scenario[] = [
  {
    id: 'flight',
    name: '航班延误 / 取消',
    emoji: '✈️',
    tagline: '欧盟 EU261 及各国民航规则下，延误达标可主张定额赔偿',
    currency: '€',
    fields: [
      {
        key: 'distance',
        label: '航段距离',
        type: 'select',
        example: 'long',
        options: [
          { value: 'short', label: '短途（≤1500 km）' },
          { value: 'medium', label: '中途（1500–3500 km）' },
          { value: 'long', label: '长途（>3500 km）' },
        ],
        help: 'EU261 第7条按距离设定 €250 / €400 / €600 定额。',
      },
      {
        key: 'delayHours',
        label: '到达延误时长',
        type: 'number',
        unit: '小时',
        example: '5',
        placeholder: '例如 5',
      },
      {
        key: 'reason',
        label: '延误原因',
        type: 'select',
        example: 'airline',
        options: [
          { value: 'airline', label: '航司可控（机务 / 运力 / 排班）' },
          { value: 'force', label: '不可抗力（极端天气 / 空管 / 罢工）' },
        ],
        help: '不可抗力通常免除定额赔偿，但照料与退票义务仍在。',
      },
      {
        key: 'ticketPrice',
        label: '机票票价',
        type: 'currency',
        unit: '€',
        example: '520',
        placeholder: '例如 520',
      },
    ],
  },
  {
    id: 'hotel',
    name: '酒店超售 / 无法入住',
    emoji: '🏨',
    tagline: '已确认预订却被拒之门外，可主张退款 + 重新安置 + 补偿',
    currency: '¥',
    fields: [
      {
        key: 'nights',
        label: '受影响晚数',
        type: 'number',
        unit: '晚',
        example: '2',
        placeholder: '例如 2',
      },
      {
        key: 'roomRate',
        label: '每晚房费',
        type: 'currency',
        unit: '¥',
        example: '680',
        placeholder: '例如 680',
      },
      {
        key: 'prepaid',
        label: '是否已在线预付',
        type: 'select',
        example: 'yes',
        options: [
          { value: 'yes', label: '是，已预付并出确认单' },
          { value: 'no', label: '否，到店付' },
        ],
      },
      {
        key: 'extraCost',
        label: '被迫产生的额外支出（交通 / 差价）',
        type: 'currency',
        unit: '¥',
        example: '260',
        placeholder: '例如 260',
      },
    ],
  },
  {
    id: 'broadband',
    name: '宽带 / 流媒体长期故障',
    emoji: '📶',
    tagline: '付了费却长期不可用，可主张按天减费 + 违约补偿',
    currency: '¥',
    fields: [
      {
        key: 'monthlyFee',
        label: '月费',
        type: 'currency',
        unit: '¥',
        example: '129',
        placeholder: '例如 129',
      },
      {
        key: 'outageDays',
        label: '不可用天数',
        type: 'number',
        unit: '天',
        example: '9',
        placeholder: '例如 9',
      },
      {
        key: 'reported',
        label: '是否已报障但未修复',
        type: 'select',
        example: 'yes',
        options: [
          { value: 'yes', label: '是，有报障工单记录' },
          { value: 'no', label: '否 / 未留记录' },
        ],
      },
    ],
  },
  {
    id: 'parcel',
    name: '快递损坏 / 丢失',
    emoji: '📦',
    tagline: '保价 / 未保价路径不同，取证是否充分决定拿回多少',
    currency: '¥',
    fields: [
      {
        key: 'itemValue',
        label: '物品实际价值',
        type: 'currency',
        unit: '¥',
        example: '1800',
        placeholder: '例如 1800',
      },
      {
        key: 'insured',
        label: '是否保价',
        type: 'select',
        example: 'yes',
        options: [
          { value: 'yes', label: '是，已保价' },
          { value: 'no', label: '否，未保价' },
        ],
      },
      {
        key: 'declaredValue',
        label: '保价金额（未保价可留空/填 0）',
        type: 'currency',
        unit: '¥',
        example: '2000',
        placeholder: '例如 2000',
      },
      {
        key: 'proof',
        label: '是否有开箱视频 / 照片等证据',
        type: 'select',
        example: 'yes',
        options: [
          { value: 'yes', label: '是，证据充分' },
          { value: 'no', label: '否 / 证据薄弱' },
        ],
      },
    ],
  },
  {
    id: 'subscription',
    name: '会员自动续费误扣',
    emoji: '💳',
    tagline: '未显著告知 / 难以取消的自动续费，可主张全额退款',
    currency: '¥',
    fields: [
      {
        key: 'chargeAmount',
        label: '每期扣费金额',
        type: 'currency',
        unit: '¥',
        example: '68',
        placeholder: '例如 68',
      },
      {
        key: 'monthsCharged',
        label: '被连续扣费期数',
        type: 'number',
        unit: '期',
        example: '6',
        placeholder: '例如 6',
      },
      {
        key: 'consent',
        label: '开通 / 续费时是否显著告知',
        type: 'select',
        example: 'no',
        options: [
          { value: 'no', label: '否，暗扣 / 取消入口很深' },
          { value: 'yes', label: '是，有明确二次确认' },
        ],
      },
      {
        key: 'used',
        label: '扣费期间是否实际使用了服务',
        type: 'select',
        example: 'no',
        options: [
          { value: 'no', label: '否，基本没用' },
          { value: 'yes', label: '是，有使用' },
        ],
      },
    ],
  },
]

export function getScenario(id: string): Scenario | undefined {
  return SCENARIOS.find((s) => s.id === id)
}
