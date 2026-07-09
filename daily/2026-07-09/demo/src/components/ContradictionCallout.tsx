import type { Contradiction, Resolution, Segment } from '../types'

interface Props {
  contradiction: Contradiction
  from: Segment
  to: Segment
  resolution: Resolution | undefined
  order: number
  onResolve: (id: string, res: Resolution) => void
}

const OPTIONS: { key: Resolution; label: string }[] = [
  { key: 'later', label: '以后来的为准' },
  { key: 'earlier', label: '还是最初的对' },
  { key: 'keepOpen', label: '都保留 · 我还没想清' },
]

export function ContradictionCallout({
  contradiction,
  from,
  to,
  resolution,
  order,
  onResolve,
}: Props) {
  return (
    <div className={`callout ${resolution ? 'resolved' : 'pending'}`}>
      <div className="callout-head">
        <span className="callout-badge">⚠ 改主意 #{order}</span>
        <span className="callout-topic">关于「{contradiction.topic}」</span>
        {resolution ? (
          <span className="callout-status ok">已拍板</span>
        ) : (
          <span className="callout-status wait">待你拍板</span>
        )}
      </div>

      <div className="callout-pair">
        <div className="pair-side earlier">
          <span className="pair-tag">你先说</span>
          <span className="pair-text">{from.text}</span>
        </div>
        <div className="pair-arrow">改口 →</div>
        <div className="pair-side later">
          <span className="pair-tag">后来又说</span>
          <span className="pair-text">{to.text}</span>
        </div>
      </div>

      <div className="callout-hint">
        别的听写 / 洗稿工具会把这种反复<b>抹平</b>成一段漂亮文本；Untangle 特意把它<b>拎出来</b>，让你亲自拍板到底怎么想。
      </div>

      <div className="callout-options">
        {OPTIONS.map((o) => (
          <button
            key={o.key}
            className={`btn sm ${resolution === o.key ? 'primary' : 'ghost'}`}
            onClick={() => onResolve(contradiction.id, o.key)}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}
