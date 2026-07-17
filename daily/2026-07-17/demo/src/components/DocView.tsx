import type { ClaimComputed, FreshnessResult, TimelineEvent } from '../types';
import { FreshnessGauge, KindTag, splitTemplate, StatusBadge } from './shared';

interface Props {
  result: FreshnessResult;
  viewPos: number;
  maxPos: number;
  onSetViewPos: (p: number) => void;
  playing: boolean;
  onPlay: () => void;
  events: TimelineEvent[];
  baselineDate: string;
  today: string;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  overrides: Record<string, string>;
}

function Sentence({
  c,
  selected,
  onSelect,
  override,
}: {
  c: ClaimComputed;
  selected: boolean;
  onSelect: () => void;
  override?: string;
}) {
  const cls = `sentence sentence-${c.status}${selected ? ' sentence-selected' : ''}`;
  if (override) {
    return (
      <span className={cls} onClick={onSelect} title="点击查看这句话绑定的来源">
        <mark className="val val-fresh">{override}</mark>
      </span>
    );
  }
  const [pre, val, post] = splitTemplate(c.claim.template, c.assertedValue);
  return (
    <span className={cls} onClick={onSelect} title="点击查看这句话绑定的来源">
      {pre}
      <mark className={`val val-${c.status}`}>{val}</mark>
      {post}
    </span>
  );
}

function SidePanel({ c, onClose, override }: { c: ClaimComputed; onClose: () => void; override?: string }) {
  return (
    <aside className="sidepanel">
      <div className="sidepanel-head">
        <span>论断 · 来源绑定</span>
        <button className="link" onClick={onClose}>
          关闭
        </button>
      </div>
      <p className="sp-sentence">「{override ?? c.assertedText}」</p>
      <div className="sp-row">
        <span className="sp-k">状态</span>
        <StatusBadge status={c.status} />
      </div>
      <div className="sp-row">
        <span className="sp-k">绑定来源</span>
        <span className="sp-v">
          <KindTag kind={c.source.kind} /> {c.source.name}
        </span>
      </div>
      <div className="sp-versions">
        <div className="sp-k">来源版本历史</div>
        {c.source.versions.map((v, i) => {
          const isAsserted = i === c.assertedVersionIndex;
          const isCurrent = i === c.currentVersionIndex;
          return (
            <div key={i} className={`ver${isCurrent ? ' ver-current' : ''}`}>
              <div className="ver-top">
                <span className="ver-label">{v.label}</span>
                <span className="ver-date">{v.date}</span>
                {isAsserted && <span className="tag tag-doc">文档依据</span>}
                {isCurrent && <span className="tag tag-cur">来源现值</span>}
              </div>
              {v.note && <div className="ver-note">{v.note}</div>}
            </div>
          );
        })}
      </div>
      {c.status === 'stale' && (
        <div className="sp-suggest">
          <div className="sp-k">常青建议（可自动修复）</div>
          <div className="suggest-new">→ {c.currentText}</div>
          <div className="suggest-why">
            因来源「{c.source.name}」已从 <b>{c.assertedValue}</b> 变为 <b>{c.currentValue}</b>。前往「补丁」采纳。
          </div>
        </div>
      )}
      {c.status === 'manual' && (
        <div className="sp-suggest manual">
          <div className="sp-k">需人判断</div>
          <div className="suggest-why">
            来源「{c.source.name}」从「{c.assertedValue}」改为「{c.currentValue}」，含义模糊，
            常青不自动改写，须由你在「补丁」里拍板。
          </div>
        </div>
      )}
    </aside>
  );
}

export default function DocView({
  result,
  viewPos,
  maxPos,
  onSetViewPos,
  playing,
  onPlay,
  events,
  baselineDate,
  today,
  selectedId,
  onSelect,
  overrides,
}: Props) {
  const isToday = viewPos >= maxPos;
  const viewDate = viewPos === 0 ? baselineDate : viewPos >= maxPos ? today : events[viewPos - 1].date;
  const lastEvent = viewPos > 0 && viewPos <= events.length ? events[viewPos - 1] : null;

  // 按小节分组，保持原始顺序
  const sections: { title: string; items: ClaimComputed[] }[] = [];
  result.computed.forEach((c) => {
    let s = sections.find((x) => x.title === c.claim.section);
    if (!s) {
      s = { title: c.claim.section, items: [] };
      sections.push(s);
    }
    s.items.push(c);
  });

  const selected = result.computed.find((c) => c.claim.id === selectedId) ?? null;

  return (
    <div className="docview">
      <div className="doc-main">
        <div className="replay-bar">
          <div className="replay-left">
            <button className="btn btn-play" onClick={onPlay} disabled={playing}>
              {playing ? '回放中…' : '▶ 回放这 30 天'}
            </button>
            <input
              type="range"
              min={0}
              max={maxPos}
              value={viewPos}
              onChange={(e) => onSetViewPos(Number(e.target.value))}
              className="replay-range"
            />
            <div className="replay-caption">
              <b>{viewDate}</b>
              {viewPos === 0 && ' · 基线（文档刚写好，一切吻合）'}
              {isToday && ' · 今天（30 天没人核对来源）'}
              {!isToday && viewPos > 0 && lastEvent && ` · 刚发生：${lastEvent.headline}`}
            </div>
          </div>
          <div className="replay-right">
            <span className="rr-k">此刻鲜度</span>
            <span
              className={`rr-score ${result.score >= 90 ? 'ok' : result.score >= 70 ? 'warn' : 'bad'}`}
            >
              {result.score}%
            </span>
            {!isToday && (
              <button className="link" onClick={() => onSetViewPos(maxPos)}>
                回到今天
              </button>
            )}
          </div>
        </div>

        <article className="sop">
          <header className="sop-head">
            <h2>客服退款处理 SOP</h2>
            <span className="sop-meta">内部文档 · 一线客服每日引用 · 常青持续守护中</span>
          </header>
          {sections.map((s) => (
            <section key={s.title} className="sop-section">
              <h3>{s.title}</h3>
              <ol>
                {s.items.map((c) => (
                  <li key={c.claim.id}>
                    <Sentence
                      c={c}
                      selected={c.claim.id === selectedId}
                      onSelect={() => onSelect(c.claim.id === selectedId ? null : c.claim.id)}
                      override={overrides[c.claim.id]}
                    />
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </article>
      </div>

      <div className="doc-aside">
        {selected ? (
          <SidePanel c={selected} onClose={() => onSelect(null)} override={overrides[selected.claim.id]} />
        ) : (
          <div className="doc-summary">
            <FreshnessGauge score={result.score} />
            <div className="summary-text">
              <div className="summary-title">文档鲜度</div>
              <div className="summary-sub">
                {result.loadBearingFresh}/{result.loadBearingTotal} 条承重论断仍与来源一致
              </div>
              <div className="summary-legend">
                <span>
                  <i className="dot dot-stale" />
                  已腐 {result.stale.length}
                </span>
                <span>
                  <i className="dot dot-manual" />
                  需人判断 {result.manual.length}
                </span>
              </div>
              <p className="summary-hint">
                点击文中任意高亮句，查看它绑定的来源与版本历史；或点「回放这 30 天」，
                亲眼看它如何在无人察觉中变腐。
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
