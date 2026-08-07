import type { ReconcileResult, Scenario } from '../types';

export function Overview({
  scenario,
  result,
  onNaive,
  onGated,
}: {
  scenario: Scenario;
  result: ReconcileResult;
  onNaive: () => void;
  onGated: () => void;
}) {
  const pct = Math.round((scenario.pausedAtStep / scenario.runbookTotal) * 100);
  return (
    <>
      <div className="panel">
        <div className="task-card">
          <div>
            <h2>{scenario.taskName}</h2>
            <p className="sub">
              run <code style={{ color: 'var(--brand-2)' }}>{scenario.taskId}</code> ·
              append-only 事件日志完好，可「回放级精确」还原 Agent 内部状态
            </p>
          </div>
        </div>

        <div className="task-meta" style={{ marginTop: 4 }}>
          <div>
            <div className="k">进度</div>
            <div className="v">
              {scenario.pausedAtStep} / {scenario.runbookTotal} 步
            </div>
          </div>
          <div>
            <div className="k">暂停原因</div>
            <div className="v">{scenario.pausedReason}</div>
          </div>
          <div>
            <div className="k">距今缺口</div>
            <div className="v" style={{ color: 'var(--warn)' }}>
              {scenario.gapLabel}
            </div>
          </div>
          <div>
            <div className="k">待续步骤</div>
            <div className="v">
              {scenario.pausedAtStep + 1} – {scenario.runbookTotal}
            </div>
          </div>
        </div>

        <div className="progress">
          <i style={{ width: `${pct}%` }} />
        </div>
        <div className="progress-legend">
          <span>已完成 {scenario.pausedAtStep} 步</span>
          <span>剩余 {scenario.runbookTotal - scenario.pausedAtStep} 步待续</span>
        </div>
      </div>

      <div className="panel">
        <h2>要复跑了 —— 但世界还是 18 小时前那个世界吗？</h2>
        <p className="sub">
          Muse Code 式的 append-only 回放能精确还原 <b>Agent</b>，却默认 <b>外部世界没变</b>。
          而 {scenario.gapLabel} 里，代码库、PR、config flag、CI、DB、工单都可能已经漂移。
          请选择如何续跑：
        </p>
        <div className="choices">
          <button className="choice naive" onClick={onNaive}>
            <div className="ct">① 直接按日志复跑（朴素回放）</div>
            <div className="cd">
              信任日志、原地续跑第 {scenario.pausedAtStep + 1} 步——把「世界没变」当默认前提。
            </div>
            <div className="go" style={{ color: 'var(--bad)' }}>
              看看盲目续跑会撞上什么 →
            </div>
          </button>
          <button className="choice gated" onClick={onGated}>
            <div className="ct">② 先过「归位」安检</div>
            <div className="cd">
              把 Agent 记得的世界(T0) 与 现在(T1) 逐条对齐，算漂移、给裁决，再决定该不该续。
            </div>
            <div className="go">进入世界重校 →</div>
          </button>
        </div>
      </div>

      <div className="panel" style={{ marginBottom: 0 }}>
        <h2>先给个底：这次复跑到底安不安全？</h2>
        <div className="stats" style={{ marginTop: 12, marginBottom: 0 }}>
          <div className="stat stat-good">
            <div className="stat-value">{result.counts.aligned}</div>
            <div className="stat-label">世界假设 · 一致</div>
          </div>
          <div className="stat stat-warn">
            <div className="stat-value">{result.counts.drifted}</div>
            <div className="stat-label">世界假设 · 漂移</div>
          </div>
          <div className="stat stat-bad">
            <div className="stat-value">{result.counts.invalidated}</div>
            <div className="stat-label">世界假设 · 已失效</div>
          </div>
          <div className="stat stat-bad">
            <div className="stat-value">{result.metrics.avoidedHighRisk}</div>
            <div className="stat-label">若盲目续跑的高危事故</div>
          </div>
        </div>
      </div>
    </>
  );
}
