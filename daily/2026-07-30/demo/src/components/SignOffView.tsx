import type { HostVerbosity } from '../types';
import { PROGRAM } from '../data/program';
import type { BuiltProgram } from '../logic/engine';
import type { SegStatus } from './PlayerView';

interface Props {
  built: BuiltProgram;
  verbosity: HostVerbosity;
  statuses: SegStatus[];
  onReplay: () => void;
}

export default function SignOffView({ built, verbosity, statuses, onReplay }: Props) {
  const cleared = statuses.filter((s) => s === 'read').length;
  const skipped = statuses.filter((s) => s === 'skipped').length;
  const backlogAfter = Math.max(built.backlogBefore - cleared, 0);
  const beforePct = 100;
  const afterPct = Math.round((backlogAfter / built.backlogBefore) * 100);

  return (
    <div className="signoff">
      <div className="bars">
        <span>▮</span>
        <span>▮</span>
        <span>▮</span>
        <span>▮</span>
      </div>
      <h2>今日节目到此结束</h2>
      <p className="closing">{PROGRAM.hostClosing[verbosity]}</p>

      <div className="stat-grid">
        <div className="stat">
          <div className="n">{cleared}</div>
          <div className="l">今天清掉的积压</div>
        </div>
        <div className="stat">
          <div className="n">
            {built.backlogBefore}→{backlogAfter}
          </div>
          <div className="l">积压总数下降</div>
        </div>
        <div className="stat">
          <div className="n">{built.streakDays}</div>
          <div className="l">连续收播天数</div>
        </div>
      </div>

      <div className="backlog-viz">
        <div style={{ fontSize: 13, color: 'var(--ink-dim)', marginBottom: 4 }}>
          你的积压：从"坟场"里被请出来几条
        </div>
        <div className="lbl">
          <span>收播前</span>
          <span>{built.backlogBefore} 条</span>
        </div>
        <div className="bl-track">
          <div className="bl-fill before" style={{ width: `${beforePct}%` }} />
        </div>
        <div className="lbl">
          <span>收播后</span>
          <span>{backlogAfter} 条</span>
        </div>
        <div className="bl-track">
          <div className="bl-fill after" style={{ width: `${afterPct}%` }} />
        </div>
        {skipped > 0 && (
          <div style={{ fontSize: 12, color: 'var(--ink-faint)', marginTop: 10 }}>
            （跳过的 {skipped} 条留在积压里，明天再排给你——收播不硬逼你读完每一条。）
          </div>
        )}
      </div>

      <div className="no-next">
        —— 没有"下一条"了 ——
        <br />
        这不是 bug，是设计：一档会结束的节目，才还得了你一个"读完了"的收尾感。
      </div>

      <div className="replay">
        <button className="btn btn-ghost" onClick={onReplay}>
          ↺ 重新体验今天（Demo 用）
        </button>
        <button className="btn btn-ghost" disabled style={{ opacity: 0.5, cursor: 'default' }}>
          排明天的节目 · 明天见
        </button>
      </div>
    </div>
  );
}
