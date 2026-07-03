import type { RunStep } from '../types'

export default function StepDetail({ step }: { step: RunStep }) {
  return (
    <div className="stepdetail">
      <div className="sd-head">
        <span className="sd-step">步骤 {step.id}</span>
        <h3 className="sd-title">{step.title}</h3>
      </div>
      <p className="sd-detail">{step.detail}</p>

      {step.overflowNote && (
        <div className="callout callout-overflow">
          <span className="callout-tag">窗口事件</span>
          {step.overflowNote}
        </div>
      )}

      {step.outcome && (
        <div className={`callout callout-${step.outcome.kind}`}>
          <span className="callout-tag">
            {step.outcome.kind === 'danger' ? '结果 · 危险' : step.outcome.kind === 'warn' ? '结果 · 警告' : '结果 · 正常'}
          </span>
          {step.outcome.text}
        </div>
      )}
    </div>
  )
}
