import { useState } from 'react'
import type { AgentAction, Verdict } from '../types'
import RiskBadge from './RiskBadge'

interface Props {
  action: AgentAction
  onClose: () => void
  onVerdict: (id: string, verdict: Verdict, createPolicy: boolean) => void
}

export default function DecisionDetail({ action, onClose, onVerdict }: Props) {
  const [rejecting, setRejecting] = useState(false)
  const [createPolicy, setCreatePolicy] = useState(true)

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <aside className="drawer" onClick={(e) => e.stopPropagation()}>
        <header className="drawer-head">
          <div className="drawer-head-row">
            <RiskBadge risk={action.risk} />
            <span className="agent-chip">{action.agent}</span>
            <button className="icon-btn" onClick={onClose} aria-label="关闭">✕</button>
          </div>
          <h2 className="drawer-title">{action.title}</h2>
          <code className="tool">{action.tool}</code>
        </header>

        <section className="ctx">
          <h4>为什么 Agent 要做这件事（推理链）</h4>
          <ol className="reasoning">
            {action.reasoning.map((s, i) => (
              <li key={i}>
                <span className="step-label">{s.label}</span>
                <span className="step-detail">{s.detail}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="ctx">
          <h4>将要执行的 payload</h4>
          <pre className={`payload lang-${action.payloadLang}`}><code>{action.payload}</code></pre>
        </section>

        <section className="ctx">
          <h4>影响范围 / 可回滚性</h4>
          <div className="impact-grid">
            <div><span className="k">范围</span><span className="v">{action.impact.scope}</span></div>
            <div><span className="k">量级</span><span className="v">{action.impact.magnitude}</span></div>
            <div><span className="k">可回滚</span><span className="v">{action.impact.reversible}</span></div>
          </div>
        </section>

        <section className="ctx">
          <h4>历史相似裁决</h4>
          <ul className="priors">
            {action.priors.map((p, i) => (
              <li key={i} className={`prior prior-${p.verdict}`}>
                <span className="prior-verdict">{p.verdict === 'approved' ? '曾批准' : '曾拒绝'}</span>
                <span className="prior-date">{p.date}</span>
                <span className="prior-note">{p.note}</span>
              </li>
            ))}
          </ul>
        </section>

        <footer className="verdict-bar">
          {!rejecting ? (
            <>
              <button className="btn btn-approve" onClick={() => onVerdict(action.id, 'approved', false)}>
                批准
              </button>
              <button className="btn btn-edit" onClick={() => onVerdict(action.id, 'approved_edited', false)}>
                改后批准
              </button>
              <button className="btn btn-reject" onClick={() => setRejecting(true)}>
                拒绝
              </button>
            </>
          ) : (
            <div className="reject-panel">
              <label className="policy-toggle">
                <input
                  type="checkbox"
                  checked={createPolicy}
                  onChange={(e) => setCreatePolicy(e.target.checked)}
                />
                把这次拒绝一键转为策略（下次自动处理同类动作）
              </label>
              <div className="reject-actions">
                <button className="btn btn-ghost" onClick={() => setRejecting(false)}>返回</button>
                <button className="btn btn-reject" onClick={() => onVerdict(action.id, 'rejected', createPolicy)}>
                  确认拒绝
                </button>
              </div>
            </div>
          )}
        </footer>
      </aside>
    </div>
  )
}
