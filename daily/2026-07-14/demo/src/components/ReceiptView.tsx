import type { PlanResult, Scenario } from '../types';
import { plannerConstants } from '../logic/planner';
import { usd, VerdictBadge } from './shared';

interface Props {
  scenario: Scenario;
  plan: PlanResult;
  qualityBar: number;
  budget: number;
  onBack: () => void;
}

export default function ReceiptView({ scenario, plan, qualityBar, budget, onBack }: Props) {
  const {
    greedyTotalUSD,
    worthwhileTotalUSD,
    savedUSD,
    savedPct,
    greedyCalls,
    coverageByNeed,
    greedyProgress,
    worthwhileProgress,
    nearOptimal,
  } = plan;

  const wastedRedundant = greedyCalls.filter(
    (c) => c.verdict === 'redundant' || c.verdict === 'wasted',
  );

  return (
    <div className="panel">
      <h2>对账收据 · {scenario.title}</h2>
      <p className="sub">花后逐笔价值归因：每一笔付费买到了什么，值 / 冗余 / 浪费一目了然。</p>

      <div className={`savings-hero ${nearOptimal ? 'near-optimal' : ''}`}>
        {nearOptimal ? (
          <>
            <div className="headline">
              已接近最优 · 仅可省 <span className="amt">{usd(savedUSD)}</span>（
              {(savedPct * 100).toFixed(0)}%）
            </div>
            <div className="sub">
              这个任务里各来源互不重叠、各自必需——你的 agent 本就花得不错，值当不会为了显得有用而硬喊省钱。
            </div>
          </>
        ) : (
          <>
            <div className="headline">
              同一任务 · 省下 <span className="amt">{usd(savedUSD)}</span>（
              {(savedPct * 100).toFixed(0)}%），质量对等
            </div>
            <div className="sub">
              贪婪 {usd(greedyTotalUSD)} → 值当 {usd(worthwhileTotalUSD)}；跳过 {wastedRedundant.length}{' '}
              笔冗余/浪费调用，需求覆盖不降（见下方覆盖对比）。
            </div>
          </>
        )}
      </div>

      <div className="summary-grid">
        <div className="stat">
          <div className="k">贪婪 agent 花费</div>
          <div className="v money">{usd(greedyTotalUSD)}</div>
        </div>
        <div className="stat">
          <div className="k">值当花费</div>
          <div className="v money">{usd(worthwhileTotalUSD)}</div>
        </div>
        <div className="stat">
          <div className="k">省下</div>
          <div className="v save">
            {usd(savedUSD)} · {(savedPct * 100).toFixed(0)}%
          </div>
        </div>
        <div className="stat">
          <div className="k">调用次数</div>
          <div className="v">
            {plan.worthwhileCalls.length} / {greedyCalls.length}
          </div>
        </div>
      </div>

      <p className="section-label">需求覆盖对比（贪婪 vs 值当，蓝线 = 够用标准 {qualityBar.toFixed(2)}）</p>
      <div style={{ marginBottom: 20 }}>
        {coverageByNeed.map(({ need, greedyCoverage, worthwhileCoverage }) => (
          <div className="covrow" key={need.id}>
            <div className="nlabel">
              {need.label} <span className="w">·权重 {need.weight}</span>
            </div>
            <div className="bars">
              <div className="barline">
                <span style={{ width: 34 }}>贪婪</span>
                <div className="track">
                  <div className="fill greedy" style={{ width: `${Math.min(greedyCoverage, 1) * 100}%` }} />
                  <div className="barmark" style={{ left: `${qualityBar * 100}%` }} />
                </div>
                <span style={{ width: 34, textAlign: 'right' }}>{greedyCoverage.toFixed(2)}</span>
              </div>
              <div className="barline">
                <span style={{ width: 34 }}>值当</span>
                <div className="track">
                  <div
                    className="fill worthwhile"
                    style={{ width: `${Math.min(worthwhileCoverage, 1) * 100}%` }}
                  />
                  <div className="barmark" style={{ left: `${qualityBar * 100}%` }} />
                </div>
                <span style={{ width: 34, textAlign: 'right' }}>{worthwhileCoverage.toFixed(2)}</span>
              </div>
            </div>
          </div>
        ))}
        <div className="foot-src">
          整体进度：贪婪 {(greedyProgress * 100).toFixed(0)}% · 值当 {(worthwhileProgress * 100).toFixed(0)}%
          （按够用线截断的加权覆盖）。
        </div>
      </div>

      <p className="section-label">逐笔价值归因（贪婪 agent 实际花的每一笔）</p>
      <table className="receipt">
        <thead>
          <tr>
            <th>数据源</th>
            <th>花费</th>
            <th>裁决</th>
            <th>归因理由</th>
          </tr>
        </thead>
        <tbody>
          {greedyCalls.map((c) => {
            const kept = c.verdict === 'worth';
            return (
              <tr key={c.source.id} className={c.verdict}>
                <td>
                  <div className="src-name">{c.source.name}</div>
                  <div className="src-cat">{c.source.category}</div>
                </td>
                <td className="price">
                  <span className={kept ? '' : 'strike'}>{usd(c.source.priceUSD)}</span>
                </td>
                <td>
                  <VerdictBadge verdict={c.verdict} />
                </td>
                <td className="reason-cell">{c.reason}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <details className="method">
        <summary>价值归因怎么算的？（诚实说明：mock 数据 + 真实逻辑）</summary>
        <ul>
          <li>
            有效覆盖 <code>effQ = 覆盖质量 × 可靠度</code>；低于可用下限{' '}
            <code>{plannerConstants.USEFUL_FLOOR}</code> 的覆盖视为噪声（记 0）。
          </li>
          <li>某需求的覆盖 = 已调用源中该需求的最高 effQ —— 天然建模去重：重叠来源的边际贡献≈0。</li>
          <li>
            单次调用的边际价值 = Σ 权重 ×（新覆盖 − 旧覆盖，均按够用线 <code>{qualityBar.toFixed(2)}</code>{' '}
            截断）。
          </li>
          <li>
            <strong>值</strong>：边际价值 &gt; 阈值 <code>{plannerConstants.MEANINGFUL_GAIN}</code> 且预算够；
            <strong>冗余</strong>：单独看有价值、但需求已被更省的源覆盖到够用线；
            <strong>浪费</strong>：单独看就低于可用下限，几乎无有效信息。
          </li>
          <li>
            当前预算上限 <code>{usd(budget)}</code>：预算不足时，值当优先满足高权重需求，其余标为"预算跳过"。
          </li>
          <li>
            价格 / 覆盖 / 可靠度是手工 mock 标注；但上述择优 / 去重 / 够用即止 / 预算封顶是前端<strong>真实运行</strong>的——拖动滑块会真实改变结果。
          </li>
        </ul>
      </details>

      <div className="btn-row">
        <button className="btn ghost" onClick={onBack}>
          ← 回到对比
        </button>
      </div>
    </div>
  );
}
