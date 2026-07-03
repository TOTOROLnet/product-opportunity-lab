import type { RiskLevel } from '../types'

const LABELS: Record<RiskLevel, string> = {
  critical: '极高风险',
  high: '高风险',
  medium: '中风险',
}

export default function RiskBadge({ risk }: { risk: RiskLevel }) {
  return <span className={`risk risk-${risk}`}>{LABELS[risk]}</span>
}
