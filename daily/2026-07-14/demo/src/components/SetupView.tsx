import type { Scenario } from '../types';
import { usd } from './shared';

interface Props {
  scenarios: Scenario[];
  scenario: Scenario;
  onSelectScenario: (id: string) => void;
  budget: number;
  qualityBar: number;
  onBudget: (v: number) => void;
  onQualityBar: (v: number) => void;
  onRun: () => void;
}

export default function SetupView({
  scenarios,
  scenario,
  onSelectScenario,
  budget,
  qualityBar,
  onBudget,
  onQualityBar,
  onRun,
}: Props) {
  return (
    <>
      <div className="panel">
        <h2>1 · 选择任务场景</h2>
        <p className="sub">
          每个场景都是一个"自主付费 agent"要完成的任务，面前有一排<strong>按次付费</strong>的数据源（对应
          AgentKey / Loomal 的"调用前成本可见"）。
        </p>
        <div className="scenario-grid">
          {scenarios.map((s) => (
            <button
              key={s.id}
              className={`scenario-card ${s.id === scenario.id ? 'active' : ''}`}
              onClick={() => onSelectScenario(s.id)}
            >
              <div className="name">{s.title}</div>
              <div className="desc">{s.sources.length} 个付费源 · {s.subNeeds.length} 个信息需求</div>
              {s.isControl && <span className="ctrl-tag">CONTROL · 验证不逢事就喊省</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="panel">
        <h2>2 · 任务与信息需求</h2>
        <div className="goalbox">
          {scenario.goal}
          <div className="brief">{scenario.brief}</div>
        </div>
        <p className="section-label">任务拆解出的信息需求（含权重）</p>
        <div className="chips">
          {scenario.subNeeds.map((n) => (
            <span key={n.id} className="chip">
              {n.label}
              <span className="w">权重 {n.weight}</span>
            </span>
          ))}
        </div>
      </div>

      <div className="panel">
        <h2>3 · 付费源市场</h2>
        <p className="sub">
          价格 / 覆盖 / 质量均为 mock 标注（括号内为原始覆盖质量）。贪婪 agent 会一把梭全调；值当只买"最便宜且够用"。
        </p>
        <table className="market">
          <thead>
            <tr>
              <th>数据源</th>
              <th>单次价格</th>
              <th>可靠度</th>
              <th>覆盖的信息需求（原始质量）</th>
            </tr>
          </thead>
          <tbody>
            {scenario.sources.map((s) => (
              <tr key={s.id}>
                <td>
                  <div className="src-name">{s.name}</div>
                  <div className="src-cat">{s.category} · {s.note}</div>
                </td>
                <td className="price">{usd(s.priceUSD)}</td>
                <td>{(s.reliability * 100).toFixed(0)}%</td>
                <td>
                  {scenario.subNeeds
                    .filter((n) => (s.covers[n.id] ?? 0) > 0)
                    .map((n) => (
                      <span key={n.id} className="covtag">
                        {n.label}
                        <span className="q">{(s.covers[n.id] ?? 0).toFixed(2)}</span>
                      </span>
                    ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="panel">
        <h2>4 · 预算与够用标准</h2>
        <p className="sub">拖动即真实改变值当的计划——这是 mock 数据 + 真实优化逻辑，不是录像。</p>
        <div className="controls">
          <div className="slider-wrap">
            <label>
              预算上限
              <span className="val">{usd(budget)}</span>
            </label>
            <input
              type="range"
              min={0.1}
              max={5}
              step={0.05}
              value={budget}
              onChange={(e) => onBudget(Number(e.target.value))}
            />
            <div className="hint">调低预算 → 值当优先满足高权重需求，低优先需求受预算约束跳过。</div>
          </div>
          <div className="slider-wrap">
            <label>
              够用标准（每个需求达到该覆盖质量即"够用"）
              <span className="val">{qualityBar.toFixed(2)}</span>
            </label>
            <input
              type="range"
              min={0.4}
              max={0.9}
              step={0.05}
              value={qualityBar}
              onChange={(e) => onQualityBar(Number(e.target.value))}
            />
            <div className="hint">调高够用标准 → 更不轻易停手、愿意为更高质量多花钱。</div>
          </div>
        </div>
        <div className="btn-row">
          <button className="btn primary" onClick={onRun}>
            运行对比 · 贪婪 vs 值当 →
          </button>
        </div>
      </div>
    </>
  );
}
