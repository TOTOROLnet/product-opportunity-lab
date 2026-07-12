import type { Scenario } from '../types';

interface Props {
  scenarios: Scenario[];
  activeId: string;
  onSelect: (id: string) => void;
}

export default function ScenarioTabs({ scenarios, activeId, onSelect }: Props) {
  return (
    <nav className="scenario-tabs" aria-label="场景切换">
      {scenarios.map((s) => (
        <button
          key={s.id}
          className={`scenario-tab ${s.id === activeId ? 'active' : ''}`}
          onClick={() => onSelect(s.id)}
          type="button"
        >
          {s.name}
        </button>
      ))}
    </nav>
  );
}
