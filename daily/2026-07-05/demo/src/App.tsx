import { useMemo, useState } from 'react';
import { SCENARIOS } from './data/scenarios';
import { computeVerdict } from './logic/scoring';
import type { Severity } from './types';
import { Inbox } from './components/Inbox';
import { VerdictBanner } from './components/VerdictBanner';
import { DiffPane } from './components/DiffPane';
import { SemanticTree } from './components/SemanticTree';
import { FindingsPanel } from './components/FindingsPanel';
import { HowItWorks } from './components/HowItWorks';

type DiffMode = 'line' | 'semantic';

export default function App() {
  const [selectedId, setSelectedId] = useState<string>(SCENARIOS[0].id);
  const [diffMode, setDiffMode] = useState<DiffMode>('line');
  const [severityFilter, setSeverityFilter] = useState<Severity | 'all'>('all');
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const [showHow, setShowHow] = useState<boolean>(false);

  const scenario = useMemo(
    () => SCENARIOS.find((s) => s.id === selectedId) ?? SCENARIOS[0],
    [selectedId],
  );
  const verdict = useMemo(() => computeVerdict(scenario), [scenario]);

  function selectScenario(id: string) {
    setSelectedId(id);
    setDiffMode('line');
    setSeverityFilter('all');
    setActiveNodeId(null);
    setShowHow(false);
  }

  function focusNode(nodeId: string) {
    setActiveNodeId(nodeId);
    setDiffMode('semantic');
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden>◗</span>
          <div className="brand-text">
            <div className="brand-name">Contour</div>
            <div className="brand-tag">看清 Agent 改动的真实轮廓 · 结构化产物的语义评审层</div>
          </div>
        </div>
        <button className="how-btn" onClick={() => setShowHow((v) => !v)}>
          {showHow ? '← 返回评审' : '为什么行级 diff 不够？'}
        </button>
      </header>

      <div className="layout">
        <aside className="sidebar">
          <div className="sidebar-title">Agent 改动收件箱</div>
          <p className="sidebar-hint">
            每条都是一个 Agent 交付的结构化产物改动，附它自己的一句话自述。挑一个，看看语义上究竟改了什么。
          </p>
          <Inbox
            scenarios={SCENARIOS}
            selectedId={selectedId}
            onSelect={selectScenario}
          />
        </aside>

        <main className="main">
          {showHow ? (
            <HowItWorks />
          ) : (
            <>
              <div className="artifact-head">
                <div className="artifact-domain">{scenario.domain}</div>
                <code className="artifact-path">{scenario.artifact}</code>
              </div>

              <VerdictBanner scenario={scenario} verdict={verdict} />

              <div className="toolbar">
                <div className="segmented" role="tablist" aria-label="diff 模式">
                  <button
                    className={diffMode === 'line' ? 'seg active' : 'seg'}
                    onClick={() => setDiffMode('line')}
                    role="tab"
                    aria-selected={diffMode === 'line'}
                  >
                    行级 diff
                  </button>
                  <button
                    className={diffMode === 'semantic' ? 'seg active' : 'seg'}
                    onClick={() => setDiffMode('semantic')}
                    role="tab"
                    aria-selected={diffMode === 'semantic'}
                  >
                    语义 diff · 意图核验
                  </button>
                </div>

                {diffMode === 'semantic' && (
                  <div className="filters">
                    {(['all', 'critical', 'warn', 'info'] as const).map((s) => (
                      <button
                        key={s}
                        className={severityFilter === s ? `chip chip-${s} active` : `chip chip-${s}`}
                        onClick={() => setSeverityFilter(s)}
                      >
                        {s === 'all' ? '全部' : s === 'critical' ? 'Critical' : s === 'warn' ? 'Warn' : 'Info'}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {diffMode === 'line' ? (
                <DiffPane scenario={scenario} verdict={verdict} onSwitch={() => setDiffMode('semantic')} />
              ) : (
                <div className="review-grid">
                  <SemanticTree
                    scenario={scenario}
                    activeNodeId={activeNodeId}
                    onSelectNode={setActiveNodeId}
                  />
                  <FindingsPanel
                    scenario={scenario}
                    severityFilter={severityFilter}
                    activeNodeId={activeNodeId}
                    onFocusNode={focusNode}
                  />
                </div>
              )}
            </>
          )}
        </main>
      </div>

      <footer className="footer">
        纯前端 mock 演示 · 全部数据为示例，不接真实后端 / 凭证 / 模型 · Product Opportunity Lab · 2026-07-05
      </footer>
    </div>
  );
}
