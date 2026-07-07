import { useMemo, useState } from 'react'
import { scenarios } from './data/scenarios'
import { analyzePlan, applySafetyNet } from './logic/analyze'
import { RunVerdictHeader } from './components/RunVerdictHeader'
import { Timeline } from './components/Timeline'
import { ActionDetail } from './components/ActionDetail'
import { BeforeAfter } from './components/BeforeAfter'
import { HowItWorks } from './components/HowItWorks'

type Tab = 'analyzer' | 'ba' | 'how'

export default function App() {
  const [scenarioId, setScenarioId] = useState(scenarios[0].id)
  const [tab, setTab] = useState<Tab>('analyzer')
  const [safetyNet, setSafetyNet] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const scenario = scenarios.find((s) => s.id === scenarioId)!

  const actions = useMemo(
    () => (safetyNet ? applySafetyNet(scenario.actions) : scenario.actions),
    [scenario, safetyNet],
  )

  const { diagnoses, verdict } = useMemo(() => analyzePlan(actions), [actions])

  const selectedAction = actions.find((a) => a.id === selectedId) ?? null
  const selectedDiag = diagnoses.find((d) => d.actionId === selectedId) ?? null

  function pickScenario(id: string) {
    setScenarioId(id)
    setSelectedId(null)
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="logo">↺</span>
          <div>
            <div className="brand-name">Reverso</div>
            <div className="brand-tag">Agent 动作可逆性与回滚规划器 · the backward path</div>
          </div>
        </div>
        <nav className="tabs">
          <button className={tab === 'analyzer' ? 'active' : ''} onClick={() => setTab('analyzer')}>
            Plan Analyzer
          </button>
          <button className={tab === 'ba' ? 'active' : ''} onClick={() => setTab('ba')}>
            Before / After
          </button>
          <button className={tab === 'how' ? 'active' : ''} onClick={() => setTab('how')}>
            How it works
          </button>
        </nav>
      </header>

      {tab !== 'how' && (
        <div className="controls">
          <div className="scenario-picker">
            {scenarios.map((s) => (
              <button
                key={s.id}
                className={`chip${s.id === scenarioId ? ' chip-active' : ''}`}
                onClick={() => pickScenario(s.id)}
                title={s.summary}
              >
                {s.name}
              </button>
            ))}
          </div>
          <label className={`safety-toggle${safetyNet ? ' on' : ''}`}>
            <input
              type="checkbox"
              checked={safetyNet}
              onChange={(e) => setSafetyNet(e.target.checked)}
            />
            <span className="switch" />
            <span className="safety-label">
              Reverso 保护网
              <small>临界动作前自动快照 / 备份</small>
            </span>
          </label>
        </div>
      )}

      <main className="content">
        {tab === 'analyzer' && (
          <>
            <p className="scenario-summary">{scenario.summary}</p>
            <RunVerdictHeader verdict={verdict} />
            <div className="analyzer-grid">
              <Timeline
                actions={actions}
                diagnoses={diagnoses}
                selectedId={selectedId}
                pointOfNoReturnId={verdict.pointOfNoReturnId}
                onSelect={setSelectedId}
              />
              <ActionDetail
                action={selectedAction}
                diagnosis={selectedDiag}
                isPointOfNoReturn={
                  selectedId != null && selectedId === verdict.pointOfNoReturnId
                }
              />
            </div>
          </>
        )}

        {tab === 'ba' && (
          <>
            <p className="scenario-summary">{scenario.summary}</p>
            <RunVerdictHeader verdict={verdict} />
            <BeforeAfter actions={actions} diagnoses={diagnoses} />
          </>
        )}

        {tab === 'how' && <HowItWorks />}
      </main>

      <footer className="footer">
        Reverso · 纯前端模拟 Demo（Vite + React + TS）· 数据全 mock，不执行真实动作 ·
        product-opportunity-lab 2026-07-07 · rev.1
      </footer>
    </div>
  )
}
