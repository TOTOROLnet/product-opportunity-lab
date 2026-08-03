import { useState } from 'react';
import type { Autonomy, Situation } from '../types';
import { AUTONOMY_LABEL, SITUATIONS, TOPIC_ICON, TOPIC_LABEL } from '../data/situations';
import { AUTONOMY_COLOR, AutonomyPill, cx, StakesBadge } from './shared';

const LEVELS: Autonomy[] = ['handle', 'draft', 'ask', 'never'];
const LEVEL_HINT: Record<Autonomy, string> = {
  handle: '它直接做，不打扰你',
  draft: '它拟好，等你点头',
  ask: '这类事先回来问你',
  never: '这事它绝不能碰（红线）',
};

interface Props {
  decidedLevel: Record<string, Autonomy>;
  voice: Record<string, boolean>;
  onDecide: (situation: Situation, level: Autonomy) => void;
  onVoice: (situationId: string, soundsLikeMe: boolean) => void;
  onGoProfile: () => void;
}

export default function RehearsalView({ decidedLevel, voice, onDecide, onVoice, onGoProfile }: Props) {
  const [idx, setIdx] = useState(0);
  const s = SITUATIONS[idx];
  const decidedCount = Object.keys(decidedLevel).length;
  const allDone = decidedCount === SITUATIONS.length;

  const chosen = decidedLevel[s.id];
  const v = voice[s.id];

  function decide(level: Autonomy) {
    onDecide(s, level);
    // 自动前进到下一张未决定的卡；都决定了则停在当前。
    const next = SITUATIONS.findIndex((x, i) => i > idx && decidedLevel[x.id] === undefined);
    if (next !== -1) setIdx(next);
    else if (idx < SITUATIONS.length - 1) setIdx(idx + 1);
  }

  return (
    <div className="view">
      <div className="view-head">
        <div>
          <h2>彩排台 · 上岗前，先教它你的分寸</h2>
          <p className="muted">
            逐张翻真实情境卡：看代表<b>打算怎么做</b>，你四选一拍板，右侧的「分寸画像」随手长出来。它现在<b>不打任何真实电话、不发任何真实消息</b>。
          </p>
        </div>
        <div className="progress-wrap">
          <div className="progress-num">
            {decidedCount}/{SITUATIONS.length}
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: (decidedCount / SITUATIONS.length) * 100 + '%' }} />
          </div>
        </div>
      </div>

      <div className="rehearsal-grid">
        <div className="card situation-card">
          <div className="sit-top">
            <span className="sit-topic">
              {TOPIC_ICON[s.topic]} {TOPIC_LABEL[s.topic]}
            </span>
            <StakesBadge stakes={s.stakes} />
            <span className="sit-counter">
              第 {idx + 1} / {SITUATIONS.length} 张
            </span>
          </div>

          <h3 className="sit-title">{s.title}</h3>
          <p className="sit-context">{s.context}</p>

          <div className="proposed">
            <div className="proposed-label">代表打算</div>
            <div className="proposed-action">{s.proposedAction}</div>
            <div className="voice-sample">
              <span className="quote">它拟好要以你名义发出的一句话：</span>
              <em>{s.voiceSample}</em>
            </div>
            <div className="voice-toggle">
              <span>像不像你说的话？</span>
              <button className={cx('vbtn', v === true && 'vbtn-on')} onClick={() => onVoice(s.id, true)}>
                👍 像我
              </button>
              <button className={cx('vbtn', v === false && 'vbtn-warn')} onClick={() => onVoice(s.id, false)}>
                ✋ 不像我
              </button>
              {v === false && <span className="tone-hint">✎ {s.toneFixHint}</span>}
            </div>
          </div>

          <div className="decide-label">你希望代表怎么处理这类事？</div>
          <div className="decide-row">
            {LEVELS.map((lv) => (
              <button
                key={lv}
                className={cx('decide-btn', chosen === lv && 'decide-on')}
                style={chosen === lv ? { borderColor: AUTONOMY_COLOR[lv], background: AUTONOMY_COLOR[lv] + '1f' } : undefined}
                onClick={() => decide(lv)}
              >
                <span className="decide-dot" style={{ background: AUTONOMY_COLOR[lv] }} />
                <b>{AUTONOMY_LABEL[lv]}</b>
                <small>{LEVEL_HINT[lv]}</small>
              </button>
            ))}
          </div>

          <div className="nav-row">
            <button className="ghost" disabled={idx === 0} onClick={() => setIdx(idx - 1)}>
              ← 上一张
            </button>
            {allDone ? (
              <button className="cta" onClick={onGoProfile}>
                看我的分寸画像 →
              </button>
            ) : (
              <button className="ghost" disabled={idx === SITUATIONS.length - 1} onClick={() => setIdx(idx + 1)}>
                跳过 / 下一张 →
              </button>
            )}
          </div>
        </div>

        <div className="card snapshot-card">
          <h4>实时分寸快照</h4>
          <p className="muted small">你拍的板会立刻写进画像。未拍的先用一个"偏放手"的默认起点。</p>
          <ul className="snapshot-list">
            {SITUATIONS.map((it) => {
              const lv = decidedLevel[it.id];
              return (
                <li key={it.id} className={cx(it.id === s.id && 'snap-current')}>
                  <span className="snap-topic">
                    {TOPIC_ICON[it.topic]} {TOPIC_LABEL[it.topic]}
                  </span>
                  {lv ? <AutonomyPill level={lv} /> : <span className="snap-todo">待拍板</span>}
                </li>
              );
            })}
          </ul>
          {allDone && <div className="snap-done">✓ 全部拍完，去看画像与一周回放</div>}
        </div>
      </div>
    </div>
  );
}
