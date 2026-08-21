import { useEffect, useMemo, useRef, useState } from 'react';
import type { Trajectory, RunResult, RunStep } from '../types';
import { runTrajectory } from '../engine';
import { Card, Stat } from './ui';
import { fmtTokens } from '../labels';

function RunColumn({
  title,
  subtitle,
  run,
  cursor,
  accent,
}: {
  title: string;
  subtitle: string;
  run: RunResult;
  cursor: number;
  accent: 'plain' | 'pinned';
}) {
  const visible = run.timeline.filter((t) => t.step <= cursor || t.kind === 'goal');
  const done = cursor >= 900;
  return (
    <div className={`runcol runcol--${accent}`}>
      <div className="runcol__head">
        <div className="runcol__title">{title}</div>
        <div className="runcol__sub">{subtitle}</div>
        <div className={`runcol__verdict runcol__verdict--${done ? (run.outcome === 'PASS' ? 'pass' : 'fail') : 'pending'}`}>
          {done ? (run.outcome === 'PASS' ? '✅ PASS' : '❌ FAIL') : '运行中…'}
        </div>
      </div>
      <ol className="runcol__list">
        {visible.map((t: RunStep, i) => (
          <li key={`${t.step}-${i}`} className={`runstep runstep--${t.tone} runstep--${t.kind}`}>
            <span className="runstep__step">{t.kind === 'result' ? '⇢' : t.step}</span>
            <span className="runstep__body">
              <span className="runstep__title">{t.title}</span>
              {t.detail ? <span className="runstep__detail">{t.detail}</span> : null}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function Replay({ traj, pinnedList }: { traj: Trajectory; pinnedList: string[] }) {
  const runDefault = useMemo(() => runTrajectory(traj, []), [traj]);
  const runPinned = useMemo(() => runTrajectory(traj, pinnedList), [traj, pinnedList]);

  // cursor 从 0 走到 totalSteps，末尾用 999 表示「已结算」
  const END = 999;
  const [cursor, setCursor] = useState<number>(END);
  const [playing, setPlaying] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (!playing) return;
    timer.current = window.setInterval(() => {
      setCursor((c) => {
        const next = c >= traj.totalSteps ? END : c + 1;
        if (next === END) {
          setPlaying(false);
        }
        return next;
      });
    }, 240);
    return () => {
      if (timer.current) window.clearInterval(timer.current);
    };
  }, [playing, traj.totalSteps]);

  function play() {
    setCursor(0);
    setPlaying(true);
  }
  function skip() {
    setPlaying(false);
    setCursor(END);
  }

  const avoidedRework = runDefault.tokensWasted - runPinned.tokensWasted; // 带清单避免的返工
  const pinnedCount = pinnedList.filter((id) => traj.items.find((i) => i.id === id)?.pinnable).length;

  return (
    <div className="replay">
      <Card className="replay__intro">
        <h3 className="card__h">回放对比 · 同一条轨迹，两种压缩策略</h3>
        <p className="muted sm">
          左：<b>厂商默认压缩</b>（无保命清单）。右：<b>带你的保命清单</b>
          （当前钉住 {pinnedCount} 条）。点「▶ 播放」逐步回放，看跑偏在哪一步引爆、最终结局是否翻转。
        </p>
        <div className="replay__controls">
          <button className="btn btn--primary btn--sm" onClick={play} disabled={playing}>
            ▶ 播放回放
          </button>
          <button className="btn btn--sm btn--ghost" onClick={skip}>
            跳到结果
          </button>
          {pinnedCount === 0 ? (
            <span className="replay__warn">提示：右侧尚未钉任何条目，去「折叠台」钉住风险项后再回放，结局会翻转。</span>
          ) : null}
        </div>
      </Card>

      <div className="replay__cols">
        <RunColumn
          title="默认压缩策略"
          subtitle="为省 token 静默丢弃 → 埋雷"
          run={runDefault}
          cursor={cursor}
          accent="plain"
        />
        <RunColumn
          title="带保命清单"
          subtitle={pinnedCount ? `钉住 ${pinnedCount} 条关键项` : '（当前未钉任何条目）'}
          run={runPinned}
          cursor={cursor}
          accent="pinned"
        />
      </div>

      <Card className="replay__scoreboard">
        <h3 className="card__h">价值账单（结算）</h3>
        <div className="scoregrid">
          <div className="scoregrid__group">
            <div className="scoregrid__gh">默认压缩</div>
            <div className="scoregrid__row">
              <Stat label="压缩省下" value={`${fmtTokens(runDefault.tokensSaved)}`} sub="token" tone="neutral" />
              <Stat label="跑偏返工" value={`-${fmtTokens(runDefault.tokensWasted)}`} sub="token" tone="bad" />
              <Stat
                label="净收益"
                value={`${runDefault.netTokens >= 0 ? '+' : ''}${fmtTokens(runDefault.netTokens)}`}
                sub="token"
                tone={runDefault.netTokens >= 0 ? 'good' : 'bad'}
              />
              <Stat
                label="结局"
                value={runDefault.outcome === 'PASS' ? '✅ 通过' : '❌ 失败'}
                sub={`致命 ${runDefault.fatalCount} · 返工 ${runDefault.reworkCount}`}
                tone={runDefault.outcome === 'PASS' ? 'good' : 'bad'}
              />
            </div>
          </div>

          <div className="scoregrid__group">
            <div className="scoregrid__gh">带保命清单</div>
            <div className="scoregrid__row">
              <Stat label="压缩省下" value={`${fmtTokens(runPinned.tokensSaved)}`} sub="token" tone="neutral" />
              <Stat label="跑偏返工" value={`-${fmtTokens(runPinned.tokensWasted)}`} sub="token" tone={runPinned.tokensWasted ? 'bad' : 'good'} />
              <Stat
                label="净收益"
                value={`${runPinned.netTokens >= 0 ? '+' : ''}${fmtTokens(runPinned.netTokens)}`}
                sub="token"
                tone={runPinned.netTokens >= 0 ? 'good' : 'bad'}
              />
              <Stat
                label="结局"
                value={runPinned.outcome === 'PASS' ? '✅ 通过' : '❌ 失败'}
                sub={`致命 ${runPinned.fatalCount} · 返工 ${runPinned.reworkCount}`}
                tone={runPinned.outcome === 'PASS' ? 'good' : 'bad'}
              />
            </div>
          </div>
        </div>

        <div className={`replay__punch ${runPinned.outcome === 'PASS' && runDefault.outcome === 'FAIL' ? 'replay__punch--win' : ''}`}>
          {runPinned.outcome === 'PASS' && runDefault.outcome === 'FAIL' ? (
            <>
              留痕的增量：默认压缩为省 <b>{fmtTokens(runDefault.tokensSaved)}</b> token 触发了{' '}
              <b>{fmtTokens(runDefault.tokensWasted)}</b> token 的返工并<b>直接失败</b>；带保命清单只少省{' '}
              <b>{fmtTokens(runDefault.tokensSaved - runPinned.tokensSaved)}</b> token，却<b>避免了整段返工、一次通过</b>。
              这就是把「压缩」从黑盒变成可控的价值。
            </>
          ) : pinnedCount === 0 ? (
            <>去「折叠台」把高危丢弃项（🔒 硬约束 / 🧭 已定方案 / 🩹 踩坑经验）钉入保命清单，再回来回放，结局会从 ❌ 翻成 ✅。</>
          ) : (
            <>
              当前保命清单已避免 <b>{fmtTokens(avoidedRework)}</b> token 的返工
              {runPinned.outcome === 'FAIL' ? '，但仍有高危项未钉住、任务仍会失败——把剩余风险项都钉住即可完全消除跑偏。' : '。'}
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
