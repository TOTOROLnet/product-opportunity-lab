import type { AgentAction, Diagnosis } from '../types'
import { kindIcon, kindLabel, reversibilityMeta } from '../data/labels'
import { fmtDuration } from '../logic/analyze'

interface Props {
  action: AgentAction | null
  diagnosis: Diagnosis | null
  isPointOfNoReturn: boolean
}

export function ActionDetail({ action, diagnosis, isPointOfNoReturn }: Props) {
  if (!action || !diagnosis) {
    return (
      <div className="detail detail-empty">
        <p>← 在左侧时间轴点选一个动作，查看它的可逆性与回滚手册。</p>
      </div>
    )
  }
  const meta = reversibilityMeta[diagnosis.reversibility]
  return (
    <div className="detail">
      <div className="detail-head">
        <span className="detail-icon">{kindIcon[action.kind]}</span>
        <div>
          <div className="detail-target">{action.target}</div>
          <div className="detail-sub">
            <span>{action.actor}</span> · <span>{kindLabel[action.kind]}</span>
          </div>
        </div>
        <span className="detail-badge" style={{ color: meta.color, borderColor: meta.color }}>
          {meta.label}
        </span>
      </div>

      {isPointOfNoReturn && (
        <div className="detail-pnr">⚠ 这是本次 run 的不可逆临界点：执行到这一步后就无法回退。</div>
      )}

      <p className="detail-note">{diagnosis.note}</p>

      <div className="detail-section">
        <h4>回滚手册 · Rollback runbook</h4>
        {diagnosis.reversibility === 'IRREVERSIBLE' ? (
          <ul className="runbook runbook-bad">
            {diagnosis.undo.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        ) : (
          <ol className="runbook">
            {diagnosis.undo.map((s, i) => (
              <li key={i}>
                <code>{s}</code>
              </li>
            ))}
          </ol>
        )}
      </div>

      <div className="detail-grid">
        <div>
          <h4>爆炸半径</h4>
          <ul className="blast">
            {diagnosis.blastRadius.map((b, i) => (
              <li key={i}>{b}</li>
            ))}
          </ul>
        </div>
        <div>
          <h4>撤销代价</h4>
          <div className="cost">
            <div>
              时间 <strong>{fmtDuration(diagnosis.undoCostMs)}</strong>
            </div>
            {diagnosis.undoMoney ? (
              <div>
                金钱 <strong>≈ ${diagnosis.undoMoney}</strong>
              </div>
            ) : (
              <div className="cost-muted">无直接金钱成本</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
