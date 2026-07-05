import type { Scenario } from '../types';
import type { Verdict } from '../logic/scoring';

interface Props {
  scenario: Scenario;
  verdict: Verdict;
}

const REC_LABEL: Record<Verdict['recommendation'], string> = {
  SAFE: '可放心 merge',
  REVIEW: '建议人工复核',
  BLOCK: '不建议直接合入',
};

export function VerdictBanner({ scenario, verdict }: Props) {
  const rec = verdict.recommendation;
  return (
    <section className={`verdict verdict-${rec.toLowerCase()}`}>
      <div className="verdict-side agent-side">
        <div className="side-label">Agent 自述</div>
        <div className="side-score">{verdict.agentScore}<span className="pct">%</span></div>
        <div className="side-note">“{scenario.agentClaimTag}，改动很小 ✅”</div>
      </div>

      <div className="verdict-arrow" aria-hidden>➜</div>

      <div className="verdict-side contour-side">
        <div className="side-label">Contour 意图保真分</div>
        <div className="side-score">{verdict.contourScore}<span className="pct">%</span></div>
        <div className="score-bar">
          <div className="score-bar-fill" style={{ width: `${verdict.contourScore}%` }} />
        </div>
      </div>

      <div className="verdict-decision">
        <div className={`rec-badge rec-${rec.toLowerCase()}`}>{rec}</div>
        <div className="rec-label">{REC_LABEL[rec]}</div>
        <div className="rec-counts">
          {verdict.critical > 0 && <span className="c-crit">{verdict.critical} Critical</span>}
          {verdict.warn > 0 && <span className="c-warn">{verdict.warn} Warn</span>}
          {verdict.info > 0 && <span className="c-info">{verdict.info} Info</span>}
        </div>
        {verdict.invisibleCount > 0 && (
          <div className="invisible-note">
            其中 <b>{verdict.invisibleCount}</b> 处在行级 diff 里<b>看不见</b>
          </div>
        )}
      </div>
    </section>
  );
}
