import { useMemo } from 'react';
import type { Analysis, Reader, SampleData } from '../types';
import { analyze } from '../logic/engine';

interface Props {
  data: SampleData;
  readerPool: Record<string, Reader>;
  activeEditIds: string[];
  onToggle: (id: string) => void;
}

function HeatStrip({ analysis }: { analysis: Analysis }) {
  return (
    <div className="heat-strip">
      {analysis.heatmap.map((h) => (
        <span key={h.sentenceId} className={`heat-cell bg-${h.level}`} title={`第 ${h.index} 句`} />
      ))}
    </div>
  );
}

function ScoreCol({ analysis, title, cls, target }: { analysis: Analysis; title: string; cls: string; target: Reader }) {
  const color = analysis.receptionScore >= 70 ? 'var(--k-engaged)' : analysis.receptionScore >= 45 ? 'var(--k-confused)' : 'var(--k-skeptical)';
  return (
    <div className={`ba-col ${cls}`}>
      <div className="score-label" style={{ marginTop: 0 }}>{title}</div>
      <div className="score-big" style={{ color, margin: '6px 0' }}>{analysis.receptionScore}</div>
      <div style={{ fontSize: 13, color: 'var(--ink-dim)' }}>
        {analysis.targetDropIndex
          ? `${target.name}在第 ${analysis.targetDropIndex} 句流失`
          : `${target.name}读到了最后`}
      </div>
      <HeatStrip analysis={analysis} />
    </div>
  );
}

export default function BeforeAfterTab({ data, readerPool, activeEditIds, onToggle }: Props) {
  const before = useMemo(() => analyze(data, readerPool, []), [data, readerPool]);
  const after = useMemo(() => analyze(data, readerPool, activeEditIds), [data, readerPool, activeEditIds]);
  const target = readerPool[data.sample.targetReaderId];
  const delta = after.receptionScore - before.receptionScore;

  return (
    <div className="split">
      <div className="card">
        <h3>🔧 试几种改法（改的是结构/价值，不是语法）</h3>
        <div className="sub">勾选下面的改法，右侧的接收分与流失点会实时变化。众读不替你写，只让你看见每种改法的落地效果。</div>
        {data.edits.map((e) => {
          const on = activeEditIds.includes(e.id);
          return (
            <div className={`edit-item${on ? ' on' : ''}`} key={e.id} onClick={() => onToggle(e.id)}>
              <div className="edit-check">{on ? '☑' : '☐'}</div>
              <div>
                <div className="edit-label">{e.label}</div>
                <div className="edit-rationale">{e.rationale}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="card">
        <h3>改前 → 当前</h3>
        <div className="ba-grid">
          <ScoreCol analysis={before} title="改前（原文）" cls="before" target={target} />
          <div className="ba-arrow">→</div>
          <ScoreCol analysis={after} title={activeEditIds.length ? `已应用 ${activeEditIds.length} 项改法` : '当前（未改）'} cls="after" target={target} />
        </div>
        <div className={`dropoff ${delta > 0 ? 'good' : delta < 0 ? 'bad' : ''}`} style={delta === 0 ? { background: 'var(--panel-2)', border: '1px solid var(--border)', color: 'var(--ink-dim)' } : undefined}>
          {delta > 0 && <>接收分 <strong>+{delta}</strong>：这些改法把{target.name}留住并读到了后面。注意——加分靠的是<strong>顺序、证据、行动召唤</strong>，不是把句子改得更通顺。</>}
          {delta === 0 && <>还没勾选任何改法，或改法未改变接收结果。勾选左侧看效果。</>}
          {delta < 0 && <>接收分 {delta}：这个组合反而更差了。</>}
        </div>
        <div className="scene-note" style={{ marginTop: 14 }}>
          这正是众读与写作助手的分水岭：写作助手给你「更顺的句子」，众读告诉你「换个切入角度/把价值前置/给个具体下一步」如何改变<strong>真实读者的接收</strong>。
        </div>
      </div>
    </div>
  );
}
