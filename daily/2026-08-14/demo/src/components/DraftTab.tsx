import { useEffect, useRef, useState } from 'react';
import type { Shot, DirectorNote } from '../types';
import { statusOf, effectiveShot } from '../engine';
import { ShotThumb, MetaRow, StatusPill } from './shared';

interface Props {
  shots: Shot[];
  notes: Record<string, DirectorNote>;
  applied: boolean;
  onGoDirect: () => void;
}

// 放映台：看初稿 = 一条成片的镜头序列 + 模拟逐镜放映。
// 若已应用改稿，则显示收敛后的成片，并可切回初稿对照。
export default function DraftTab({ shots, notes, applied, onGoDirect }: Props) {
  const [showFinal, setShowFinal] = useState(applied);
  const [playing, setPlaying] = useState(false);
  const [cursor, setCursor] = useState(-1);
  const timer = useRef<number | null>(null);

  useEffect(() => setShowFinal(applied), [applied]);

  const view: Shot[] = shots.map((s) =>
    showFinal ? effectiveShot(s, notes[s.id]) : s,
  );
  const totalDur = view.reduce((a, s) => a + s.durationSec, 0);

  useEffect(() => {
    if (!playing) return;
    if (cursor >= view.length - 1) {
      timer.current = window.setTimeout(() => {
        setPlaying(false);
        setCursor(-1);
      }, 900);
      return;
    }
    timer.current = window.setTimeout(() => setCursor((c) => c + 1), 950);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [playing, cursor, view.length]);

  function play() {
    setCursor(0);
    setPlaying(true);
  }

  return (
    <div className="tab">
      <div className="panel-head">
        <div>
          <h2>放映台 · {showFinal ? '改稿后成片' : '初稿'}</h2>
          <p className="muted">
            这是由 brief→成片 agent 自动产出的初稿：{view.length} 个镜头 · 共 {totalDur}s。
            「说戏」不生成视频，只坐在它之上帮你改。
          </p>
        </div>
        <div className="head-actions">
          <button className="btn ghost" onClick={play} disabled={playing}>
            {playing ? '▶ 放映中…' : '▶ 模拟放映'}
          </button>
          {applied && (
            <div className="seg">
              <button className={showFinal ? '' : 'on'} onClick={() => setShowFinal(false)}>
                初稿
              </button>
              <button className={showFinal ? 'on' : ''} onClick={() => setShowFinal(true)}>
                成片
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="brief-note">
        🎬 一句 brief：把冰箱照片变三天健身餐的 App，做条 30 秒竖屏口播广告，钩子要狠、结尾引导下载。
      </div>

      <div className="storyboard">
        {view.map((s, i) => {
          const st = statusOf(notes[s.id]);
          return (
            <div key={s.id} className={'shot-card' + (i === cursor ? ' active' : '')}>
              <ShotThumb shot={s} />
              <div className="shot-body">
                <div className="shot-top">
                  <span className="shot-label">
                    #{s.index} {s.label}
                  </span>
                  {showFinal ? <StatusPill status={st} /> : null}
                </div>
                <p className="script">{s.script}</p>
                <div className="visual muted">🎞 {s.visualNote}</div>
                <MetaRow shot={s} />
              </div>
            </div>
          );
        })}
      </div>

      {!applied && (
        <div className="cta-row">
          <span className="muted">初稿大方向对，但有几个镜头不对味？</span>
          <button className="btn primary" onClick={onGoDirect}>
            去导演台说戏 →
          </button>
        </div>
      )}
    </div>
  );
}
