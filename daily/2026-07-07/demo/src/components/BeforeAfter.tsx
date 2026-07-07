import type { AgentAction, Diagnosis } from '../types'
import { kindIcon, kindLabel, reversibilityMeta } from '../data/labels'
import { fmtDuration } from '../logic/analyze'

interface Props {
  actions: AgentAction[]
  diagnoses: Diagnosis[]
}

export function BeforeAfter({ actions, diagnoses }: Props) {
  const byId = new Map(diagnoses.map((d) => [d.actionId, d]))
  const ordered = [...actions].sort((a, b) => a.ts - b.ts)

  return (
    <div className="ba">
      <p className="ba-intro">
        同一串 agent 动作。左边是<strong>运行时 / 日志原样呈现</strong>——只告诉你"发生了什么"。
        右边是 <strong>Reverso 标注</strong>——告诉你"能不能退、怎么退、退到哪一步就退不回来"。
      </p>
      <div className="ba-cols">
        <div className="ba-col ba-before">
          <div className="ba-title">运行时 / 日志（before）</div>
          <ul className="ba-log">
            {ordered.map((a) => (
              <li key={a.id}>
                <span className="ba-ts">+{fmtDuration(a.ts)}</span>
                <span className="ba-icon">{kindIcon[a.kind]}</span>
                <span className="ba-text">
                  <span className="ba-actor">[{a.actor}]</span> {kindLabel[a.kind]} · {a.target}
                </span>
              </li>
            ))}
          </ul>
          <div className="ba-foot">没有可逆性信息 → 出事才发现「退不回来了」。</div>
        </div>

        <div className="ba-col ba-after">
          <div className="ba-title">Reverso 标注（after）</div>
          <ul className="ba-log">
            {ordered.map((a) => {
              const d = byId.get(a.id)!
              const meta = reversibilityMeta[d.reversibility]
              return (
                <li key={a.id}>
                  <span className="ba-ts">+{fmtDuration(a.ts)}</span>
                  <span
                    className="ba-dot"
                    style={{ background: meta.color }}
                    title={meta.label}
                  />
                  <span className="ba-text">
                    <span className="ba-actor">[{a.actor}]</span> {a.target}
                    <span className="ba-tag" style={{ color: meta.color }}>
                      {meta.label} · {d.undo[0]}
                    </span>
                  </span>
                </li>
              )
            })}
          </ul>
          <div className="ba-foot">每一步都带可逆性 + 首要回滚动作 + 临界点提示 → 事前就知道。</div>
        </div>
      </div>
    </div>
  )
}
