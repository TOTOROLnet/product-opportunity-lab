import { baseline, fixed } from '../data/scenario'
import ContextWindow from './ContextWindow'

const DECISION_STEP = 6

function side(scenarioName: string, subtitle: string) {
  const scenario = scenarioName === 'baseline' ? baseline : fixed
  const step = scenario.steps.find((s) => s.id === DECISION_STEP)!
  const outcome = step.outcome!
  return (
    <div className={`compare-col compare-${scenario.id}`}>
      <div className="compare-col-head">
        <span className={`tag tag-${scenario.id}`}>{scenario.id === 'baseline' ? '基线' : '修复'}</span>
        <div>
          <div className="compare-col-title">{scenario.name}</div>
          <div className="compare-col-sub">{subtitle}</div>
        </div>
      </div>

      <div className="compare-action">
        <span className="compare-action-label">第 6 步动作</span>
        {step.title}
      </div>

      <ContextWindow blocks={step.blocks} budgetTokens={scenario.budgetTokens} />

      <div className={`callout callout-${outcome.kind} compare-outcome`}>
        <span className="callout-tag">{outcome.kind === 'danger' ? '事故' : '安全'}</span>
        {outcome.text}
      </div>
    </div>
  )
}

export default function Compare() {
  return (
    <div className="compare">
      <div className="compare-intro">
        <h3>同一模型 · 同一请求 · 只改上下文工程</h3>
        <p>
          左右都是第 6 步的决策时刻。差别只有一个：右侧把关键『退款政策/风险记忆』
          <b> Pin 住</b>、并把工具输出<b>压缩</b>——于是策略始终在窗口内，危险放款被安全拦下。
        </p>
      </div>
      <div className="compare-grid">
        {side('baseline', '关键约束在第 4 步被驱逐')}
        {side('fixed', '关键约束全程锁定窗口')}
      </div>
    </div>
  )
}
