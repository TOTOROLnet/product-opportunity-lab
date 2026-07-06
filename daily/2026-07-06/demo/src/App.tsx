import { useMemo, useState } from 'react';
import { scenarios } from './data/scenarios';
import { transitionOf } from './logic/verdict';
import { ScenarioList } from './components/ScenarioList';
import { VerdictHeader } from './components/VerdictHeader';
import { CriteriaMatrix } from './components/CriteriaMatrix';
import { EvidencePanel } from './components/EvidencePanel';
import { HowItWorks } from './components/HowItWorks';

function firstInteresting(scenarioId: string): string {
  const sc = scenarios.find((s) => s.id === scenarioId)!;
  const reg = sc.criteria.find((c) => transitionOf(c) === 'regressed');
  if (reg) return reg.id;
  const imp = sc.criteria.find((c) => transitionOf(c) === 'improved');
  if (imp) return imp.id;
  return sc.criteria[0].id;
}

export default function App() {
  const [scenarioId, setScenarioId] = useState(scenarios[0].id);
  const [criterionId, setCriterionId] = useState<string>(() => firstInteresting(scenarios[0].id));
  const [onlyChanged, setOnlyChanged] = useState(false);

  const scenario = useMemo(
    () => scenarios.find((s) => s.id === scenarioId)!,
    [scenarioId],
  );
  const criterion = useMemo(
    () => scenario.criteria.find((c) => c.id === criterionId) ?? null,
    [scenario, criterionId],
  );

  function handleScenario(id: string) {
    setScenarioId(id);
    setCriterionId(firstInteresting(id));
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden>
            <svg viewBox="0 0 32 32" width="26" height="26">
              <rect width="32" height="32" rx="7" fill="#0b1220" />
              <path
                d="M8 22 L14 10 L20 18 L24 12"
                fill="none"
                stroke="#38bdf8"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="24" cy="12" r="2.6" fill="#f87171" />
            </svg>
          </span>
          <div>
            <div className="brand-name">Datum</div>
            <div className="brand-sub">Agent 交付证据的验收基线与回归哨兵</div>
          </div>
        </div>
        <div className="tagline">
          把一次性证据 bundle 升级为<strong>可版本化基线</strong>，跨 run 复判验收标准，只顶出<strong>回归</strong>。
        </div>
      </header>

      <div className="layout">
        <aside className="sidebar">
          <ScenarioList scenarios={scenarios} selectedId={scenarioId} onSelect={handleScenario} />
        </aside>

        <main className="main">
          <div className="run-meta">
            <span className="rm-item">
              <span className="rm-k">基线</span> {scenario.baselineRun.label} · {scenario.baselineRun.agent}
            </span>
            <span className="rm-vs">vs</span>
            <span className="rm-item">
              <span className="rm-k">当前</span> {scenario.currentRun.label} · {scenario.currentRun.agent}
            </span>
          </div>

          <VerdictHeader scenario={scenario} />

          <div className="matrix-bar">
            <h2>验收标准复判</h2>
            <label className="toggle">
              <input
                type="checkbox"
                checked={onlyChanged}
                onChange={(e) => setOnlyChanged(e.target.checked)}
              />
              只看发生变化的项
            </label>
          </div>

          <div className="workarea">
            <CriteriaMatrix
              criteria={scenario.criteria}
              selectedId={criterionId}
              onSelect={setCriterionId}
              onlyChanged={onlyChanged}
            />
            <EvidencePanel criterion={criterion} />
          </div>

          <HowItWorks />
        </main>
      </div>

      <footer className="footer">
        <span>Datum · 纯前端 mock 演示 · 全部证据为模拟数据，不接真实环境 / 后端 / 外部 API</span>
        <span className="footer-src">
          源信号：product-hunt-radar 2026-07-06（TryCase · CircleChat）｜产品机会实验室每日循环 · rev.2
        </span>
      </footer>
    </div>
  );
}
