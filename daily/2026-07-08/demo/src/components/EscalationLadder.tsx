import { useState } from 'react'
import type { LadderStep, Reversibility } from '../types'

interface Props {
  steps: LadderStep[]
  doneCount: number
  redacted: Set<string>
  onAdvance: () => void
}

const REV_LABEL: Record<Reversibility, string> = {
  soft: '低风险 · 可撤回',
  medium: '中风险 · 留痕',
  hard: '高风险 · 正式程序',
}

export function EscalationLadder({ steps, doneCount, redacted, onAdvance }: Props) {
  const [expanded, setExpanded] = useState<number>(0)
  const [copiedId, setCopiedId] = useState<string>('')

  const activeIndex = Math.min(doneCount, steps.length - 1)
  const currentLeverage = steps[activeIndex]?.leverage ?? 0
  const allDone = doneCount >= steps.length

  async function copy(step: LadderStep) {
    try {
      await navigator.clipboard.writeText(step.draft)
    } catch {
      // Clipboard may be unavailable (e.g. non-secure context); ignore silently.
    }
    setCopiedId(step.id)
    window.setTimeout(() => setCopiedId(''), 1600)
  }

  return (
    <div className="card ladder">
      <div className="ladder-head">
        <h3 className="card-title">🪜 升级阶梯 · 先礼后兵，逐级施压</h3>
        <div className="leverage-badge">
          <span>当前筹码</span>
          <strong>{allDone ? 100 : currentLeverage}</strong>
        </div>
      </div>
      <p className="ladder-hint">
        每一步都由<strong>你自己一键出手</strong>——ClaimLadder 只准备话术、算清依据、规划路径，
        <strong>不会替你自动拨打或发送</strong>。谈成即止，不必爬到顶。
      </p>

      <ol className="rungs">
        {steps.map((s, i) => {
          const state = i < doneCount ? 'done' : i === doneCount ? 'active' : 'locked'
          const open = expanded === i
          return (
            <li key={s.id} className={`rung ${state} ${open ? 'open' : ''}`}>
              <div className="rung-line">
                <div className="rung-marker">
                  {state === 'done' ? '✓' : s.rung}
                </div>
                <button
                  className="rung-summary"
                  type="button"
                  onClick={() => setExpanded(open ? -1 : i)}
                >
                  <div className="rung-main">
                    <span className="rung-channel">{s.channel}</span>
                    <span className="rung-target">对象：{s.target} · 预计 {s.eta}</span>
                  </div>
                  <div className="rung-meta">
                    <span className={`rev rev-${s.reversibility}`}>{REV_LABEL[s.reversibility]}</span>
                    <span className="rung-lev">
                      <span className="rung-lev-bar"><span style={{ width: `${s.leverage}%` }} /></span>
                      筹码 {s.leverage}
                    </span>
                    <span className="chev">{open ? '▲' : '▼'}</span>
                  </div>
                </button>
              </div>

              {open && (
                <div className="rung-body">
                  <p className="rung-goal">🎯 目标：{s.goal}</p>

                  <div className="draft-block">
                    <div className="draft-head">
                      <span>{s.draftTitle}（可复制 · 你自己发送）</span>
                      <button className="copy-btn" type="button" onClick={() => copy(s)}>
                        {copiedId === s.id ? '已复制 ✓' : '复制'}
                      </button>
                    </div>
                    <pre className="draft-text">{s.draft}</pre>
                  </div>

                  <div className="data-shared">
                    <span className="ds-label">此步将共享：</span>
                    {s.dataShared.map((d) => (
                      <span key={d} className={`ds-chip ${redacted.has(d) ? 'redacted' : ''}`}>
                        {redacted.has(d) ? '🔒 已脱敏' : d}
                      </span>
                    ))}
                  </div>

                  <p className="rev-note">🛡️ {s.reversibilityNote}</p>

                  {state === 'active' && (
                    <button className="advance-btn" type="button" onClick={onAdvance}>
                      我已自己发送 / 得到回复，标记完成并解锁下一级 →
                    </button>
                  )}
                  {state === 'locked' && <p className="locked-note">上一级完成后解锁</p>}
                  {state === 'done' && <p className="done-note">✓ 已完成，已记入审计留痕</p>}
                </div>
              )}
            </li>
          )
        })}
      </ol>

      {allDone && (
        <p className="ladder-done">
          🎉 你已走完整条阶梯。真实产品中，若在任一级谈成，即可停止并归档案卷。
        </p>
      )}
    </div>
  )
}
