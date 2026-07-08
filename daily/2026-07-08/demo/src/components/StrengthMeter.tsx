import type { StrengthFactor } from '../types'

interface Props {
  strength: number
  verdict: string
  factors: StrengthFactor[]
}

function tone(strength: number): string {
  if (strength >= 78) return 'strong'
  if (strength >= 58) return 'good'
  if (strength >= 38) return 'mid'
  return 'weak'
}

export function StrengthMeter({ strength, verdict, factors }: Props) {
  return (
    <div className="strength">
      <div className="strength-head">
        <span className="strength-title">案件强度</span>
        <span className={`strength-num ${tone(strength)}`}>{strength}<em>/100</em></span>
      </div>
      <div className="strength-bar">
        <div className={`strength-fill ${tone(strength)}`} style={{ width: `${strength}%` }} />
      </div>
      <p className={`strength-verdict ${tone(strength)}`}>{verdict}</p>
      <ul className="factors">
        {factors.map((f, i) => (
          <li key={i} className={f.delta >= 0 ? 'pos' : 'neg'}>
            <span className="factor-sign">{f.delta >= 0 ? '＋' : '－'}</span>
            <span className="factor-label">{f.label}</span>
            <span className="factor-delta">{f.delta >= 0 ? `+${f.delta}` : f.delta}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
