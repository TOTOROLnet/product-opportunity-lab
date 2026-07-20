import { useEffect, useRef, useState } from 'react';
import type { Mode, RunResult } from '../types';
import { ACTIVITIES, MEMORIES } from '../data/scenario';
import { computeCriticalPairs } from '../logic/engine';

const memById = new Map(MEMORIES.map((m) => [m.id, m]));
const kindLabel: Record<string, string> = { fact: '事实', change: '变更', promise: '承诺' };
const N = ACTIVITIES.length;

interface Props {
  runs: Record<Mode, RunResult>;
  mode: Mode;
  setMode: (m: Mode) => void;
}

export function Workbench({ runs, mode, setMode }: Props) {
  const [step, setStep] = useState(4); // 默认停在 T4「改退款代码」——最能说明问题的关键时刻
  const [playing, setPlaying] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (!playing) return;
    timer.current = window.setInterval(() => {
      setStep((s) => {
        if (s >= N) {
          setPlaying(false);
          return s;
        }
        return s + 1;
      });
    }, 1100);
    return () => {
      if (timer.current) window.clearInterval(timer.current);
    };
  }, [playing]);

  const run = runs[mode];
  const curIdx = step - 1; // 当前活动索引
  const curAct = curIdx >= 0 && curIdx < N ? ACTIVITIES[curIdx] : null;
  const curDecision = curIdx >= 0 ? run.perActivity[curIdx] : null;

  // 累计已提示的记忆
  const shownSoFar = new Set<string>();
  for (let i = 0; i < step; i++) run.perActivity[i]?.surfaced.forEach((id) => shownSoFar.add(id));

  // 截至当前步的累计指标
  const pushesSoFar = run.pushes.filter((p) => ACTIVITIES.findIndex((a) => a.id === p.activityId) < step);
  const interruptions = pushesSoFar.length;
  const useful = pushesSoFar.filter((p) => p.useful).length;
  const harmful = pushesSoFar.filter((p) => p.stale).length;
  const precision = interruptions === 0 ? null : Math.round((useful / interruptions) * 100);
  const critical = computeCriticalPairs();
  const critElapsed = critical.filter((c) => ACTIVITIES.findIndex((a) => a.id === c.activityId) < step);
  const surfacedPairs = new Set<string>();
  for (let i = 0; i < step; i++)
    run.perActivity[i]?.surfaced.forEach((id) => surfacedPairs.add(`${id}@${ACTIVITIES[i].id}`));
  const critCovered = critElapsed.filter((c) => surfacedPairs.has(`${c.memoryId}@${c.activityId}`)).length;

  // 当前 tick 的推送分类
  const firedHere = curDecision ? curDecision.surfaced : [];
  const pushInfoHere = new Map(
    run.pushes
      .filter((p) => p.activityId === curAct?.id)
      .map((p) => [p.memoryId, p]),
  );
  // 当前 tick 的"克制动作"（被知时主动拦下的）
  const restraintHere =
    curDecision?.candidates.filter((c) => ['DEDUP', 'SUPPRESS_STALE', 'BUDGET'].includes(c.decision)) ?? [];

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
        <button className="btn" onClick={() => setStep(0)} disabled={step === 0}>
          ⏮ 重置
        </button>
        <button className="btn" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
          ◀ 上一步
        </button>
        <button className="btn primary" onClick={() => (step >= N ? (setStep(0), setPlaying(true)) : setPlaying((p) => !p))}>
          {playing ? '⏸ 暂停' : '▶ 播放'}
        </button>
        <button className="btn" onClick={() => setStep((s) => Math.min(N, s + 1))} disabled={step >= N}>
          下一步 ▶
        </button>
        <span className="clock">
          {curAct ? (
            <>
              <b>{curAct.time}</b> · 第 {step}/{N} 步
            </>
          ) : (
            <>一天尚未开始 · 0/{N}</>
          )}
        </span>
      </div>

      {/* 记忆库 */}
      <div className="card" style={{ marginBottom: 16 }}>
        <h3>环境记忆库 · 今早看过、正在被遗忘的文本（由 Rewisp 一类的记忆源提供，知时只负责"何时开口"）</h3>
        <div className="memrow">
          {MEMORIES.map((m) => {
            const live = curAct ? m.minute <= curAct.minute : false;
            const shown = shownSoFar.has(m.id);
            const stale = !!m.supersededBy;
            return (
              <div key={m.id} className={`mem ${live ? 'live' : ''} ${shown ? 'shown' : ''} ${stale ? 'stale' : ''}`}>
                <div className="mtop">
                  <span className="app">
                    <span className={`dot ${m.importance}`} /> {m.time} · {m.app}
                  </span>
                  {shown ? <span className="badge shown">已提示</span> : stale ? <span className="badge stale">过时</span> : null}
                </div>
                <div className="txt">{m.text}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid2">
        {/* 时间线 */}
        <div className="card">
          <h3>时间线 · 你此刻在做什么（now）</h3>
          <div className="tl">
            {ACTIVITIES.map((a, i) => {
              const state = i === curIdx ? 'now' : i < step ? 'past' : 'future';
              const fired = run.perActivity[i]?.surfaced ?? [];
              return (
                <div key={a.id} className={`act ${state}`}>
                  <span className="t">{a.time}</span>
                  <div style={{ flex: 1 }}>
                    <div className="lbl">{a.label}</div>
                    <div className="topics">
                      {a.topics.map((t) => (
                        <span key={t} className="tp">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                  {i < step && (
                    <span className={`fire ${fired.length ? '' : 'silent'}`}>
                      {fired.length ? `▲ ${fired.join(' + ')}` : '· 保持安静'}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 当前判断 + 指标 */}
        <div className="card">
          <h3>
            此刻 {mode === 'aptly' ? '知时' : '朴素推送'} 的判断
            {curAct ? ` · ${curAct.time}` : ''}
          </h3>
          <div className="nowbox">
            {!curAct && <div className="silentmsg">按「播放」或「下一步」开始这一天。</div>}
            {curAct && firedHere.length === 0 && (
              <div className="silentmsg">
                · 保持安静 ·<br />
                {mode === 'aptly'
                  ? '此刻没有"重要且当下可行动、未提示过"的记忆，不打扰你。'
                  : '此刻没有字面相关的记忆达到推送阈值。'}
              </div>
            )}
            {curAct &&
              firedHere.map((mid) => {
                const m = memById.get(mid)!;
                const info = pushInfoHere.get(mid);
                const cand = curDecision?.candidates.find((c) => c.memoryId === mid);
                const cls = info?.stale ? 'stale' : mode === 'naive' && !info?.useful ? 'warnstyle' : '';
                return (
                  <div key={mid} className={`prompt ${cls}`}>
                    <div className="ph">
                      <span>💡 {m.time} · {m.app}</span>
                      <span className="tp">{kindLabel[m.kind]}</span>
                      {info?.stale && <span className="badge stale">⚠ 已过时</span>}
                      {info?.duplicate && <span className="tp">重复</span>}
                      {mode === 'naive' && !info?.useful && !info?.stale && !info?.duplicate && (
                        <span className="tp">低价值</span>
                      )}
                    </div>
                    <div className="pt">{m.text}</div>
                    {cand && <div className="why">为什么现在推：{cand.reason}</div>}
                  </div>
                );
              })}

            {mode === 'aptly' && restraintHere.length > 0 && (
              <div className="why" style={{ borderTop: 'none', color: 'var(--accent)' }}>
                🛡 知时同时替你拦下 {restraintHere.length} 条：
                {restraintHere
                  .map((c) => `${c.memoryId}（${c.decision === 'SUPPRESS_STALE' ? '过时' : c.decision === 'DEDUP' ? '已提示过' : '超预算'}）`)
                  .join('、')}
              </div>
            )}
          </div>

          <div className="mstrip">
            <div className="metric">
              <div className="v">{interruptions}</div>
              <div className="k">累计打扰</div>
            </div>
            <div className="metric">
              <div className="v good">{useful}</div>
              <div className="k">有用命中</div>
            </div>
            <div className="metric">
              <div className={`v ${precision === null ? '' : precision >= 80 ? 'good' : precision >= 50 ? 'warn' : 'bad'}`}>
                {precision === null ? '—' : precision + '%'}
              </div>
              <div className="k">精确率</div>
            </div>
            <div className="metric">
              <div className={`v ${harmful ? 'bad' : 'good'}`}>{harmful}</div>
              <div className="k">过时误导</div>
            </div>
            <div className="metric">
              <div className="v">
                {critCovered}/{critElapsed.length}
              </div>
              <div className="k">关键覆盖</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
