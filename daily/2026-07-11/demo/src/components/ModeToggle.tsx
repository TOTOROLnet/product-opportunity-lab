interface ModeToggleProps {
  lensOn: boolean;
  onToggle: (on: boolean) => void;
}

export function ModeToggle({ lensOn, onToggle }: ModeToggleProps) {
  return (
    <div className="mode-toggle" role="group" aria-label="裸答案 / 根脉透镜">
      <button
        className={`toggle-seg${!lensOn ? ' active' : ''}`}
        onClick={() => onToggle(false)}
        aria-pressed={!lensOn}
      >
        裸答案
      </button>
      <button
        className={`toggle-seg${lensOn ? ' active' : ''}`}
        onClick={() => onToggle(true)}
        aria-pressed={lensOn}
      >
        根脉透镜
      </button>
    </div>
  );
}
