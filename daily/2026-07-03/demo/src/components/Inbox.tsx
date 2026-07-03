import type { AgentAction } from '../types'
import RiskBadge from './RiskBadge'

interface Props {
  actions: AgentAction[]
  onSelect: (id: string) => void
}

export default function Inbox({ actions, onSelect }: Props) {
  const pending = actions.filter((a) => a.status === 'pending')

  if (pending.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-emoji">✓</div>
        <h3>收件箱已清空</h3>
        <p>所有待裁决动作都已处理。到「策略与学习」看看你的裁决沉淀了什么。</p>
      </div>
    )
  }

  return (
    <div className="inbox">
      <div className="inbox-head">
        <h2>审批收件箱</h2>
        <p className="muted">{pending.length} 个高风险 Agent 动作等待裁决。点击任意一条查看决策上下文。</p>
      </div>
      <ul className="action-list">
        {pending.map((a) => (
          <li key={a.id}>
            <button className="action-card" onClick={() => onSelect(a.id)}>
              <div className="action-top">
                <RiskBadge risk={a.risk} />
                <span className="agent-chip">{a.agent}</span>
                <span className="time">{a.createdAt}</span>
              </div>
              <div className="action-title">{a.title}</div>
              <div className="action-meta">
                <code className="tool">{a.tool}</code>
                <span className="impact-hint">影响：{a.impact.scope} · {a.impact.magnitude}</span>
              </div>
              <div className="action-cta">查看决策上下文 →</div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
