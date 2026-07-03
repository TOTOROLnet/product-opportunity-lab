import type { Scenario } from '../types'

const fmt = (n: number) => n.toLocaleString('en-US')

export default function Report({ scenario }: { scenario: Scenario }) {
  const { report, verdict } = scenario
  return (
    <div className="report">
      <div className={`verdict verdict-${verdict.kind}`}>
        <div className="verdict-head">{verdict.kind === 'danger' ? '⛔ 结论' : '✅ 结论'} · {verdict.headline}</div>
        <div className="verdict-detail">{verdict.detail}</div>
      </div>

      <div className="cards">
        <div className={`card ${report.evictions > 0 ? 'card-bad' : 'card-good'}`}>
          <div className="card-num">{report.evictions}</div>
          <div className="card-label">关键块驱逐事件</div>
        </div>
        <div className={`card ${report.buriedCritical > 0 ? 'card-bad' : 'card-good'}`}>
          <div className="card-num">{report.buriedCritical}</div>
          <div className="card-label">决策时缺失的关键约束</div>
        </div>
        <div className={`card ${report.redundantToolTokens > 0 ? 'card-warn' : 'card-good'}`}>
          <div className="card-num">{fmt(report.redundantToolTokens)}</div>
          <div className="card-label">可压缩的冗余工具 tokens</div>
        </div>
      </div>

      <div className="reco">
        <div className="reco-head">窗口健康建议</div>
        <ul>
          {report.recommendations.map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}
