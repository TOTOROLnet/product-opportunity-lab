import type { BlockKind, ContextBlock } from '../types'
import { usedTokens } from '../data/scenario'

export const KIND_META: Record<BlockKind, { label: string; color: string }> = {
  system: { label: '系统', color: '#64748b' },
  policy: { label: '策略', color: '#ef4444' },
  memory: { label: '记忆', color: '#a855f7' },
  retrieved: { label: '检索', color: '#3b82f6' },
  tool: { label: '工具', color: '#f59e0b' },
  history: { label: '对话', color: '#10b981' },
}

const fmt = (n: number) => n.toLocaleString('en-US')

function statusChip(b: ContextBlock) {
  if (b.status === 'evicted') return <span className="chip chip-evicted">已驱逐</span>
  if (b.status === 'truncated') return <span className="chip chip-truncated">已截断</span>
  return <span className="chip chip-kept">在窗口</span>
}

export default function ContextWindow({
  blocks,
  budgetTokens,
}: {
  blocks: ContextBlock[]
  budgetTokens: number
}) {
  const used = usedTokens(blocks)
  const pct = Math.min(100, Math.round((used / budgetTokens) * 100))
  const barBlocks = blocks.filter((b) => b.tokens > 0)

  const level = pct >= 95 ? 'danger' : pct >= 80 ? 'warn' : 'ok'

  return (
    <div className="ctxwin">
      <div className="ctxwin-head">
        <span className="ctxwin-title">上下文窗口 X 光</span>
        <span className={`ctxwin-usage usage-${level}`}>
          {fmt(used)} / {fmt(budgetTokens)} tokens · {pct}%
        </span>
      </div>

      <div className="stackbar" role="img" aria-label={`窗口占用 ${pct}%`}>
        {barBlocks.map((b) => (
          <div
            key={b.id}
            className="stackseg"
            title={`${b.label} · ${fmt(b.tokens)} tokens`}
            style={{ width: `${(b.tokens / budgetTokens) * 100}%`, background: KIND_META[b.kind].color }}
          />
        ))}
      </div>

      <ul className="blocklist">
        {blocks.map((b) => (
          <li key={b.id} className={`blockrow status-${b.status}`}>
            <span className="dot" style={{ background: KIND_META[b.kind].color }} />
            <span className="blocktag">{KIND_META[b.kind].label}</span>
            <span className="blocklabel">
              {b.pinned && <span className="pin" title="已 Pin，永不驱逐">📌</span>}
              {b.critical && <span className="crit" title="关键块">★</span>}
              {b.label}
              {b.reason && <span className="blockreason">— {b.reason}</span>}
            </span>
            <span className="blocktokens">
              {b.status === 'evicted' && b.fullTokens ? (
                <s>{fmt(b.fullTokens)}</s>
              ) : b.status === 'truncated' && b.fullTokens ? (
                <>
                  <s>{fmt(b.fullTokens)}</s> → {fmt(b.tokens)}
                </>
              ) : (
                fmt(b.tokens)
              )}
            </span>
            {statusChip(b)}
          </li>
        ))}
      </ul>
    </div>
  )
}
