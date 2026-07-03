import { useMemo, useState } from 'react'
import type { Scenario } from './types'
import { scenarios } from './data/scenario'
import ContextWindow, { KIND_META } from './components/ContextWindow'
import Timeline from './components/Timeline'
import StepDetail from './components/StepDetail'
import Report from './components/Report'
import Compare from './components/Compare'

type View = 'run' | 'compare' | 'report'

function Legend() {
  return (
    <div className="legend">
      {Object.entries(KIND_META).map(([k, v]) => (
        <span key={k} className="legend-item">
          <span className="dot" style={{ background: v.color }} /> {v.label}
        </span>
      ))}
    </div>
  )
}

function VerdictStrip({ scenario }: { scenario: Scenario }) {
  const v = scenario.verdict
  return (
    <div className={`verdict-strip verdict-${v.kind}`}>
      <span className="vs-badge">{v.kind === 'danger' ? '⛔' : '✅'}</span>
      <span className="vs-headline">{v.headline}</span>
      <span className="vs-detail">{v.detail}</span>
    </div>
  )
}

export default function App() {
  const [scenarioId, setScenarioId] = useState<Scenario['id']>('baseline')
  const [view, setView] = useState<View>('run')
  const [stepId, setStepId] = useState(4)

  const scenario = scenarios[scenarioId]
  const step = useMemo(
    () => scenario.steps.find((s) => s.id === stepId) ?? scenario.steps[0],
    [scenario, stepId],
  )

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <div className="logo">◐</div>
          <div>
            <div className="brand-name">Contextlens</div>
            <div className="brand-tag">Agent 上下文窗口 X 光片 · 看清每一步窗口里装了什么、什么被挤掉了</div>
          </div>
        </div>
        <nav className="tabs">
          <button className={view === 'run' ? 'on' : ''} onClick={() => setView('run')}>Run X 光</button>
          <button className={view === 'compare' ? 'on' : ''} onClick={() => setView('compare')}>修复对比</button>
          <button className={view === 'report' ? 'on' : ''} onClick={() => setView('report')}>X 光报告</button>
        </nav>
      </header>

      {view !== 'compare' && (
        <div className="scenario-switch">
          <span className="ss-label">场景</span>
          {(Object.keys(scenarios) as Scenario['id'][]).map((id) => (
            <button
              key={id}
              className={`ss-btn ss-${id} ${scenarioId === id ? 'on' : ''}`}
              onClick={() => setScenarioId(id)}
            >
              {scenarios[id].name}
              <span className="ss-sub">{scenarios[id].subtitle}</span>
            </button>
          ))}
        </div>
      )}

      <main className="content">
        {view === 'run' && (
          <>
            <VerdictStrip scenario={scenario} />
            <div className="run-grid">
              <aside className="run-left">
                <Timeline steps={scenario.steps} selectedId={step.id} onSelect={setStepId} />
              </aside>
              <section className="run-right">
                <StepDetail step={step} />
                <ContextWindow blocks={step.blocks} budgetTokens={scenario.budgetTokens} />
                <Legend />
              </section>
            </div>
          </>
        )}

        {view === 'compare' && <Compare />}

        {view === 'report' && <Report scenario={scenario} />}
      </main>

      <footer className="footer">
        纯前端演示 · 数据全部为 mock，不接任何真实模型 / 后端 / 外部 API ·
        product-opportunity-lab / 2026-07-03
      </footer>
    </div>
  )
}
