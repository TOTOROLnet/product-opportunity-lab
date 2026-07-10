import type { Scenario } from '../types';

export function ScenarioSwitcher({
  scenarios,
  activeId,
  onSelect,
}: {
  scenarios: Scenario[];
  activeId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="scenario-switcher" role="tablist" aria-label="场景">
      {scenarios.map((s) => (
        <button
          key={s.id}
          role="tab"
          aria-selected={s.id === activeId}
          className={`scenario-btn ${s.id === activeId ? 'active' : ''}`}
          onClick={() => onSelect(s.id)}
        >
          {s.tab}
        </button>
      ))}
    </div>
  );
}
