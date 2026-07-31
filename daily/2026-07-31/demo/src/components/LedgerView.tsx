import { useState } from 'react';
import type { Memory } from '../types';
import { computeTrust } from '../logic/trust';
import { TRUST_THRESHOLD } from '../data/memories';
import { TrustRing } from './shared';

interface Props {
  memories: Memory[];
  lastChange: string | null;
  onRetireToggle: (id: string) => void;
  onPinToggle: (id: string) => void;
  onReconfirm: (id: string) => void;
  onResolveConflict: (id: string) => void;
  onOpenMemory: (id: string) => void;
}

type Filter = 'all' | 'stale' | 'conflict' | 'lowtrust' | 'pinned';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'lowtrust', label: '低信任' },
  { key: 'stale', label: '过期/偏旧' },
  { key: 'conflict', label: '有矛盾' },
  { key: 'pinned', label: '已 pin' },
];

export default function LedgerView({
  memories,
  lastChange,
  onRetireToggle,
  onPinToggle,
  onReconfirm,
  onResolveConflict,
  onOpenMemory,
}: Props) {
  const [filter, setFilter] = useState<Filter>('all');

  const rows = memories
    .map((m) => ({ m, b: computeTrust(m, memories) }))
    .filter(({ m, b }) => {
      if (filter === 'all') return true;
      if (filter === 'pinned') return m.pinned;
      if (m.retired) return false;
      if (filter === 'stale') return b.freshness < 0.6;
      if (filter === 'conflict') return b.activeConflictIds.length > 0;
      if (filter === 'lowtrust') return b.score < TRUST_THRESHOLD;
      return true;
    })
    .sort((a, b) => a.b.score - b.b.score);

  return (
    <div className="panel">
      <h2>② 记忆账本 · 对账台</h2>
      <p className="desc">
        对记忆做持续的"对账与遗忘"：退役过期的、解决矛盾、pin 住耐久真相、给旧记忆再确认。每个操作都
        <b>即时重算 trust</b>，并回写「信任闸」的结论——试试对 m1 点「解决矛盾」，再回到 tab ①。
      </p>

      {lastChange && <div className="banner">{lastChange}</div>}

      <div className="filters">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            className={`chip${filter === f.key ? ' active' : ''}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {rows.length === 0 && <p className="small">该筛选下暂无记忆。</p>}

      {rows.map(({ m, b }) => (
        <div key={m.id} className={`row${m.retired ? ' retired' : ''}`}>
          <TrustRing score={b.score} />
          <div>
            <div className="stmt" onClick={() => onOpenMemory(m.id)} style={{ cursor: 'pointer' }}>
              <span className="mem-id">{m.id}</span>
              {m.statement}
            </div>
            <div className="meta">
              {m.category === 'durable' ? '耐久' : '易变'} · {b.ageDays}天未确认 · {m.confirmations}×
              确认 · {m.sources.length} 个来源
              {b.activeConflictIds.length > 0 && ` · 与 ${b.activeConflictIds.join('/')} 矛盾`}
              {m.pinned && ' · 已 pin'}
              {m.retired && ' · 已退役'}
            </div>
          </div>
          <div className="actions">
            {b.activeConflictIds.length > 0 && !m.retired && (
              <button className="btn primary" onClick={() => onResolveConflict(m.id)}>
                解决矛盾
              </button>
            )}
            <button className="btn" onClick={() => onReconfirm(m.id)} disabled={m.retired}>
              再确认
            </button>
            <button className="btn" onClick={() => onPinToggle(m.id)} disabled={m.retired}>
              {m.pinned ? '取消 pin' : 'pin'}
            </button>
            <button className="btn" onClick={() => onRetireToggle(m.id)}>
              {m.retired ? '恢复' : '退役'}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
