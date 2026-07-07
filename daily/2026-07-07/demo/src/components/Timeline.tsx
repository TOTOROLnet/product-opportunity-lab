import type { AgentAction, Diagnosis } from '../types'
import { kindIcon, kindLabel, reversibilityMeta } from '../data/labels'

interface Props {
  actions: AgentAction[]
  diagnoses: Diagnosis[]
  selectedId: string | null
  pointOfNoReturnId: string | null
  onSelect: (id: string) => void
}

export function Timeline({
  actions,
  diagnoses,
  selectedId,
  pointOfNoReturnId,
  onSelect,
}: Props) {
  const byId = new Map(diagnoses.map((d) => [d.actionId, d]))
  const ordered = [...actions].sort((a, b) => a.ts - b.ts)
  const pnrIndex = pointOfNoReturnId
    ? ordered.findIndex((a) => a.id === pointOfNoReturnId)
    : -1

  return (
    <div className="timeline">
      {ordered.map((a, i) => {
        const d = byId.get(a.id)!
        const meta = reversibilityMeta[d.reversibility]
        const pastPnr = pnrIndex >= 0 && i >= pnrIndex
        return (
          <div key={a.id}>
            {pnrIndex === i && (
              <div className="pnr-line">
                <span>不可逆临界线 · point of no return</span>
              </div>
            )}
            <button
              className={`tl-item${selectedId === a.id ? ' tl-selected' : ''}${
                pastPnr ? ' tl-past-pnr' : ''
              }`}
              onClick={() => onSelect(a.id)}
            >
              <span className="tl-rail" style={{ background: meta.color }} />
              <span className="tl-icon">{kindIcon[a.kind]}</span>
              <span className="tl-main">
                <span className="tl-target">{a.target}</span>
                <span className="tl-meta">
                  <span className="tl-actor">{a.actor}</span>
                  <span className="tl-kind">{kindLabel[a.kind]}</span>
                </span>
              </span>
              <span className="tl-badge" style={{ color: meta.color, borderColor: meta.color }}>
                {meta.label}
              </span>
            </button>
          </div>
        )
      })}
    </div>
  )
}
