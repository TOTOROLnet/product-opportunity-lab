interface ScenarioSwitcherProps {
  scenarios: { id: string; title: string }[];
  current: string;
  onSelect: (id: string) => void;
}

export function ScenarioSwitcher({ scenarios, current, onSelect }: ScenarioSwitcherProps) {
  return (
    <div className="scenario-switcher" role="tablist" aria-label="演示场景">
      <span className="switcher-label">场景</span>
      {scenarios.map((s) => (
        <button
          key={s.id}
          role="tab"
          aria-selected={s.id === current}
          className={`scenario-tab${s.id === current ? ' active' : ''}`}
          onClick={() => onSelect(s.id)}
        >
          {s.title}
        </button>
      ))}
    </div>
  );
}
