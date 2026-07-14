import { useMemo, useState } from 'react';
import { scenarios, defaultScenarioId } from './data/scenarios';
import { plan as runPlan } from './logic/planner';
import SetupView from './components/SetupView';
import CompareView from './components/CompareView';
import ReceiptView from './components/ReceiptView';

type View = 'setup' | 'compare' | 'receipt';

export default function App() {
  const [scenarioId, setScenarioId] = useState(defaultScenarioId);
  const scenario = useMemo(
    () => scenarios.find((s) => s.id === scenarioId) ?? scenarios[0],
    [scenarioId],
  );

  const [budget, setBudget] = useState(scenario.defaultBudget);
  const [qualityBar, setQualityBar] = useState(scenario.defaultQualityBar);
  const [view, setView] = useState<View>('setup');
  const [hasRun, setHasRun] = useState(false);

  const plan = useMemo(
    () => runPlan(scenario, budget, qualityBar),
    [scenario, budget, qualityBar],
  );

  function selectScenario(id: string) {
    const next = scenarios.find((s) => s.id === id) ?? scenarios[0];
    setScenarioId(id);
    setBudget(next.defaultBudget);
    setQualityBar(next.defaultQualityBar);
    setView('setup');
    setHasRun(false);
  }

  function go(v: View) {
    if (v !== 'setup') setHasRun(true);
    setView(v);
  }

  const navItems: { id: View; label: string }[] = [
    { id: 'setup', label: '任务与预算' },
    { id: 'compare', label: '对比运行' },
    { id: 'receipt', label: '对账收据' },
  ];

  return (
    <div className="app">
      <header className="masthead">
        <div className="brand">
          <span className="kicker">Agent 花费策略 + 对账层 · 纯前端 mock demo</span>
          <h1>
            值当 <span className="en">Worthwhile</span>
          </h1>
          <p className="tagline">
            在"价格已知"与"实际付费调用"之间加一层：<strong>花前</strong>选最便宜且够用、去重、够用即止；
            <strong>花后</strong>给逐笔价值归因的可解释账单。不做支付（Loomal），不做接入（AgentKey），只让 agent
            花得省、花得值、账算得清。
          </p>
        </div>
        <nav className="nav">
          {navItems.map((n, i) => (
            <button
              key={n.id}
              className={view === n.id ? 'active' : ''}
              disabled={n.id !== 'setup' && !hasRun}
              onClick={() => go(n.id)}
            >
              <span className="idx">{i + 1}</span>
              {n.label}
            </button>
          ))}
        </nav>
      </header>

      {view === 'setup' && (
        <SetupView
          scenarios={scenarios}
          scenario={scenario}
          onSelectScenario={selectScenario}
          budget={budget}
          qualityBar={qualityBar}
          onBudget={setBudget}
          onQualityBar={setQualityBar}
          onRun={() => go('compare')}
        />
      )}

      {view === 'compare' && (
        <CompareView
          scenario={scenario}
          plan={plan}
          onGoReceipt={() => go('receipt')}
          onBack={() => setView('setup')}
        />
      )}

      {view === 'receipt' && (
        <ReceiptView
          scenario={scenario}
          plan={plan}
          qualityBar={qualityBar}
          budget={budget}
          onBack={() => setView('compare')}
        />
      )}

      <p className="disclaimer">
        <strong>诚实边界：</strong>本 Demo 为纯前端静态原型，全部数据为 mock，不接任何真实后端 / 数据库 / 支付 / x402
        结算 / 外部 API / 登录。付费源的价格、覆盖、可靠度是手工标注的；但"按边际价值/成本择优 → 去重 → 够用即止 →
        预算封顶"的规划与逐笔价值归因是前端真实运行的算法（拖动预算 / 够用标准会真实改变计划与账单）。真实产品里"价值 /
        覆盖 / 去重"的估计是核心工程难点。
        <br />
        <span className="foot-src">
          信号来源：product-hunt-radar 2026-07-14 —— AgentKey（调用前成本可见）、Loomal（x402 按次付费）指向"agent
          作为付费主体"。值当切入的是报告未点出的一层：付钱前的取舍 + 付钱后的对账。
        </span>
      </p>
    </div>
  );
}
