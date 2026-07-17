import type { ClaimComputed, Source, TimelineEvent } from '../types';
import { KindTag } from './shared';

interface Props {
  sources: Source[];
  computed: ClaimComputed[];
  events: TimelineEvent[];
  baselineDate: string;
  today: string;
}

export default function SourcesView({ sources, computed, events, baselineDate, today }: Props) {
  // 每个来源 -> 依赖它的论断及其当前状态
  const claimsBySource: Record<string, ClaimComputed[]> = {};
  computed.forEach((c) => {
    (claimsBySource[c.claim.sourceId] ||= []).push(c);
  });

  const changed = sources.filter((s) => s.versions.length > 1);
  const stable = sources.filter((s) => s.versions.length === 1);

  return (
    <div className="sourcesview">
      <div className="sv-timeline">
        <h3>来源变更时间线（过去 30 天）</h3>
        <p className="sv-sub">
          这些是文档所依赖的真实来源的变化。文档本身「看起来」没变——危险正在于此。
        </p>
        <ol className="timeline">
          <li className="tl-item tl-base">
            <span className="tl-date">{baselineDate}</span>
            <span className="tl-headline">SOP 基线：此时文档与所有来源完全吻合（鲜度 100%）</span>
          </li>
          {events.map((e) => {
            const affected = claimsBySource[e.sourceId] ?? [];
            const brokeCount = affected.filter((c) => c.status !== 'fresh').length;
            return (
              <li key={e.id} className="tl-item">
                <span className="tl-date">{e.date}</span>
                <span className="tl-headline">{e.headline}</span>
                {brokeCount > 0 && (
                  <span className="tl-impact">→ 令 {brokeCount} 条论断失真</span>
                )}
              </li>
            );
          })}
          <li className="tl-item tl-today">
            <span className="tl-date">{today}</span>
            <span className="tl-headline">今天：SOP 已 30 天无人核对来源</span>
          </li>
        </ol>
      </div>

      <div className="sv-tables">
        <h3>绑定的来源（{sources.length}）</h3>
        <div className="sv-group-label">已变更（触发失真）</div>
        {changed.map((s) => {
          const deps = claimsBySource[s.id] ?? [];
          const cur = s.versions[s.versions.length - 1];
          const base = s.versions[0];
          return (
            <div key={s.id} className="src-card src-changed">
              <div className="src-top">
                <KindTag kind={s.kind} />
                <span className="src-name">{s.name}</span>
              </div>
              <div className="src-change">
                <span className="src-old">{base.label}</span>
                <span className="src-arrow">→</span>
                <span className="src-new">{cur.label}</span>
              </div>
              <div className="src-deps">
                依赖它的论断：
                {deps.map((c) => (
                  <span key={c.claim.id} className={`chip chip-${c.status}`}>
                    {c.claim.section.replace(/^[一二三四五]、/, '')}
                  </span>
                ))}
              </div>
            </div>
          );
        })}

        <div className="sv-group-label">未变更（论断保持鲜）</div>
        <div className="stable-grid">
          {stable.map((s) => (
            <div key={s.id} className="src-card src-stable">
              <div className="src-top">
                <KindTag kind={s.kind} />
                <span className="src-name">{s.name}</span>
              </div>
              <div className="src-value">{s.versions[0].label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
