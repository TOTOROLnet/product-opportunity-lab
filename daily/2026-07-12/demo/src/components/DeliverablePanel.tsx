import type { Scenario, DeliverableElement } from '../types';
import { stepForElement } from '../logic/mandate';

interface Props {
  scenario: Scenario;
  lensOn: boolean;
  selectedStepId: string | null;
  onSelectStep: (id: string) => void;
}

const typeLabel: Record<string, string> = {
  brief: 'BRIEF',
  spreadsheet: 'SPREADSHEET',
  doc: 'DOC',
};

export default function DeliverablePanel({ scenario, lensOn, selectedStepId, onSelectStep }: Props) {
  const { deliverable, steps } = scenario;

  // 按分组归拢成品元素
  const groups = deliverable.elements.reduce<Record<string, DeliverableElement[]>>((acc, el) => {
    (acc[el.group] ??= []).push(el);
    return acc;
  }, {});

  return (
    <section className="deliverable-panel">
      <div className="panel-head">
        <div>
          <span className="deliverable-type">{typeLabel[deliverable.type]}</span>
          <h2>{deliverable.title}</h2>
          <p className="deliverable-sub">{deliverable.subtitle}</p>
        </div>
      </div>

      <div className="deliverable-body">
        {Object.entries(groups).map(([group, els]) => (
          <div className="deliverable-group" key={group}>
            <div className="deliverable-group-title">{group}</div>
            {els.map((el) => {
              const step = stepForElement(steps, el.sourceStepId);
              const v = step?.verdict ?? 'honored';
              const selected = selectedStepId === el.sourceStepId;
              return (
                <button
                  key={el.id}
                  type="button"
                  className={[
                    'deliverable-cell',
                    lensOn ? `lens v-${v}` : 'plain',
                    el.isAction ? 'is-action' : '',
                    selected ? 'selected' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => lensOn && onSelectStep(el.sourceStepId)}
                  disabled={!lensOn}
                  aria-pressed={selected}
                >
                  <span className="cell-label">
                    {el.isAction && <span className="action-flag">已执行</span>}
                    {el.label}
                  </span>
                  <span className="cell-value">{el.value}</span>
                  {lensOn && <span className={`cell-dot v-${v}`} aria-hidden="true" />}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {lensOn ? (
        <p className="deliverable-hint">点任意一格 → 反查它由哪一步计划产生、是否守约。</p>
      ) : (
        <p className="deliverable-hint muted">成品看起来齐全、可直接发出——但你看不到它有没有跑偏。</p>
      )}
    </section>
  );
}
