import { useEffect, useMemo, useState } from 'react';
import type { Reader, SampleData } from '../types';
import { analyze, KIND_LABEL } from '../logic/engine';
import { KindBadge } from './shared';

interface Props {
  data: SampleData;
  readerPool: Record<string, Reader>;
  activeEditIds: string[];
}

const LEGEND: { kind: 'engaged' | 'bored' | 'confused' | 'skeptical' | 'drop'; text: string }[] = [
  { kind: 'engaged', text: '投入' },
  { kind: 'bored', text: '走神' },
  { kind: 'confused', text: '困惑' },
  { kind: 'skeptical', text: '反感' },
  { kind: 'drop', text: '流失' },
];

export default function HeatmapTab({ data, readerPool, activeEditIds }: Props) {
  const analysis = useMemo(() => analyze(data, readerPool, activeEditIds), [data, readerPool, activeEditIds]);
  const [sel, setSel] = useState<number | null>(analysis.targetDropIndex);

  useEffect(() => {
    setSel(analysis.targetDropIndex);
  }, [data, activeEditIds, analysis.targetDropIndex]);

  const selectedHeat = sel ? analysis.heatmap[sel - 1] : null;
  const target = readerPool[data.sample.targetReaderId];

  return (
    <div className="split">
      <div className="card">
        <h3>🌡 接收热力图（点句子看谁在这儿卡住）</h3>
        <div className="sub">颜色 = 读到该句的读者里最严重的一种反应。灰色删除线 = 已无人读到。</div>
        <div className="reading-pane">
          {data.sample.sentences.map((s, i) => {
            const heat = analysis.heatmap[i];
            return (
              <span
                key={s.id}
                className={`sentence heat-${heat.level}${sel === i + 1 ? ' selected' : ''}`}
                onClick={() => setSel(i + 1)}
                title={`第 ${i + 1} 句 · ${KIND_LABEL[heat.level]}`}
              >
                {s.text}
              </span>
            );
          })}
        </div>
        <div className="legend">
          {LEGEND.map((l) => (
            <span className="item" key={l.kind}>
              <span className={`kdot bg-${l.kind}`} /> {l.text}
            </span>
          ))}
        </div>

        {selectedHeat && (
          <div style={{ marginTop: 16 }}>
            <h3>第 {selectedHeat.index} 句 · 每位读者的反应</h3>
            {selectedHeat.byReader.map((b) => {
              const r = readerPool[b.readerId];
              return (
                <div className="detail-reader" key={b.readerId}>
                  <span className="feed-face">{r.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <div className="who" style={{ marginBottom: 3 }}>
                      {r.name} {b.readerId === data.sample.targetReaderId && <span className="target-tag">目标</span>}{' '}
                      <KindBadge kind={b.kind} />
                    </div>
                    <div style={{ color: 'var(--ink-dim)' }}>{b.note}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="card">
        <h3>接收诊断</h3>
        <div className="score-wrap">
          <span className="score-big" style={{ color: analysis.receptionScore >= 70 ? 'var(--k-engaged)' : analysis.receptionScore >= 45 ? 'var(--k-confused)' : 'var(--k-skeptical)' }}>
            {analysis.receptionScore}
          </span>
          <span className="score-unit">/ 100 接收分</span>
        </div>
        <div className="score-label">目标读者读完率 × 全程注意力的综合估计（越高越可能被读完并打动）</div>

        <div className={`dropoff ${analysis.targetDropIndex ? 'bad' : 'good'}`}>
          {analysis.targetDropIndex ? (
            <>目标读者（{target.emoji}{target.name}）在<strong>第 {analysis.targetDropIndex} 句</strong>流失。</>
          ) : (
            <>目标读者（{target.emoji}{target.name}）<strong>读到了最后一句</strong>。</>
          )}
        </div>

        <h3 style={{ marginTop: 18 }}>Top 摩擦点（只指出问题，不替你改写）</h3>
        {analysis.topFrictions.length === 0 && (
          <div className="feed-empty">没有明显摩擦点——这段文字被顺利读完了。</div>
        )}
        {analysis.topFrictions.map((f, i) => (
          <div className="friction" key={f.sentenceId}>
            <div className="friction-rank">{i + 1}</div>
            <div className="friction-body">
              <div>
                第 {f.index} 句 <KindBadge kind={f.kind} />
              </div>
              <div className="friction-quote">「{data.sample.sentences[f.index - 1].text}」</div>
              <div style={{ color: 'var(--ink-dim)' }}>
                读者的心声：{f.reason}
              </div>
            </div>
          </div>
        ))}
        <div className="scene-note" style={{ marginTop: 14 }}>
          众读只告诉你「哪一句、被谁、因为什么」而<strong>不代写</strong>——改的决定权在你。想看不同改法的效果，去「改前改后」。
        </div>
      </div>
    </div>
  );
}
