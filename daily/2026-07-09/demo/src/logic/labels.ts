import type { ThoughtType } from '../types'

interface TypeMeta {
  label: string
  short: string
  icon: string
  /** CSS 类后缀，用于着色 */
  key: string
  hint: string
}

export const TYPE_META: Record<ThoughtType, TypeMeta> = {
  decision: { label: '决定', short: '决定', icon: '✅', key: 'decision', hint: '你已经拍板的结论' },
  open: { label: '还没想清', short: '待定', icon: '❓', key: 'open', hint: '悬而未决、需要继续想或去确认的问题' },
  action: { label: '行动项', short: '行动', icon: '▶', key: 'action', hint: '接下来要动手做的事' },
  context: { label: '背景想法', short: '背景', icon: '💭', key: 'context', hint: '铺垫、观察或情绪，不是结论也不是待办' },
}

export const TYPE_ORDER: ThoughtType[] = ['decision', 'open', 'action', 'context']

export function confidenceLabel(c: number): string {
  if (c >= 0.8) return '较有把握'
  if (c >= 0.6) return '不太确定'
  return '很没把握'
}
