import { useMemo } from 'react';
import type { Scenario, ItemDecision } from '../types';
import { verdictLabel, deviationKindLabel, stepForElement } from '../logic/mandate';

interface Props {
  scenario: Scenario;
  decisions: Record<string, ItemDecision>;
  selectedStepId: string | null;
  onSelectStep: (id: string) => void;
  onDecision: (stepId: string, decision: ItemDecision) => void;
}

export default function ReconciliationPanel({
  scenario,
  decisions,
  selectedStepId,
  onSelectStep,
  onDecision,
}: Props) {
  const { steps } = scenario;

  const selectedStep = useMemo(
    () => (selectedStepId ? stepForElement(steps, selectedStepId) : undefined),
    [steps, selectedStepId],
  );

  return (
    <section className="recon-panel">
      <div className="panel-head">
        <h2>授权契约对账</h2>
        <p className="recon-sub">把你批准计划的每一步，与 agent 实际执行并排核对。</p>
      </div>

      {selectedStep && (
        <div className={`traceback v-${selectedStep.verdict}`}>
          <span className="traceback-tag">反查</span>
          你点击的成品项由 <b>「{selectedStep.title}」</b> 这一步产生，裁定为{' '}
          <b>{verdictLabel(selectedStep.verdict)}</b>
          {selectedStep.deviationKind ? `（${deviationKindLabel(selectedStep.deviationKind)}）` : ''}。
        </div>
      )}

      <ol className="recon-list">
        {steps.map((step) => {
          const decision = decisions[step.id];
          const selected = selectedStepId === step.id;
          return (
            <li
              key={step.id}
              className={[
                'recon-step',
                `v-${step.verdict}`,
                selected ? 'selected' : '',
                decision ? `decided-${decision}` : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => onSelectStep(step.id)}
            >
              <div className="recon-step-head">
                <span className={`verdict-badge v-${step.verdict}`}>
                  {verdictLabel(step.verdict)}
                  {step.deviationKind && step.verdict !== 'honored' && (
                    <span className="kind-tag"> · {deviationKindLabel(step.deviationKind)}</span>
                  )}
                </span>
                <span className="recon-step-title">{step.title}</span>
                {step.isExternalAction && <span className="external-flag">对外动作</span>}
              </div>

              <div className="recon-compare">
                <div className="compare-col plan-col">
                  <span className="compare-label">你批准</span>
                  <span className="compare-text">
                    {step.planIntent ?? '（此步不在你批准的计划中 · 计划外新增）'}
                  </span>
                  {step.guardrail && <span className="guardrail">约束：{step.guardrail}</span>}
                </div>
                <div className="compare-col act-col">
                  <span className="compare-label">实际执行</span>
                  <span className="compare-text">{step.actualAction}</span>
                  {step.usedSources.length > 0 && (
                    <span className="sources">
                      {step.usedSources.map((s) => (
                        <span
                          key={s.label}
                          className={`source-chip ${s.approved ? 'approved' : 'unapproved'}`}
                        >
                          {s.approved ? '✓ ' : '✗ '}
                          {s.label}
                        </span>
                      ))}
                    </span>
                  )}
                </div>
              </div>

              <p className="recon-reason">{step.reason}</p>

              {step.verdict === 'deviated' && (
                <div className="decision-row" onClick={(e) => e.stopPropagation()}>
                  <span className="decision-prompt">
                    {decision === 'signed'
                      ? '你已签署放行此项（资深判断已在回路）。'
                      : decision === 'rejected'
                        ? '你已驳回此项，待 agent 重做。'
                        : '此项越界需你决定：'}
                  </span>
                  <button
                    type="button"
                    className={`sign-btn ${decision === 'signed' ? 'active' : ''}`}
                    onClick={() => onDecision(step.id, 'signed')}
                  >
                    签署放行
                  </button>
                  <button
                    type="button"
                    className={`reject-btn ${decision === 'rejected' ? 'active' : ''}`}
                    onClick={() => onDecision(step.id, 'rejected')}
                  >
                    驳回重做
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
