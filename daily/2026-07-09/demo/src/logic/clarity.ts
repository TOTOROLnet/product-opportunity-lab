import type { Resolution, Scenario, Segment, ThoughtType } from '../types'

export interface MindChange {
  id: string
  topic: string
  fromText: string
  toText: string
  finalText: string
  resolution: Resolution
}

export interface ClarityResult {
  buckets: Record<ThoughtType, Segment[]>
  mindChanges: MindChange[]
}

export interface ConfirmState {
  userTypes: Record<string, ThoughtType>
  confirmed: Record<string, boolean>
  removed: Record<string, boolean>
  resolutions: Record<string, Resolution>
}

const RESOLUTION_FINAL: Record<Resolution, string> = {
  later: '以后来的说法为准',
  earlier: '还是以最初的说法为准',
  keepOpen: '仍未想清，留作待定',
}

export function buildClarity(scenario: Scenario, state: ConfirmState): ClarityResult {
  const segById = new Map(scenario.segments.map((s) => [s.id, s]))
  const superseded = new Set<string>()
  const mindChanges: MindChange[] = []

  for (const c of scenario.contradictions) {
    const res = state.resolutions[c.id]
    if (!res) continue
    const from = segById.get(c.fromId)
    const to = segById.get(c.toId)
    if (!from || !to) continue

    if (res === 'later') superseded.add(c.fromId)
    else if (res === 'earlier') superseded.add(c.toId)
    else {
      superseded.add(c.fromId)
      superseded.add(c.toId)
    }

    let finalText = RESOLUTION_FINAL[res]
    if (res === 'later') finalText = `最终：${to.text}`
    else if (res === 'earlier') finalText = `最终：${from.text}`

    mindChanges.push({
      id: c.id,
      topic: c.topic,
      fromText: from.text,
      toText: to.text,
      finalText,
      resolution: res,
    })
  }

  const buckets: Record<ThoughtType, Segment[]> = {
    decision: [],
    open: [],
    action: [],
    context: [],
  }

  for (const seg of scenario.segments) {
    if (state.removed[seg.id]) continue
    if (!state.confirmed[seg.id]) continue
    if (superseded.has(seg.id)) continue
    const type = state.userTypes[seg.id] ?? seg.aiType
    buckets[type].push(seg)
  }

  return { buckets, mindChanges }
}

export function plainTranscript(scenario: Scenario): string {
  return scenario.segments.map((s) => s.text).join('')
}

export function clarityToText(scenario: Scenario, result: ClarityResult): string {
  const lines: string[] = [`# 思路卡 · ${scenario.title}`, '']
  const push = (title: string, segs: Segment[]) => {
    if (segs.length === 0) return
    lines.push(title)
    segs.forEach((s) => lines.push(`- ${s.text}`))
    lines.push('')
  }
  push('## ✅ 我决定了', result.buckets.decision)
  push('## ❓ 还没想清', result.buckets.open)
  push('## ▶ 行动项', result.buckets.action)
  push('## 💭 背景想法', result.buckets.context)

  if (result.mindChanges.length > 0) {
    lines.push('## ⚠ 我改了什么主意')
    result.mindChanges.forEach((m) => {
      lines.push(`- 关于「${m.topic}」：先说「${m.fromText}」，后又说「${m.toText}」→ ${m.finalText}`)
    })
    lines.push('')
  }
  return lines.join('\n').trim()
}
