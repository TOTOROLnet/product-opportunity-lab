import { useMemo, useState } from 'react';
import { scenarios } from './data/scenarios';
import { findClaim, indexNodes, summarize } from './logic/rootline';
import { ScenarioSwitcher } from './components/ScenarioSwitcher';
import { ModeToggle } from './components/ModeToggle';
import { TruthMeter } from './components/TruthMeter';
import { AgentTree } from './components/AgentTree';
import { FinalAnswer } from './components/FinalAnswer';
import { DetailPanel } from './components/DetailPanel';
import { HowItWorks } from './components/HowItWorks';

export default function App() {
  const [scenarioId, setScenarioId] = useState(scenarios[0].id);
  const [lensOn, setLensOn] = useState(false);
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const scenario = useMemo(
    () => scenarios.find((s) => s.id === scenarioId) ?? scenarios[0],
    [scenarioId],
  );
  const summary = useMemo(() => summarize(scenario), [scenario]);
  const selectedClaim = findClaim(scenario, selectedClaimId);
  const selectedNode = selectedNodeId ? indexNodes(scenario.nodes)[selectedNodeId] : undefined;

  function switchScenario(id: string) {
    setScenarioId(id);
    setSelectedClaimId(null);
    setSelectedNodeId(null);
  }

  function toggleLens(on: boolean) {
    setLensOn(on);
    if (!on) {
      setSelectedClaimId(null);
      setSelectedNodeId(null);
    }
  }

  function selectClaim(id: string) {
    setSelectedClaimId((cur) => (cur === id ? null : id));
    setSelectedNodeId(null);
  }

  function selectNode(id: string) {
    setSelectedNodeId((cur) => (cur === id ? null : id));
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          <span className="brand-mark">根脉</span>
          <div className="brand-text">
            <h1>Rootline</h1>
            <p>模型内多智能体调用的「结论溯源 + 压缩失真」审计透镜</p>
          </div>
        </div>
        <div className="header-controls">
          <ScenarioSwitcher
            scenarios={scenarios.map((s) => ({ id: s.id, title: s.title }))}
            current={scenarioId}
            onSelect={switchScenario}
          />
          <ModeToggle lensOn={lensOn} onToggle={toggleLens} />
        </div>
      </header>

      {lensOn && (
        <div className="meter-wrap">
          <TruthMeter summary={summary} />
        </div>
      )}

      <main className={`workspace${lensOn ? ' lens' : ' naked'}`}>
        {lensOn && (
          <section className="col col-tree">
            <AgentTree
              nodes={scenario.nodes}
              selectedClaim={selectedClaim}
              selectedNodeId={selectedNodeId}
              onSelectNode={selectNode}
            />
          </section>
        )}

        <section className="col col-answer">
          <FinalAnswer
            scenario={scenario}
            lensOn={lensOn}
            selectedClaimId={selectedClaimId}
            onSelectClaim={selectClaim}
          />
          {!lensOn && (
            <button className="cta-lens" onClick={() => toggleLens(true)}>
              开启根脉透镜 · 审计这条答案 →
            </button>
          )}
        </section>

        {lensOn && (
          <section className="col col-detail">
            <DetailPanel
              scenario={scenario}
              selectedClaim={selectedClaim}
              selectedNode={selectedNode}
              onSelectNode={selectNode}
            />
          </section>
        )}
      </main>

      <footer className="app-footer">
        <HowItWorks />
        <p className="footer-note">
          Rootline（根脉）· product-opportunity-lab demo 2026-07-11 · 纯前端 mock，不接真实模型 / 后端。
        </p>
      </footer>
    </div>
  );
}
