import type { CompensationLine } from '../types'
import { formatMoney } from '../logic/format'

interface Props {
  currency: string
  lines: CompensationLine[]
  total: number
}

export function CompensationBreakdown({ currency, lines, total }: Props) {
  return (
    <div className="card breakdown">
      <h3 className="card-title">💰 你应得多少 · 透明算式</h3>
      {lines.length === 0 ? (
        <p className="empty">按当前信息，暂无可量化的直接赔付项——建议先固定证据或聚焦实际损失。</p>
      ) : (
        <table className="lines">
          <tbody>
            {lines.map((l, i) => (
              <tr key={i}>
                <td className="l-main">
                  <span className="l-label">{l.label}</span>
                  <span className="l-detail">{l.detail}</span>
                </td>
                <td className="l-amount">{formatMoney(currency, l.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <div className="total-row">
        <span>预估可主张合计</span>
        <span className="total-amount">{formatMoney(currency, total)}</span>
      </div>
    </div>
  )
}
