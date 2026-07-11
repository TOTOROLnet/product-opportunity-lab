import type { ScenarioSummary } from '../logic/rootline';

interface TruthMeterProps {
  summary: ScenarioSummary;
}

export function TruthMeter({ summary }: TruthMeterProps) {
  const tone = summary.safeToAct ? 'ok' : summary.actionRisk > 0 ? 'bad' : 'warn';
  return (
    <div className={`truth-meter tone-${tone}`}>
      <div className="tm-stats">
        <div className="tm-stat">
          <span className="tm-num ok">{summary.intact}</span>
          <span className="tm-cap">存续</span>
        </div>
        <div className="tm-stat">
          <span className="tm-num warn">{summary.degraded}</span>
          <span className="tm-cap">失真</span>
        </div>
        <div className="tm-stat">
          <span className="tm-num bad">{summary.broken}</span>
          <span className="tm-cap">断链</span>
        </div>
        <div className="tm-divider" aria-hidden="true" />
        <div className="tm-stat">
          <span className="tm-num">{summary.droppedFactCount}</span>
          <span className="tm-cap">被压缩丢弃事实</span>
        </div>
        <div className="tm-stat">
          <span className={`tm-num${summary.actionRisk > 0 ? ' bad' : ''}`}>
            {summary.actionRisk}
          </span>
          <span className="tm-cap">影响执行</span>
        </div>
      </div>
      <div className={`tm-verdict tone-${tone}`}>
        <span className="tm-badge">
          {summary.safeToAct ? '✓ 可采用' : summary.actionRisk > 0 ? '⛔ 勿直接执行' : '⚠ 引用前复核'}
        </span>
        <span className="tm-verdict-text">{summary.verdict}</span>
      </div>
    </div>
  );
}
