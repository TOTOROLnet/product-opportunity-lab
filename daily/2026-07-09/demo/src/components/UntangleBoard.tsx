import { useMemo } from 'react'
import type { Resolution, Scenario, ThoughtType } from '../types'
import type { ConfirmState } from '../logic/clarity'
import { SegmentCard } from './SegmentCard'
import { ContradictionCallout } from './ContradictionCallout'

interface Props {
  scenario: Scenario
  state: ConfirmState
  onSetType: (id: string, type: ThoughtType) => void
  onToggleConfirm: (id: string, value: boolean) => void
  onToggleRemove: (id: string) => void
  onConfirmAll: () => void
  onResolve: (id: string, res: Resolution) => void
  onBack: () => void
  onProceed: () => void
}

export function UntangleBoard({
  scenario,
  state,
  onSetType,
  onToggleConfirm,
  onToggleRemove,
  onConfirmAll,
  onResolve,
  onBack,
  onProceed,
}: Props) {
  const segById = useMemo(
    () => new Map(scenario.segments.map((s) => [s.id, s])),
    [scenario],
  )
  const conflictIds = useMemo(() => {
    const set = new Set<string>()
    scenario.contradictions.forEach((c) => {
      set.add(c.fromId)
      set.add(c.toId)
    })
    return set
  }, [scenario])

  const activeSegs = scenario.segments.filter((s) => !state.removed[s.id])
  const confirmedCount = activeSegs.filter((s) => state.confirmed[s.id]).length
  const resolvedCount = scenario.contradictions.filter((c) => state.resolutions[c.id]).length
  const totalTodo = activeSegs.length + scenario.contradictions.length
  const doneTodo = confirmedCount + resolvedCount
  const pct = totalTodo === 0 ? 100 : Math.round((doneTodo / totalTodo) * 100)

  const segsConfirmed = confirmedCount === activeSegs.length
  const allResolved = resolvedCount === scenario.contradictions.length
  const canProceed = segsConfirmed && allResolved

  return (
    <section className="untangle">
      <div className="panel-head">
        <h2>2 · 解结：分类 · 抓矛盾 · 你拍板</h2>
        <p className="muted">
          AI 先给出「示例分析」（每条思路单元的类型 + 置信度）。你是方向盘——可以改类型、删掉噪音，
          <b>并且必须亲自解决每一处「你改了主意」的矛盾</b>，才能生成思路卡。
        </p>
      </div>

      <div className="progress-wrap">
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${pct}%` }} />
        </div>
        <div className="progress-meta">
          <span>
            已确认思路单元 {confirmedCount}/{activeSegs.length} · 已拍板矛盾 {resolvedCount}/
            {scenario.contradictions.length}
          </span>
          <button className="btn sm ghost" onClick={onConfirmAll} disabled={segsConfirmed}>
            批量确认全部思路单元
          </button>
        </div>
      </div>

      {scenario.contradictions.length > 0 && (
        <div className="conflict-zone">
          <h3 className="zone-title">
            ⚠ 检测到 {scenario.contradictions.length} 处「你改了主意」——这是我们和听写/洗稿工具最不一样的地方
          </h3>
          <div className="callouts">
            {scenario.contradictions.map((c, i) => {
              const from = segById.get(c.fromId)
              const to = segById.get(c.toId)
              if (!from || !to) return null
              return (
                <ContradictionCallout
                  key={c.id}
                  contradiction={c}
                  from={from}
                  to={to}
                  order={i + 1}
                  resolution={state.resolutions[c.id]}
                  onResolve={onResolve}
                />
              )
            })}
          </div>
        </div>
      )}

      <div className="seg-list">
        <h3 className="zone-title subtle">全部思路单元（{scenario.segments.length} 条）</h3>
        {scenario.segments.map((seg, i) => (
          <SegmentCard
            key={seg.id}
            seg={seg}
            index={i}
            userType={state.userTypes[seg.id]}
            confirmed={!!state.confirmed[seg.id]}
            removed={!!state.removed[seg.id]}
            inContradiction={conflictIds.has(seg.id)}
            onSetType={onSetType}
            onToggleConfirm={onToggleConfirm}
            onToggleRemove={onToggleRemove}
          />
        ))}
      </div>

      <div className="board-cta">
        <button className="btn ghost" onClick={onBack}>
          ← 回去重听
        </button>
        <div className="cta-right">
          {!canProceed && (
            <span className="gate-hint">
              {segsConfirmed ? '还有矛盾没拍板' : '还有思路单元没确认'}，先处理完再生成思路卡
            </span>
          )}
          <button className="btn primary lg" onClick={onProceed} disabled={!canProceed}>
            生成思路卡 →
          </button>
        </div>
      </div>
    </section>
  )
}
