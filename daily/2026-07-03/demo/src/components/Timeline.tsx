import type { RunStep } from '../types'

function riskDot(risk: RunStep['risk']) {
  const cls = risk === 'high' ? 'risk-high' : risk === 'low' ? 'risk-low' : 'risk-none'
  return <span className={`tl-dot ${cls}`} />
}

export default function Timeline({
  steps,
  selectedId,
  onSelect,
}: {
  steps: RunStep[]
  selectedId: number
  onSelect: (id: number) => void
}) {
  return (
    <div className="timeline">
      <div className="timeline-head">执行时间线</div>
      <ol className="tl-list">
        {steps.map((s) => {
          const active = s.id === selectedId
          const evicted = s.blocks.some((b) => b.status === 'evicted')
          return (
            <li key={s.id}>
              <button
                className={`tl-item ${active ? 'active' : ''} ${s.risk === 'high' ? 'is-high' : ''}`}
                onClick={() => onSelect(s.id)}
              >
                {riskDot(s.risk)}
                <span className="tl-step">步骤 {s.id}</span>
                <span className="tl-title">{s.title}</span>
                {evicted && <span className="tl-flag" title="本步发生驱逐">驱逐</span>}
                {s.risk === 'high' && s.outcome?.kind === 'danger' && (
                  <span className="tl-flag danger" title="高风险动作">高风险</span>
                )}
              </button>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
