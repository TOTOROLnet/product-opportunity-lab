import { useEffect, useMemo, useState } from 'react';
import { analyzeSession } from '../logic/engine';
import { FEATURED, VIS_LABEL } from '../data/sessions';
import type { RepResult } from '../types';
import Skeleton from './Skeleton';
import { C, ConfidenceMeter, Dot, cx, verdictColor } from './shared';

type RunMode = 'idle' | 'play' | 'step';
const REP_MS = 1250;

export default function CoachView({ onGoCompare }: { onGoCompare: () => void }) {
  const S = useMemo(() => analyzeSession(FEATURED), []);
  const reps = S.reps;
  const [done, setDone] = useState(0); // 已完成（已进日志）的次数
  const [phase, setPhase] = useState(0);
  const [mode, setMode] = useState<RunMode>('idle');
  const [showStop, setShowStop] = useState(false);

  const finished = done >= reps.length;
  const running = mode !== 'idle';

  useEffect(() => {
    if (!running || finished || showStop) return;
    const cur = reps[done];
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = (t - start) / REP_MS;
      const ph = p < 0.5 ? p * 2 : (1 - p) * 2; // 0→1→0：下蹲再起立
      setPhase(Math.max(0, Math.min(1, ph)));
      if (p >= 1) {
        setPhase(0);
        setDone((d) => d + 1);
        if (cur.isStop) {
          setShowStop(true);
          setMode('idle');
        } else if (done + 1 >= reps.length || mode === 'step') {
          setMode('idle');
        }
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [running, done, showStop, finished, reps, mode]);

  function reset() {
    setMode('idle');
    setShowStop(false);
    setDone(0);
    setPhase(0);
  }
  function resumeAfterStop() {
    setShowStop(false);
    setMode('play');
  }

  // 当前展示的 rep（运行时=正在做的这一下，静止时=最后完成的一下）。
  const activeIdx = running && !finished ? done : Math.max(0, Math.min(done, reps.length) - 1);
  const active: RepResult = reps[activeIdx] ?? reps[0];
  const liveConf = running && !finished ? reps[done].confidence : active.confidence;

  const log = reps.slice(0, done);
  const counted = log.filter((r) => r.seen && !r.afterStop).length;
  const good = log.filter((r) => r.seen && !r.afterStop && r.verdict === 'good').length;
  const unseen = log.filter((r) => !r.seen).length;
  const over = log.filter((r) => r.afterStop).length;

  const skColor = active.verdict === 'unseen' ? C.unseen : active.isStop ? C.stop : verdictColor(active.verdict);

  return (
    <div className="coach-grid">
      {/* 左：手机取景 + 骨架 + 置信度 */}
      <div className="card">
        <div className="phone">
          <div className="phone-tag">端侧 · 视频不出本机</div>
          <div className="phone-counter">
            <div className="pc-main">
              <b style={{ color: C.good }}>{counted}</b>
              <span>可信计数</span>
            </div>
            <div className="pc-sub">达标 {good}｜看不清未计 {unseen}｜硬撑未计 {over}</div>
          </div>
          <Skeleton
            depth={active.input.depth}
            valgus={active.input.valgus}
            phase={running && !finished ? phase : active.seen ? 0.85 : 0}
            color={skColor}
            seen={active.seen}
            visLabel={active.seen ? undefined : VIS_LABEL[active.input.visibility]}
          />
          <div className="phone-repno">
            {finished ? '本组结束' : running ? `第 ${done + 1} 次` : done > 0 ? `已完成 ${done} 次` : '准备开练'}
          </div>
        </div>
        <ConfidenceMeter confidence={liveConf} />
        <div className="controls">
          {!finished && (
            <button className="cta" onClick={() => setMode(mode === 'play' ? 'idle' : 'play')}>
              {mode === 'play' ? '暂停' : done === 0 ? '开练' : '继续'}
            </button>
          )}
          {!finished && (
            <button className="ghost" onClick={() => setMode('step')} disabled={mode === 'play'}>
              下一次
            </button>
          )}
          <button className="ghost" onClick={reset}>
            重播
          </button>
        </div>
      </div>

      {/* 右：教练判定 + 日志 */}
      <div className="card coach-right">
        {showStop ? (
          <div className="stop-card">
            <div className="stop-title">该停了 · 第 {S.stopIdx} 次</div>
            <p>
              连续两次深度明显掉到基线的 {Math.round(0.82 * 100)}% 以下——这是<b>累了，不是进步</b>。
              再刷次数只会把「代偿的坏动作」练进肌肉记忆，还抬高受伤风险。
            </p>
            <p className="muted">
              讨好型教练会继续给你数、继续喊「加油还差几个」；<b>有数</b>选择在这里喊停。
            </p>
            <div className="controls">
              <button className="ghost" onClick={resumeAfterStop}>
                我偏要接着做（看它怎么标）
              </button>
              <button className="cta small" onClick={onGoCompare}>
                看讨好 vs 有数 →
              </button>
            </div>
          </div>
        ) : (
          <div className={cx('verdict-card', 'vc-' + (active.isStop ? 'stop' : active.verdict))}>
            <div className="vc-head">
              <Dot color={skColor} size={12} />
              <span className="vc-kind">
                {active.verdict === 'unseen' ? '看不清' : active.verdict === 'good' ? '达标' : '需要调整'}
              </span>
              <span className="vc-rep">第 {active.idx} 次</span>
            </div>
            <div className="vc-cue">{active.cue}</div>
            {active.why && <div className="vc-why">{active.why}</div>}
            {active.fixTip && <div className="vc-fix">建议：{active.fixTip}</div>}
            {active.seen && (
              <div className="vc-metrics">
                <span>深度 {Math.round(active.input.depth)}%</span>
                <span>内扣 {Math.round(active.input.valgus)}°</span>
                <span>下放 {active.input.tempo.toFixed(1)}s</span>
                <span>质量 {active.quality === null ? '-' : Math.round(active.quality)}</span>
              </div>
            )}
          </div>
        )}

        <h4 className="log-title">教练逐次记录</h4>
        <ul className="rep-log">
          {log.length === 0 && <li className="muted small">点「开练」看有数如何逐次诚实判定。</li>}
          {log.map((r) => {
            const col = r.verdict === 'unseen' ? C.unseen : r.isStop ? C.stop : verdictColor(r.verdict);
            const tag = !r.seen ? '看不清·未计' : r.afterStop ? '硬撑·未计' : r.verdict === 'good' ? '达标·计入' : '提醒·计入';
            return (
              <li key={r.idx} className={cx(r.afterStop && 'log-dim')}>
                <Dot color={col} />
                <span className="log-rep">#{r.idx}</span>
                <span className="log-cue">{r.cue}</span>
                <span className="log-tag" style={{ color: col }}>
                  {tag}
                </span>
              </li>
            );
          })}
        </ul>

        {finished && (
          <div className="done-strip">
            这一组：你做了 <b>{S.attempted}</b> 下，有数只认可信的 <b style={{ color: C.good }}>{counted}</b> 下（达标 {good}）；
            看不清 <b style={{ color: C.unseen }}>{unseen}</b> 下如实未计，第 {S.stopIdx} 次后 <b style={{ color: C.stop }}>{over}</b> 下硬撑未计。
          </div>
        )}
      </div>
    </div>
  );
}
