import type { Scenario } from '../types';
import { summarize, VERDICT_META } from '../logic/verdict';

export function ScenarioList({
  scenarios,
  selectedId,
  onSelect,
}: {
  scenarios: Scenario[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <nav className="scenarios">
      <div className="scenarios-title">重跑场景（mock）</div>
      {scenarios.map((sc) => {
        const s = summarize(sc);
        const meta = VERDICT_META[s.verdict];
        const active = sc.id === selectedId;
        return (
          <button
            key={sc.id}
            className={`scenario ${active ? 'scenario-active' : ''}`}
            onClick={() => onSelect(sc.id)}
          >
            <div className="scenario-top">
              <span className="scenario-task">{sc.task}</span>
              <span className={`vdot vdot-${meta.tone}`} />
            </div>
            <div className="scenario-tag">{sc.tagline}</div>
            <div className={`scenario-verdict vt-${meta.tone}`}>
              {s.verdict}
              {s.regressions > 0 && <span className="scenario-reg"> · {s.regressions} 回归</span>}
            </div>
          </button>
        );
      })}
    </nav>
  );
}
