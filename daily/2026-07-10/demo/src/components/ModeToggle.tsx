export type Mode = 'naked' | 'pane';

export function ModeToggle({ mode, onChange }: { mode: Mode; onChange: (m: Mode) => void }) {
  return (
    <div className="mode-toggle" role="tablist" aria-label="对照模式">
      <button
        role="tab"
        aria-selected={mode === 'naked'}
        className={`mode-btn ${mode === 'naked' ? 'active naked' : ''}`}
        onClick={() => onChange('naked')}
      >
        裸生成式 UI
        <small>Monogram 式 · 无可信层</small>
      </button>
      <button
        role="tab"
        aria-selected={mode === 'pane'}
        className={`mode-btn ${mode === 'pane' ? 'active pane' : ''}`}
        onClick={() => onChange('pane')}
      >
        接入 Pane 明窗后
        <small>可溯源 · 可预检 · 可度量</small>
      </button>
    </div>
  );
}
