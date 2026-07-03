// 所有数据均为 mock，用于演示 Contextlens 的"上下文窗口 X 光"概念。
// 不接任何真实模型 / 后端 / 外部 API。

export type BlockKind =
  | 'system' // 系统提示
  | 'policy' // 策略 / 约束（关键）
  | 'memory' // 长期记忆
  | 'retrieved' // 检索文档
  | 'tool' // 工具输出
  | 'history' // 近期对话

export type BlockStatus = 'kept' | 'truncated' | 'evicted'

export interface ContextBlock {
  id: string
  label: string
  kind: BlockKind
  /** 该步实际占用窗口的 token（被驱逐则为 0） */
  tokens: number
  /** 原始 token（用于展示截断/驱逐损失了多少） */
  fullTokens?: number
  status: BlockStatus
  /** 是否为关键块（策略/风险记忆等）；被驱逐时会作为高危告警 */
  critical?: boolean
  /** 是否被 Pin（Pin 后永不驱逐） */
  pinned?: boolean
  /** 截断/驱逐原因 */
  reason?: string
}

export type Risk = 'none' | 'low' | 'high'

export interface StepOutcome {
  kind: 'ok' | 'warn' | 'danger'
  text: string
}

export interface RunStep {
  id: number
  title: string
  detail: string
  risk: Risk
  blocks: ContextBlock[]
  /** 本步发生的驱逐/溢出说明（若有） */
  overflowNote?: string
  outcome?: StepOutcome
}

export interface ReportCard {
  evictions: number
  buriedCritical: number
  redundantToolTokens: number
  recommendations: string[]
}

export interface Scenario {
  id: 'baseline' | 'fixed'
  name: string
  subtitle: string
  budgetTokens: number
  steps: RunStep[]
  verdict: { kind: 'danger' | 'ok'; headline: string; detail: string }
  report: ReportCard
}
