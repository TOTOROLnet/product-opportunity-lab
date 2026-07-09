import type { Segment, ThoughtType } from '../types'
import { TYPE_META, TYPE_ORDER, confidenceLabel } from '../logic/labels'

interface Props {
  seg: Segment
  index: number
  userType: ThoughtType
  confirmed: boolean
  removed: boolean
  inContradiction: boolean
  onSetType: (id: string, type: ThoughtType) => void
  onToggleConfirm: (id: string, value: boolean) => void
  onToggleRemove: (id: string) => void
}

export function SegmentCard({
  seg,
  index,
  userType,
  confirmed,
  removed,
  inContradiction,
  onSetType,
  onToggleConfirm,
  onToggleRemove,
}: Props) {
  const changed = userType !== seg.aiType
  const meta = TYPE_META[userType]

  return (
    <div
      className={[
        'seg-card',
        `type-${meta.key}`,
        confirmed ? 'is-confirmed' : '',
        removed ? 'is-removed' : '',
        inContradiction ? 'is-conflict' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="seg-top">
        <span className="seg-idx">{index + 1}</span>
        <p className="seg-text">{seg.text}</p>
        {inContradiction && <span className="conflict-flag" title="这句参与了一次改主意">⚠</span>}
      </div>

      {!removed && (
        <>
          <div className="seg-ai">
            <span className="ai-watermark">示例分析</span>
            <span className="ai-guess">
              AI 猜：{TYPE_META[seg.aiType].icon} {TYPE_META[seg.aiType].label}
            </span>
            <span className={`ai-conf conf-${Math.round(seg.confidence * 10)}`}>
              {confidenceLabel(seg.confidence)}（{Math.round(seg.confidence * 100)}%）
            </span>
          </div>

          <div className="seg-types">
            {TYPE_ORDER.map((t) => (
              <button
                key={t}
                className={`type-btn type-${TYPE_META[t].key} ${userType === t ? 'sel' : ''}`}
                onClick={() => onSetType(seg.id, t)}
                title={TYPE_META[t].hint}
              >
                {TYPE_META[t].icon} {TYPE_META[t].short}
              </button>
            ))}
            {changed && <span className="edited-tag">已改</span>}
          </div>

          <div className="seg-actions">
            <button
              className={`btn sm ${confirmed ? 'confirmed-btn' : 'primary'}`}
              onClick={() => onToggleConfirm(seg.id, !confirmed)}
            >
              {confirmed ? '✓ 已确认（点此撤销）' : '确认这条'}
            </button>
            <button className="btn sm ghost" onClick={() => onToggleRemove(seg.id)}>
              删掉
            </button>
          </div>
        </>
      )}

      {removed && (
        <div className="seg-removed-row">
          <span className="muted">已删除（不进入思路卡）</span>
          <button className="btn sm ghost" onClick={() => onToggleRemove(seg.id)}>
            撤销删除
          </button>
        </div>
      )}
    </div>
  )
}
