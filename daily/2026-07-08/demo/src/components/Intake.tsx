import type { Scenario } from '../types'
import { SCENARIOS } from '../data/scenarios'

interface Props {
  scenarioId: string
  values: Record<string, string>
  onSelectScenario: (id: string) => void
  onChangeField: (key: string, value: string) => void
  onFillExample: () => void
  onSubmit: () => void
}

export function Intake({ scenarioId, values, onSelectScenario, onChangeField, onFillExample, onSubmit }: Props) {
  const scenario: Scenario | undefined = SCENARIOS.find((s) => s.id === scenarioId)

  return (
    <div className="intake">
      <section className="hero">
        <div className="pill">2C · 执行型消费代理的「信任版」切入点</div>
        <h1>
          别只给你一段投诉模板，<br />
          帮你建一份<span className="accent">看得懂的案卷</span>和一条<span className="accent">你能自己走完的升级阶梯</span>
        </h1>
        <p className="lead">
          描述你的遭遇，ClaimLadder 会算清你能要回多少、依据哪条规则、先做什么再做什么——
          每一步都由你一键出手、全程留痕，AI 绝不替你越权自动打电话或发正式函件。
        </p>
        <div className="trust-strip">
          <span>✅ 应得金额有算式</span>
          <span>✅ 每条主张有依据</span>
          <span>✅ 升级路径可视化</span>
          <span>✅ 你做主 · 全程留痕</span>
        </div>
      </section>

      <section className="scenario-block">
        <h2 className="section-title">1 · 选一个纠纷场景</h2>
        <div className="scenario-grid">
          {SCENARIOS.map((s) => (
            <button
              key={s.id}
              className={`scenario-card ${s.id === scenarioId ? 'selected' : ''}`}
              onClick={() => onSelectScenario(s.id)}
              type="button"
            >
              <span className="emoji">{s.emoji}</span>
              <span className="s-name">{s.name}</span>
              <span className="s-tag">{s.tagline}</span>
            </button>
          ))}
        </div>
      </section>

      {scenario && (
        <section className="form-block">
          <div className="form-head">
            <h2 className="section-title">2 · 填几个关键事实</h2>
            <button className="ghost-btn" type="button" onClick={onFillExample}>
              用示例填充
            </button>
          </div>
          <div className="field-grid">
            {scenario.fields.map((f) => (
              <label key={f.key} className="field">
                <span className="field-label">
                  {f.label}
                  {f.unit ? <em className="unit"> · {f.unit}</em> : null}
                </span>
                {f.type === 'select' ? (
                  <select
                    value={values[f.key] ?? ''}
                    onChange={(e) => onChangeField(f.key, e.target.value)}
                  >
                    <option value="" disabled>
                      请选择…
                    </option>
                    {f.options?.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    placeholder={f.placeholder}
                    value={values[f.key] ?? ''}
                    onChange={(e) => onChangeField(f.key, e.target.value)}
                  />
                )}
                {f.help ? <span className="field-help">{f.help}</span> : null}
              </label>
            ))}
          </div>
          <button className="primary-btn" type="button" onClick={onSubmit}>
            生成我的案卷 →
          </button>
          <p className="disclaimer-inline">
            ⚠️ Demo 内规则与金额均为<strong>示例</strong>，用于演示产品形态，非法律意见；实际以适用法规与个案为准。
          </p>
        </section>
      )}
    </div>
  )
}
