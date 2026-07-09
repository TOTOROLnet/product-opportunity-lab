import { useState } from 'react'
import type { Scenario, ThoughtType } from '../types'
import { type ClarityResult, clarityToText, plainTranscript } from '../logic/clarity'
import { TYPE_META } from '../logic/labels'

interface Props {
  scenario: Scenario
  clarity: ClarityResult
  onBack: () => void
  onReset: () => void
}

const SECTION_ORDER: ThoughtType[] = ['decision', 'open', 'action', 'context']

export function ClarityCard({ scenario, clarity, onBack, onReset }: Props) {
  const [copied, setCopied] = useState(false)
  const cardText = clarityToText(scenario, clarity)
  const before = plainTranscript(scenario)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(cardText)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }

  const totalKept =
    clarity.buckets.decision.length +
    clarity.buckets.open.length +
    clarity.buckets.action.length +
    clarity.buckets.context.length

  return (
    <section className="clarity">
      <div className="panel-head">
        <h2>3 · 你的思路卡（你亲自确认过的版本）</h2>
        <p className="muted">
          不是一段「洗漂亮的文本」，而是一张结构化、含「我改了什么主意」痕迹、你逐条点过头的卡片。
        </p>
      </div>

      <div className="card-grid">
        <article className="clarity-card">
          <header className="cc-head">
            <span className="cc-emoji">{scenario.emoji}</span>
            <h3>{scenario.title}</h3>
          </header>

          {clarity.mindChanges.length > 0 && (
            <div className="cc-section mindchange">
              <h4>⚠ 我改了什么主意（{clarity.mindChanges.length}）</h4>
              {clarity.mindChanges.map((m) => (
                <div key={m.id} className="mc-item">
                  <div className="mc-topic">关于「{m.topic}」</div>
                  <div className="mc-flow">
                    <span className="mc-from">先：{m.fromText}</span>
                    <span className="mc-to">后：{m.toText}</span>
                  </div>
                  <div className="mc-final">{m.finalText}</div>
                </div>
              ))}
            </div>
          )}

          {SECTION_ORDER.map((t) => {
            const segs = clarity.buckets[t]
            if (segs.length === 0) return null
            const meta = TYPE_META[t]
            return (
              <div key={t} className={`cc-section type-${meta.key}`}>
                <h4>
                  {meta.icon} {meta.label}（{segs.length}）
                </h4>
                <ul>
                  {segs.map((s) => (
                    <li key={s.id}>{s.text}</li>
                  ))}
                </ul>
              </div>
            )
          })}

          {totalKept === 0 && clarity.mindChanges.length === 0 && (
            <p className="muted">这张卡是空的——回上一步确认几条思路单元试试。</p>
          )}
        </article>

        <aside className="beforeafter">
          <div className="ba-block before">
            <div className="ba-label">BEFORE · 原始口述乱麻</div>
            <p className="ba-text">{before}</p>
          </div>
          <div className="ba-arrow">Untangle ↓</div>
          <div className="ba-block after">
            <div className="ba-label">AFTER · 你确认过的思路卡</div>
            <div className="ba-stats">
              <span>✅ 决定 {clarity.buckets.decision.length}</span>
              <span>❓ 待定 {clarity.buckets.open.length}</span>
              <span>▶ 行动 {clarity.buckets.action.length}</span>
              <span>⚠ 改主意 {clarity.mindChanges.length}</span>
            </div>
            <p className="ba-note">
              同样一段话，从「读完还是一团乱、不知道自己决定了啥」变成「决定 / 待定 / 行动 /
              我改了什么主意，一目了然，且每条你都点过头」。
            </p>
          </div>
        </aside>
      </div>

      <div className="board-cta">
        <button className="btn ghost" onClick={onBack}>
          ← 回去改
        </button>
        <div className="cta-right">
          <button className="btn" onClick={copy}>
            {copied ? '✓ 已复制' : '复制思路卡（Markdown）'}
          </button>
          <button className="btn primary" onClick={onReset}>
            换个场景重来
          </button>
        </div>
      </div>
    </section>
  )
}
