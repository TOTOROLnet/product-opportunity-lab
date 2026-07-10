import type { GenElement, Scenario } from '../types';
import type { Mode } from './ModeToggle';
import { ElementBadge } from './ElementBadge';

function riskClass(el: GenElement, mode: Mode): string {
  if (mode !== 'pane') return '';
  if (el.grounding === 'guessed') return 'flag-guessed';
  if (el.grounding === 'placeholder') return 'flag-placeholder';
  return 'flag-verified';
}

export function GeneratedCard({
  scenario,
  mode,
  onInspect,
  onAction,
}: {
  scenario: Scenario;
  mode: Mode;
  onInspect: (el: GenElement) => void;
  onAction: (el: GenElement) => void;
}) {
  const pane = mode === 'pane';
  const headline = scenario.elements.find((e) => e.kind === 'metric');
  const rows = scenario.elements.filter((e) => e.kind === 'row');
  const notes = scenario.elements.filter((e) => e.kind === 'note');
  const actions = scenario.elements.filter((e) => e.kind === 'action');

  return (
    <div className={`gen-card ${pane ? 'gen-card-pane' : ''}`}>
      <div className="gen-chat">
        <div className="bubble bubble-user">{scenario.userPrompt}</div>
        <div className="bubble bubble-ai">{scenario.assistantIntro}</div>
      </div>

      <div className="gen-surface">
        <div className="gen-title">{scenario.title}</div>

        {headline && (
          <button
            type="button"
            className={`gen-headline ${riskClass(headline, mode)}`}
            onClick={() => pane && onInspect(headline)}
            disabled={!pane}
          >
            <span className="gen-headline-label">{headline.label}</span>
            <span className="gen-headline-value">{headline.value}</span>
            {pane && <ElementBadge grounding={headline.grounding} />}
          </button>
        )}

        {rows.length > 0 && (
          <div className="gen-rows">
            {rows.map((el) => (
              <button
                key={el.id}
                type="button"
                className={`gen-row ${el.highlight ? 'row-reco' : ''} ${riskClass(el, mode)}`}
                onClick={() => pane && onInspect(el)}
                disabled={!pane}
              >
                <span className="gen-row-label">
                  {el.highlight && <span className="reco-tag">推荐</span>}
                  {el.label}
                </span>
                <span className="gen-row-right">
                  <span className="gen-row-value">{el.value}</span>
                  {pane && <ElementBadge grounding={el.grounding} />}
                </span>
              </button>
            ))}
          </div>
        )}

        {notes.map((el) => (
          <button
            key={el.id}
            type="button"
            className={`gen-note ${riskClass(el, mode)}`}
            onClick={() => pane && onInspect(el)}
            disabled={!pane}
          >
            <span>{el.label}</span>
            {pane && <ElementBadge grounding={el.grounding} />}
          </button>
        ))}

        <div className="gen-actions">
          {actions.map((el) => {
            const danger = pane && (el.grounding === 'placeholder' || el.action?.risk === 'money');
            const primary = el.action?.risk !== 'safe';
            return (
              <button
                key={el.id}
                type="button"
                className={`gen-action-btn ${primary ? 'primary' : 'secondary'} ${
                  danger ? 'danger' : ''
                }`}
                onClick={() => onAction(el)}
              >
                {el.label}
                {pane && el.grounding === 'placeholder' && <span className="action-flag">占位</span>}
                {pane && el.action?.risk === 'money' && <span className="action-flag money">花钱</span>}
              </button>
            );
          })}
        </div>
      </div>

      {!pane && (
        <p className="gen-hint">
          裸模式：界面精美，一切看起来都可信——但你无法分辨哪个数字是真的、哪个按钮真的会做它说的事。
          切到「接入 Pane 明窗后」看差别。
        </p>
      )}
      {pane && (
        <p className="gen-hint">
          点任意带徽标的元素查看溯源；点动作按钮会先做明文预检。绿=已核实，黄=模型推测，灰=占位未绑定。
        </p>
      )}
    </div>
  );
}
