import { useEffect, useState } from 'react'
import type { Scenario } from '../types'

interface Props {
  scenarios: Scenario[]
  selected: Scenario | null
  onChoose: (s: Scenario) => void
  onProceed: () => void
}

export function Intake({ scenarios, selected, onChoose, onProceed }: Props) {
  const [revealed, setRevealed] = useState(0)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    setRevealed(0)
    setPlaying(false)
  }, [selected?.id])

  useEffect(() => {
    if (!playing || !selected) return
    if (revealed >= selected.segments.length) {
      setPlaying(false)
      return
    }
    const t = setTimeout(() => setRevealed((r) => r + 1), 850)
    return () => clearTimeout(t)
  }, [playing, revealed, selected])

  const total = selected?.segments.length ?? 0
  const done = selected != null && revealed >= total
  const shown = selected ? selected.segments.slice(0, revealed) : []

  return (
    <section className="intake">
      <div className="panel-head">
        <h2>1 · 对着它把纠结的事说出来</h2>
        <p className="muted">
          选一个真实会遇到的纠结场景，点「开始口述」听它逐句流入——模拟低延迟听写，并按语调 /
          节奏把独白切成一个个「思路单元」（呼应 radar 里 AssemblyAI 的轮次检测）。
        </p>
      </div>

      <div className="scenario-row">
        {scenarios.map((s) => (
          <button
            key={s.id}
            className={`scenario-chip ${selected?.id === s.id ? 'chip-active' : ''}`}
            onClick={() => onChoose(s)}
          >
            <span className="chip-emoji">{s.emoji}</span>
            <span className="chip-title">{s.title}</span>
            <span className="chip-ctx">{s.context}</span>
          </button>
        ))}
      </div>

      {selected && (
        <div className="dictation">
          <div className="dictation-bar">
            <div className="rec-controls">
              {!playing && !done && (
                <button className="btn primary" onClick={() => setPlaying(true)}>
                  ▶ 开始口述
                </button>
              )}
              {playing && (
                <button className="btn" onClick={() => setRevealed(total)}>
                  ⏭ 跳过播放
                </button>
              )}
              {done && (
                <button
                  className="btn ghost"
                  onClick={() => {
                    setRevealed(0)
                    setPlaying(true)
                  }}
                >
                  ↺ 重播
                </button>
              )}
            </div>
            <div className={`live-status ${playing ? 'live' : ''}`}>
              <span className="dot" />
              {playing ? '正在听写…  延迟 ~200ms · 按语调分段' : done ? '口述结束' : '待开始'}
            </div>
          </div>

          <div className="transcript">
            {shown.length === 0 && !playing && (
              <p className="transcript-empty">点「开始口述」，这里会像真的对它说话一样逐句浮现。</p>
            )}
            {shown.map((seg, i) => (
              <div key={seg.id} className="bubble" style={{ animationDelay: `${i * 0.02}s` }}>
                <span className="bubble-idx">{i + 1}</span>
                <span className="bubble-text">{seg.text}</span>
              </div>
            ))}
            {playing && revealed < total && <div className="bubble typing">···</div>}
          </div>

          {done && (
            <div className="intake-cta">
              <div className="cta-note">
                听清了一团乱麻？下一步不是把它「洗成漂亮文本」，而是帮你看清
                <b>哪些是决定、哪些还没想清、你在哪改了主意</b>。
              </div>
              <button className="btn primary lg" onClick={onProceed}>
                整理我的思绪 →
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
