import type { Bundle } from '../App';
import { CAPABILITY_LABELS } from '../logic/engine';

function pct(x: number) { return `${Math.round(x * 100)}%`; }

function Chip({ n, label, other, otherLabel, good }: { n: string; label: string; other: string; otherLabel: string; good: 'good' | 'bad' | 'flat' }) {
  return (
    <div className="chip">
      <div className="cn">{n}</div>
      <div className="cl">{label}</div>
      <div className={`delta ${good}`}>{otherLabel} {other}</div>
    </div>
  );
}

export default function Radar({ cur, before, after, rectified }: { cur: Bundle; before: Bundle; after: Bundle; rectified: boolean }) {
  const otherLabel = rectified ? '正名前' : '正名后';
  const other = rectified ? before : after;

  const pairs = before.results
    .filter((r) => r.verdict === 'dangerous' && r.picked)
    .map((r) => ({
      id: r.intent.id,
      text: r.intent.text,
      harmful: r.picked!,
      correct: r.correct,
      resolved: after.results.find((x) => x.intent.id === r.intent.id)?.verdict !== 'dangerous',
    }));

  const dangerResolvedNow = rectified;

  return (
    <div>
      <div className="chips">
        <Chip n={pct(cur.summary.matchRate)} label="对号率（唯一正确）" other={pct(other.summary.matchRate)} otherLabel={otherLabel} good={rectified ? 'good' : 'bad'} />
        <Chip n={String(cur.collisions.length)} label="命名冲突（跨 server 同名）" other={String(other.collisions.length)} otherLabel={otherLabel} good={cur.collisions.length <= other.collisions.length ? (rectified ? 'good' : 'flat') : 'bad'} />
        <Chip n={String(cur.clusters.length)} label="语义重叠簇（能力域）" other={String(other.clusters.length)} otherLabel={otherLabel} good="flat" />
        <Chip n={String(cur.summary.dangerous)} label="危险近邻意图" other={String(other.summary.dangerous)} otherLabel={otherLabel} good={rectified ? 'good' : 'bad'} />
        <Chip n={String(cur.summary.blindspot)} label="盲区意图" other={String(other.summary.blindspot)} otherLabel={otherLabel} good={rectified ? 'good' : 'bad'} />
      </div>

      <p className="hint" style={{ marginTop: 12 }}>
        雷达是对聚合工具面的<b>结构性诊断</b>：命名冲突与语义重叠<b>不是错</b>——错在没有消歧层时，lazy-discovery 会在它们之间选偏。
        「语义重叠簇」是工具面固有的能力分布，正名<b>不删除合理重叠</b>，只让每个意图对上唯一正确的那个。
      </p>

      <div className="grid2">
        <div className="panel">
          <p className="section-title">命名冲突：同一个 name 出现在多个 server 上</p>
          {cur.collisions.length === 0 && <p className="hint">已全部加命名空间，无跨 server 同名冲突。</p>}
          {cur.collisions.map((c) => (
            <div key={c.name} className="collision">
              <span className="cname">{c.name}</span>
              <span className="hint"> · {c.tools.length} 个 server</span>
              <div className="servers">
                {c.tools.map((t) => <span key={t.id} className="tag">{t.server}</span>)}
              </div>
            </div>
          ))}
          {rectified && before.collisions.length > 0 && (
            <div className="collision resolved">
              <span className="hint">✔ 正名前的 {before.collisions.map((c) => c.name).join('、')} 已加 server 命名空间消解。</span>
            </div>
          )}
        </div>

        <div className="panel">
          <p className="section-title">危险近邻：误选会造成不可逆 / 生产 / 公开损害</p>
          {pairs.map((p) => (
            <div key={p.id} className="pair">
              <span className="mono tag harm">{p.harmful.server}/{p.harmful.name}</span>
              <span className="arrow">↔</span>
              <span className="mono tag right">{p.correct.server}/{p.correct.name}</span>
              {dangerResolvedNow && p.resolved && <span className="tag" style={{ color: 'var(--unique)', borderColor: 'var(--unique)' }}>已消除</span>}
            </div>
          ))}
          <p className="hint" style={{ marginTop: 8 }}>
            {dangerResolvedNow ? '正名（确认闸 / 收紧描述）后，这些危险近邻不再被误选。' : '每一对都是「一次选偏就出事」的近邻，指纹检测查不到——因为它们并没有被篡改。'}
          </p>
        </div>
      </div>

      <div className="panel" style={{ marginTop: 16 }}>
        <p className="section-title">语义重叠簇（同一能力域下多个工具）</p>
        <div className="cluster-grid">
          {cur.clusters.map((cl) => (
            <div key={cl.capability} className="cluster">
              <div className="ct">{CAPABILITY_LABELS[cl.capability] ?? cl.capability} · {cl.tools.length}</div>
              <div className="cc">{cl.tools.map((t) => t.name).join(' / ')}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
