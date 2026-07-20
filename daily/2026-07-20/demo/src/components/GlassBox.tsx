import { useState } from 'react';
import type { Mode, RunResult } from '../types';
import { ACTIVITIES, MEMORIES } from '../data/scenario';

const memById = new Map(MEMORIES.map((m) => [m.id, m]));
const actById = new Map(ACTIVITIES.map((a) => [a.id, a]));
const decLabel: Record<string, string> = {
  SHOW: '主动提示',
  DEDUP: '去重·不扰',
  SUPPRESS_STALE: '过时·抑制',
  BUDGET: '超预算·延后',
  HOLD: '不相关·安静',
};

interface Props {
  runs: Record<Mode, RunResult>;
  mode: Mode;
  setMode: (m: Mode) => void;
}

export function GlassBox({ runs, mode, setMode }: Props) {
  const [focus, setFocus] = useState<string | null>(null); // 按记忆过滤
  const run = runs[mode];

  return (
    <div>
      <div className="bar">
        <div className="seg">
          <button className={`naive ${mode === 'naive' ? 'on' : ''}`} onClick={() => setMode('naive')}>
            朴素推送
          </button>
          <button className={`aptly ${mode === 'aptly' ? 'on' : ''}`} onClick={() => setMode('aptly')}>
            知时 Aptly
          </button>
        </div>
        <span className="clock">每个"现在"对每条候选记忆的打分与决策，全部摊开 —— 不是黑箱</span>
      </div>

      {/* 记忆过滤 chips */}
      <div className="bar" style={{ gap: 6 }}>
        <span style={{ color: 'var(--dim)', fontSize: 12.5 }}>按记忆筛选：</span>
        <button className={`btn ${focus === null ? 'primary' : ''}`} style={{ padding: '4px 10px' }} onClick={() => setFocus(null)}>
          全部
        </button>
        {MEMORIES.map((m) => (
          <button
            key={m.id}
            className={`btn ${focus === m.id ? 'primary' : ''}`}
            style={{ padding: '4px 10px' }}
            onClick={() => setFocus(focus === m.id ? null : m.id)}
          >
            {m.id}
          </button>
        ))}
      </div>

      {run.perActivity.map((ad) => {
        const act = actById.get(ad.activityId)!;
        // 只展示"有话可说"的候选：有相关度、或有非 HOLD 决策
        let rows = ad.candidates.filter((c) => c.relevance > 0 || c.decision !== 'HOLD');
        if (focus) rows = rows.filter((c) => c.memoryId === focus);
        if (focus && rows.length === 0) return null;
        return (
          <div key={ad.activityId} className="gblock">
            <div className="gh">
              <span className="gt">{act.time}</span>
              <b>{act.label}</b>
              <span className="gfire">
                {ad.surfaced.length ? (
                  <span style={{ color: 'var(--accent)' }}>▲ 推送 {ad.surfaced.join(' + ')}</span>
                ) : (
                  <span style={{ color: 'var(--dim2)' }}>· 保持安静</span>
                )}
              </span>
            </div>
            <div className="crow head">
              <span>候选记忆</span>
              <span className="num">相关度</span>
              <span className="num">综合分</span>
              <span>决策</span>
              <span>原因</span>
            </div>
            {rows.map((c) => {
              const m = memById.get(c.memoryId)!;
              return (
                <div key={c.memoryId} className="crow">
                  <span>
                    <span className={`dot ${m.importance}`} /> {c.memoryId} · {m.text.slice(0, 14)}
                    {m.text.length > 14 ? '…' : ''}
                  </span>
                  <span className="num">{c.relevance.toFixed(2)}</span>
                  <span className="num">{c.score.toFixed(2)}</span>
                  <span>
                    <span className={`tag ${c.decision}`}>{decLabel[c.decision]}</span>
                  </span>
                  <span className="creason">{c.reason}</span>
                </div>
              );
            })}
          </div>
        );
      })}

      <p className="note">
        朴素推送只有一条规则：<b>字面相关度 ≥ 低阈值就推</b>，因此会重复打扰、推过时信息、还会漏掉没有共同标签的关键项（如"改退款代码"时的
        <b> refund API 参数变更</b>）。知时用同一套相关度<b>信号</b>，但叠了四层<b>纪律</b>：阈值（够重要才说）→ 过时抑制（不传已被取代的旧信息）
        → 去重（说过不再重复）→ 打扰预算（一段时间内只说最要紧的几条），其余一律安静。
      </p>
    </div>
  );
}
