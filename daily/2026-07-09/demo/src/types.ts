export type ThoughtType = 'decision' | 'open' | 'action' | 'context'

export interface Segment {
  id: string
  /** 一段「思路单元」的原始口述文本 */
  text: string
  /** AI 建议的类型（示例分析，非实时模型） */
  aiType: ThoughtType
  /** AI 的置信度 0–1，用于展示不确定性 */
  confidence: number
}

/** 一对「你先说 X、后来改口 not-X」的矛盾 / 改主意 */
export interface Contradiction {
  id: string
  /** 较早说的那一句 */
  fromId: string
  /** 较晚说的、反悔/改口的那一句 */
  toId: string
  /** 一句话说明这是关于什么的改主意 */
  topic: string
}

export interface Scenario {
  id: string
  emoji: string
  title: string
  /** 一句话场景背景 */
  context: string
  segments: Segment[]
  contradictions: Contradiction[]
}

/** 用户对某个矛盾对的最终裁决 */
export type Resolution = 'later' | 'earlier' | 'keepOpen'
