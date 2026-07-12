import { useMemo, useState } from 'react';
import { scenarios } from './data/scenarios';
import type { ItemDecision } from './types';
import { computeSummary } from './logic/mandate';
import ScenarioTabs from './components/ScenarioTabs';
import SummaryBar from './components/SummaryBar';
import DeliverablePanel from './components/DeliverablePanel';
import ReconciliationPanel from './components/ReconciliationPanel';

type DecisionMap = Record<string, Record<string, ItemDecision>>;

export default function App() {
  const [scenarioId, setScenarioId] = useState(scenarios[0].id);
  const [lensOn, setLensOn] = useState(true);
  const [decisions, setDecisions] = useState<DecisionMap>({});
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);

  const scenario = useMemo(
    () => scenarios.find((s) => s.id === scenarioId) ?? scenarios[0],
    [scenarioId],
  );
  const scenarioDecisions = decisions[scenarioId] ?? {};
  const summary = useMemo(
    () => computeSummary(scenario.steps, scenarioDecisions),
    [scenario, scenarioDecisions],
  );

  function selectScenario(id: string) {
    setScenarioId(id);
    setSelectedStepId(null);
  }

  function setDecision(stepId: string, decision: ItemDecision) {
    setDecisions((prev) => {
      const cur = { ...(prev[scenarioId] ?? {}) };
      if (cur[stepId] === decision) delete cur[stepId]; // 再点一次取消
      else cur[stepId] = decision;
      return { ...prev, [scenarioId]: cur };
    });
  }

  return (
    <div className="app">
      <header className="masthead">
        <div className="brand">
          <span className="brand-mark">明约</span>
          <span className="brand-en">Mandate</span>
        </div>
        <p className="tagline">
          自主办公 agent 的 <b>授权对账透镜</b>：agent 自主跑完数小时后，把「实际执行」逐步对回
          「你签字批准的计划」，照出每一处沉默偏离，并在<b>交付前</b>用人工签署放行越界动作。
        </p>
        <p className="provenance">
          信号来源：2026-07-12 radar · OpenAI ChatGPT Work（批准计划 → 自主执行数小时 → 交付成品）。
          明约补的是它没有的<b>反向对账层</b>——批准 ≠ 保证执行未偏离。
        </p>
      </header>

      <ScenarioTabs scenarios={scenarios} activeId={scenarioId} onSelect={selectScenario} />

      <section className="run-meta">
        <div className="run-meta-row">
          <span className="run-meta-label">本次运行</span>
          <span className="run-meta-value">{scenario.agentContext}</span>
        </div>
        <div className="run-meta-row">
          <span className="run-meta-label">你批准的计划</span>
          <span className="run-meta-value">{scenario.approvedPlanSummary}</span>
        </div>
        <div className="run-meta-row">
          <span className="run-meta-label">执行时长</span>
          <span className="run-meta-value">{scenario.ranFor}</span>
        </div>
      </section>

      <div className="lens-toggle-bar">
        <span className="lens-toggle-caption">对比：agent 交付时你看到的 vs 明约照出的</span>
        <div className="lens-toggle" role="group" aria-label="透镜开关">
          <button
            className={!lensOn ? 'active' : ''}
            onClick={() => setLensOn(false)}
            type="button"
          >
            裸交付
          </button>
          <button className={lensOn ? 'active' : ''} onClick={() => setLensOn(true)} type="button">
            明约透镜
          </button>
        </div>
      </div>

      {lensOn && <SummaryBar summary={summary} />}

      <main className={`workbench ${lensOn ? 'lens-on' : 'lens-off'}`}>
        <DeliverablePanel
          scenario={scenario}
          lensOn={lensOn}
          selectedStepId={selectedStepId}
          onSelectStep={setSelectedStepId}
        />

        {lensOn ? (
          <ReconciliationPanel
            scenario={scenario}
            decisions={scenarioDecisions}
            selectedStepId={selectedStepId}
            onSelectStep={setSelectedStepId}
            onDecision={setDecision}
          />
        ) : (
          <aside className="naked-note">
            <div className="naked-note-icon">👀</div>
            <h3>透镜关闭</h3>
            <p>
              你只看到左边这份<b>光鲜成品</b>——它看起来已完成、可直接发出。
              但这次 agent 自主跑了数小时，它是否偷偷偏离了你批准的计划？
              裸交付状态下，你<b>无从判断</b>。
            </p>
            <button className="naked-cta" onClick={() => setLensOn(true)} type="button">
              打开明约透镜 →
            </button>
          </aside>
        )}
      </main>

      <footer className="foot">
        明约 Mandate · 纯前端静态演示 · 全部数据为 mock · 不接后端 / 数据库 / 外部 API ·
        product-opportunity-lab 2026-07-12 · rev.1
      </footer>
    </div>
  );
}
