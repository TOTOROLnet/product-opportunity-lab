import type { Policy, PolicyMode } from '../types'

const MODE_LABEL: Record<PolicyMode, string> = {
  block: '拦截',
  needs_approval: '需审批',
  auto_allow: '自动放行',
}

interface Props {
  policies: Policy[]
}

export default function Policies({ policies }: Props) {
  return (
    <div className="policies">
      <div className="inbox-head">
        <h2>策略与学习</h2>
        <p className="muted">
          每一次人类裁决都会沉淀为可复用策略——尤其是拒绝。策略越多，同类动作越无需再次人工介入。
        </p>
      </div>

      <ul className="policy-list">
        {policies.map((p) => (
          <li key={p.id} className="policy-card">
            <div className="policy-top">
              <span className={`mode mode-${p.mode}`}>{MODE_LABEL[p.mode]}</span>
              <span className={`src src-${p.source}`}>{p.source === 'auto' ? '自动沉淀' : '人工设置'}</span>
            </div>
            <div className="policy-rule">{p.rule}</div>
            <div className="policy-origin">{p.origin}</div>
          </li>
        ))}
      </ul>
    </div>
  )
}
