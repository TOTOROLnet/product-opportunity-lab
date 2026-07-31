import type { Memory } from '../types';
import { computeTrust, ageDaysOf } from '../logic/trust';
import { sourceKindLabel, TrustRing } from './shared';

interface Props {
  memories: Memory[];
  selectedId: string;
  onSelect: (id: string) => void;
}

interface TLItem {
  at: string;
  src: string;
  kind: string;
  excerpt: string;
  conflict: boolean;
}

function DecayCurve({ m }: { m: Memory }) {
  const tau = m.category === 'durable' ? 1500 : 60;
  const maxAge = m.category === 'durable' ? 1600 : 365;
  const w = 320;
  const h = 90;
  const pad = 6;
  const pts: string[] = [];
  for (let i = 0; i <= 60; i++) {
    const age = (maxAge / 60) * i;
    const y = m.pinned ? 1 : Math.exp(-age / tau);
    const px = pad + (i / 60) * (w - 2 * pad);
    const py = pad + (1 - y) * (h - 2 * pad);
    pts.push(`${px.toFixed(1)},${py.toFixed(1)}`);
  }
  const age = ageDaysOf(m.lastConfirmedAt);
  const yNow = m.pinned ? 1 : Math.exp(-Math.min(age, maxAge) / tau);
  const cx = pad + (Math.min(age, maxAge) / maxAge) * (w - 2 * pad);
  const cy = pad + (1 - yNow) * (h - 2 * pad);
  return (
    <div className="decay-curve">
      <div className="small">
        时效衰减曲线（{m.category === 'durable' ? '耐久 · 慢衰减' : '易变 · 快衰减'}
        {m.pinned ? ' · 已 pin，停止衰减' : ''}）：
      </div>
      <svg width={w} height={h} style={{ marginTop: 6 }}>
        <polyline
          points={pts.join(' ')}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={2}
          opacity={0.8}
        />
        <line x1={cx} y1={pad} x2={cx} y2={h - pad} stroke="var(--dim)" strokeDasharray="3 3" />
        <circle cx={cx} cy={cy} r={4.5} fill="var(--warn)" />
        <text x={Math.min(cx + 6, w - 60)} y={cy - 6} fill="var(--muted)" fontSize={11}>
          现在 · {age}天
        </text>
      </svg>
    </div>
  );
}

export default function ProvenanceView({ memories, selectedId, onSelect }: Props) {
  const m = memories.find((x) => x.id === selectedId) ?? memories[0];
  const b = computeTrust(m, memories);

  const items: TLItem[] = m.sources.map((s) => ({
    at: s.at,
    src: s.label,
    kind: sourceKindLabel(s.type),
    excerpt: s.excerpt,
    conflict: false,
  }));
  for (const cId of m.conflictsWith) {
    const c = memories.find((x) => x.id === cId);
    if (!c || c.retired) continue;
    const cs = c.sources[0];
    items.push({
      at: cs ? cs.at : c.lastConfirmedAt,
      src: `矛盾记忆 ${c.id}`,
      kind: '冲突',
      excerpt: `「${c.statement}」— 与本记忆冲突`,
      conflict: true,
    });
  }
  items.sort((a, z) => new Date(a.at).getTime() - new Date(z.at).getTime());

  const factors: { name: string; val: number; pen?: boolean }[] = [
    { name: '时效 freshness', val: b.freshness },
    { name: '确认 confirmation', val: b.confirmation },
    { name: '来源权威 authority', val: b.authority },
    { name: '矛盾罚 conflictPenalty', val: b.conflictPenalty, pen: true },
  ];

  return (
    <div className="panel">
      <h2>③ 溯源 · 为什么信这条记忆</h2>
      <p className="desc">
        点一条记忆，看它被提及/确认/推翻的时间线、时效衰减曲线，以及 trust
        分数的因子拆解——把"agent 为什么相信它"这件抽象的事显性化、可审计。
      </p>

      <div className="prov-pick">
        {memories.map((x) => (
          <button
            key={x.id}
            className={`chip${x.id === m.id ? ' active' : ''}`}
            onClick={() => onSelect(x.id)}
          >
            {x.id}
          </button>
        ))}
      </div>

      <div className="action-card">
        <div className="mem-top">
          <div className="mem-stmt">
            <span className="mem-id">{m.id}</span>
            {m.statement}
          </div>
          <TrustRing score={b.score} />
        </div>
        <div className="meta small" style={{ marginTop: 8 }}>
          {m.category === 'durable' ? '耐久事实' : '易变信息'} · {m.confirmations}× 确认 ·{' '}
          {b.ageDays}天未确认{m.pinned ? ' · 已 pin' : ''}
          {m.retired ? ' · 已退役（trust 归零，不参与召回）' : ''}
        </div>
      </div>

      <div className="grp-title">来源与冲突时间线</div>
      <div className="timeline">
        {items.map((it, i) => (
          <div key={i} className={`tl-item${it.conflict ? ' conflict' : ''}`}>
            <div className="tl-head">
              <span className="tl-src">{it.src}</span> · {it.kind} · {it.at}
            </div>
            <div className="tl-ex">{it.excerpt}</div>
          </div>
        ))}
      </div>

      <div className="grp-title">信任拆解</div>
      <div className="factors">
        {factors.map((f, i) => (
          <div key={i} className="factor">
            <span className="fname">{f.name}</span>
            <span className="fbar">
              <span
                className={f.pen ? 'pen' : ''}
                style={{ width: `${Math.round(f.val * 100)}%` }}
              />
            </span>
            <span className="fval">{f.val.toFixed(2)}</span>
          </div>
        ))}
      </div>

      <div className="formula">
        trust = freshness × confirmation × authority × (1 − conflictPenalty)
        <br />
        {'     '}= {b.freshness.toFixed(2)} × {b.confirmation.toFixed(2)} × {b.authority.toFixed(2)} ×
        (1 − {b.conflictPenalty.toFixed(2)}) = <b style={{ color: 'var(--text)' }}>{b.score.toFixed(2)}</b>
        {m.retired && '  → 已退役，强制归零'}
      </div>

      <DecayCurve m={m} />
    </div>
  );
}
