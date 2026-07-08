export interface AuditEntry {
  id: number
  time: string
  text: string
  tone: 'info' | 'action' | 'privacy'
}

interface Props {
  dataLabels: string[]
  redacted: Set<string>
  onToggle: (label: string) => void
  auditLog: AuditEntry[]
}

export function TrustAudit({ dataLabels, redacted, onToggle, auditLog }: Props) {
  const redactedCount = dataLabels.filter((d) => redacted.has(d)).length

  return (
    <div className="card trust">
      <h3 className="card-title">🛡️ 你做主 · 授权边界与可审计留痕</h3>
      <p className="trust-intro">
        这正是执行型消费代理最该做对、也最容易做砸的地方——报告点名的头号风险。
        ClaimLadder 把它做成<strong>首屏第一性体验</strong>，而不是事后补丁。
      </p>

      <div className="trust-cols">
        <div className="trust-col">
          <h4 className="trust-sub">计划共享的数据（你可逐项脱敏）</h4>
          <p className="trust-note">已脱敏 {redactedCount} / {dataLabels.length} 项。脱敏后相关字段不会出现在任何话术 / 表单中。</p>
          <ul className="data-toggles">
            {dataLabels.map((d) => {
              const off = redacted.has(d)
              return (
                <li key={d}>
                  <span className={off ? 'dt-label off' : 'dt-label'}>{off ? '🔒 ' : ''}{d}</span>
                  <button
                    type="button"
                    className={`switch ${off ? 'off' : 'on'}`}
                    onClick={() => onToggle(d)}
                    aria-label={`切换共享：${d}`}
                  >
                    <span className="knob" />
                    <span className="switch-text">{off ? '已脱敏' : '共享'}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>

        <div className="trust-col">
          <h4 className="trust-sub">审计留痕（本次会话）</h4>
          <ul className="audit-log">
            {auditLog.length === 0 ? (
              <li className="audit-empty">暂无记录。每一步操作都会自动记入这里。</li>
            ) : (
              auditLog.map((e) => (
                <li key={e.id} className={`audit-item ${e.tone}`}>
                  <span className="audit-time">{e.time}</span>
                  <span className="audit-text">{e.text}</span>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>

      <div className="vs">
        <h4 className="trust-sub">透明「你做主」 vs 黑箱「全自动代办」</h4>
        <div className="vs-grid">
          <div className="vs-col ours">
            <div className="vs-head">ClaimLadder（本产品的切入点）</div>
            <ul>
              <li>金额有算式、主张有依据，你看得懂</li>
              <li>每个动作你一键触发、可编辑、可跳过</li>
              <li>敏感数据逐项授权，可脱敏</li>
              <li>全程审计留痕，事后可复盘</li>
              <li>跨行业通用：航班 / 酒店 / 宽带 / 快递 / 会员</li>
            </ul>
          </div>
          <div className="vs-col theirs">
            <div className="vs-head">黑箱全自动代办</div>
            <ul>
              <li>AI 在后台替你打电话 / 发函，过程不可见</li>
              <li>个人与订单信息一次性交给 AI</li>
              <li>越权或出错代价高、难追溯</li>
              <li>抽佣模式可能有夸大金额的动机</li>
              <li>常绑定单一垂类（如仅航空）</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
