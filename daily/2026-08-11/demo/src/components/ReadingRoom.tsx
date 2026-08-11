import { useEffect, useMemo, useRef, useState } from 'react';
import type { Reader, SampleData } from '../types';
import { readerTrace, replayEvents, resolveReactions } from '../logic/engine';
import { AttentionBar, KindBadge } from './shared';

interface Props {
  data: SampleData;
  readerPool: Record<string, Reader>;
  activeEditIds: string[];
}

const STEP_MS = 650;

export default function ReadingRoom({ data, readerPool, activeEditIds }: Props) {
  const { traces, events } = useMemo(() => {
    const reactions = resolveReactions(data, activeEditIds);
    const tr = data.sample.panel.map((rid) => readerTrace(data.sample, readerPool[rid], reactions));
    return { traces: tr, events: replayEvents(data.sample, tr) };
  }, [data, readerPool, activeEditIds]);

  const [cursor, setCursor] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timer = useRef<number | null>(null);

  // 换样本 / 改动“改法”时重置回放
  useEffect(() => {
    setCursor(0);
    setPlaying(false);
  }, [data, activeEditIds]);

  useEffect(() => {
    if (!playing) return;
    if (cursor >= events.length) {
      setPlaying(false);
      return;
    }
    timer.current = window.setTimeout(() => setCursor((c) => c + 1), STEP_MS);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [playing, cursor, events.length]);

  const revealed = events.slice(0, cursor);
  const finished = cursor >= events.length && cursor > 0;
  const currentEvent = cursor > 0 ? events[cursor - 1] : null;
  const currentSentenceIndex = playing && currentEvent ? currentEvent.sentenceIndex : finished ? -1 : currentEvent?.sentenceIndex ?? 0;

  // 每位读者的实时注意力/是否已离开
  const liveState: Record<string, { att: number; dropped: boolean }> = {};
  for (const rid of data.sample.panel) liveState[rid] = { att: readerPool[rid].patience, dropped: false };
  for (const ev of revealed) liveState[ev.readerId] = { att: ev.attentionAfter, dropped: ev.dropped };

  const targetTrace = traces.find((t) => t.readerId === data.sample.targetReaderId)!;

  return (
    <>
      <div className="controls">
        {!playing && cursor < events.length && (
          <button className="btn" onClick={() => setPlaying(true)}>
            {cursor === 0 ? '▶ 开始围读' : '▶ 继续'}
          </button>
        )}
        {playing && (
          <button className="btn ghost" onClick={() => setPlaying(false)}>
            ⏸ 暂停
          </button>
        )}
        <button className="btn ghost" onClick={() => { setPlaying(false); setCursor(events.length); }}>
          ⏭ 直接看结果
        </button>
        <button className="btn ghost" onClick={() => { setPlaying(false); setCursor(0); }}>
          ↺ 重播
        </button>
        <span className="progress-note">
          进度 {cursor}/{events.length} · 每位读者逐句阅读你的文字
        </span>
      </div>

      <div className="split">
        <div className="card">
          <h3>📄 你的文字（一屋子读者正在逐句读）</h3>
          <div className="reading-pane">
            {data.sample.sentences.map((s, i) => {
              const idx = i + 1;
              const isCurrent = idx === currentSentenceIndex && !finished;
              const isUpcoming = currentSentenceIndex > 0 && idx > currentSentenceIndex && !finished;
              return (
                <span
                  key={s.id}
                  className={`sentence${isCurrent ? ' current' : ''}${isUpcoming ? ' upcoming' : ''}`}
                >
                  {s.text}
                </span>
              );
            })}
          </div>

          {finished && (
            <div className={`dropoff ${targetTrace.dropIndex ? 'bad' : 'good'}`}>
              {targetTrace.dropIndex ? (
                <>
                  ✕ 你的<strong>目标读者</strong>（{readerPool[data.sample.targetReaderId].emoji}
                  {readerPool[data.sample.targetReaderId].name}）在<strong>第 {targetTrace.dropIndex} 句</strong>就读不下去、离开了——
                  后面写得再好，他也看不到了。去「接收热力图」看他到底卡在哪、为什么。
                </>
              ) : (
                <>
                  ✓ 你的<strong>目标读者</strong>（{readerPool[data.sample.targetReaderId].emoji}
                  {readerPool[data.sample.targetReaderId].name}）读到了<strong>最后一句</strong>，
                  全程注意力保持在高位。
                </>
              )}
            </div>
          )}
        </div>

        <div className="card">
          <h3>👥 读者面板（注意力实时变化）</h3>
          <div className="sub">
            共 {data.sample.panel.length} 位读者。注意力见底或踩到雷 = 弃读。
          </div>
          {data.sample.panel.map((rid) => {
            const r = readerPool[rid];
            const st = liveState[rid];
            const isTarget = rid === data.sample.targetReaderId;
            return (
              <div className="reader-row" key={rid} style={{ opacity: st.dropped ? 0.55 : 1 }}>
                <div className="reader-face">{r.emoji}</div>
                <div className="reader-meta">
                  <div className="reader-name">
                    {r.name}
                    {isTarget && <span className="target-tag">目标</span>}
                    {st.dropped && <span className="reader-dropped">· 已离开</span>}
                  </div>
                  <div className="reader-cares">在意：{r.caresAbout}</div>
                  <AttentionBar value={st.att} dropped={st.dropped} />
                </div>
                <div className="reader-att-num">{st.dropped ? '弃读' : Math.round(st.att)}</div>
              </div>
            );
          })}

          <h3 style={{ marginTop: 18 }}>💬 读者的实时反应</h3>
          <div className="feed">
            {revealed.length === 0 && (
              <div className="feed-empty">点「开始围读」，看每位读者逐句读你的文字时冒出的真实反应。</div>
            )}
            {revealed
              .slice()
              .reverse()
              .map((ev) => {
                const r = readerPool[ev.readerId];
                return (
                  <div className="feed-item" key={ev.order} style={{ borderLeftColor: `var(--k-${ev.kind})` }}>
                    <div className="feed-face">{r.emoji}</div>
                    <div className="feed-body">
                      <span className="who">
                        {r.name} · 读到第 {ev.sentenceIndex} 句 <KindBadge kind={ev.kind} />
                      </span>
                      <div>{ev.note}</div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </>
  );
}
