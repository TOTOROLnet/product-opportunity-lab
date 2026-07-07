import type { RunVerdict } from '../types'
import { fmtDuration } from '../logic/analyze'

const statusMeta: Record<
  RunVerdict['status'],
  { label: string; sub: string; cls: string; icon: string }
> = {
  SAFE: { label: 'SAFE · 可安全放行', sub: '所有动作可干净回退', cls: 'safe', icon: '✓' },
  CHECKPOINT: {
    label: 'CHECKPOINT · 设检查点后放行',
    sub: '全部可退，但撤销有代价',
    cls: 'checkpoint',
    icon: '‖',
  },
  STOP: {
    label: 'STOP · 临界点前需人工确认',
    sub: '存在不可逆动作，过线无法回退',
    cls: 'stop',
    icon: '!',
  },
}

export function RunVerdictHeader({ verdict }: { verdict: RunVerdict }) {
  const m = statusMeta[verdict.status]
  return (
    <div className={`verdict verdict-${m.cls}`}>
      <div className="verdict-badge">
        <span className="verdict-icon">{m.icon}</span>
      </div>
      <div className="verdict-body">
        <div className="verdict-title">{m.label}</div>
        <div className="verdict-headline">{verdict.headline}</div>
        <div className="verdict-stats">
          <span className="stat stat-ok">可逆 {verdict.reversibleCount}</span>
          <span className="stat stat-warn">可补偿 {verdict.compensableCount}</span>
          <span className="stat stat-bad">不可逆 {verdict.irreversibleCount}</span>
          <span className="stat stat-muted">
            总撤销耗时 ≈ {fmtDuration(verdict.totalUndoCostMs)}
          </span>
          {verdict.totalUndoMoney > 0 && (
            <span className="stat stat-muted">补偿成本 ≈ ${verdict.totalUndoMoney}</span>
          )}
        </div>
      </div>
    </div>
  )
}
