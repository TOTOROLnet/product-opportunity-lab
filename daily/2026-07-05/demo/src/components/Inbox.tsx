import type { Scenario } from '../types';
import { computeVerdict } from '../logic/scoring';

interface Props {
  scenarios: Scenario[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export function Inbox({ scenarios, selectedId, onSelect }: Props) {
  return (
    <ul className="inbox">
      {scenarios.map((s) => {
        const v = computeVerdict(s);
        const dotClass =
          v.recommendation === 'BLOCK' ? 'dot-critical' : v.recommendation === 'REVIEW' ? 'dot-warn' : 'dot-safe';
        return (
          <li key={s.id}>
            <button
              className={s.id === selectedId ? 'inbox-card active' : 'inbox-card'}
              onClick={() => onSelect(s.id)}
            >
              <div className="inbox-card-head">
                <span className={`risk-dot ${dotClass}`} aria-hidden />
                <span className="inbox-domain">{s.domain}</span>
                <span className={`rec-tag rec-${v.recommendation.toLowerCase()}`}>{v.recommendation}</span>
              </div>
              <div className="inbox-title">{s.title}</div>
              <div className="inbox-summary">
                <span className="agent-avatar" aria-hidden>🤖</span>
                “{s.agentSummary}”
              </div>
              <div className="inbox-meta">
                <span className="claim-tag">{s.agentClaimTag}</span>
                <span className="line-count">
                  <span className="add">+{s.lineAdded}</span> <span className="del">−{s.lineRemoved}</span> 行
                </span>
                {v.critical > 0 && <span className="mini-crit">{v.critical} Critical</span>}
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
