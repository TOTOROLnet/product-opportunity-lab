import { useMemo, useState } from 'react'
import type { Resolution, Scenario, ThoughtType } from './types'
import { SCENARIOS } from './data/scenarios'
import { buildClarity, type ConfirmState } from './logic/clarity'
import { Intake } from './components/Intake'
import { UntangleBoard } from './components/UntangleBoard'
import { ClarityCard } from './components/ClarityCard'
import { StepBar } from './components/StepBar'

type Step = 'intake' | 'untangle' | 'card'

function initState(scenario: Scenario): ConfirmState {
  const userTypes: Record<string, ThoughtType> = {}
  const confirmed: Record<string, boolean> = {}
  const removed: Record<string, boolean> = {}
  for (const s of scenario.segments) {
    userTypes[s.id] = s.aiType
    confirmed[s.id] = false
    removed[s.id] = false
  }
  return { userTypes, confirmed, removed, resolutions: {} }
}

export default function App() {
  const [scenario, setScenario] = useState<Scenario | null>(null)
  const [step, setStep] = useState<Step>('intake')
  const [state, setState] = useState<ConfirmState | null>(null)

  const chooseScenario = (s: Scenario) => {
    setScenario(s)
    setState(initState(s))
    setStep('intake')
  }

  const reset = () => {
    setScenario(null)
    setState(null)
    setStep('intake')
  }

  const setType = (id: string, type: ThoughtType) =>
    setState((prev) => (prev ? { ...prev, userTypes: { ...prev.userTypes, [id]: type } } : prev))

  const toggleConfirm = (id: string, value: boolean) =>
    setState((prev) => (prev ? { ...prev, confirmed: { ...prev.confirmed, [id]: value } } : prev))

  const confirmAllSegments = () =>
    setState((prev) => {
      if (!prev) return prev
      const confirmed = { ...prev.confirmed }
      for (const id of Object.keys(confirmed)) if (!prev.removed[id]) confirmed[id] = true
      return { ...prev, confirmed }
    })

  const toggleRemove = (id: string) =>
    setState((prev) =>
      prev ? { ...prev, removed: { ...prev.removed, [id]: !prev.removed[id] } } : prev,
    )

  const resolve = (contradictionId: string, res: Resolution) =>
    setState((prev) =>
      prev ? { ...prev, resolutions: { ...prev.resolutions, [contradictionId]: res } } : prev,
    )

  const clarity = useMemo(
    () => (scenario && state ? buildClarity(scenario, state) : null),
    [scenario, state],
  )

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="logo">🧶</span>
          <div>
            <h1>Untangle<span className="brand-cn"> · 思绪解结</span></h1>
            <p className="tagline">把一段口述乱麻，整理成一张你亲自确认过的思路卡</p>
          </div>
        </div>
        <a
          className="ph-note"
          href="https://www.producthunt.com/products/willow-voice"
          target="_blank"
          rel="noreferrer"
        >
          灵感源自 2026-07-09 radar 的语音信号 · 但不做「口述即输入」
        </a>
      </header>

      {scenario && <StepBar step={step} />}

      <main className="content">
        {step === 'intake' && (
          <Intake
            scenarios={SCENARIOS}
            selected={scenario}
            onChoose={chooseScenario}
            onProceed={() => setStep('untangle')}
          />
        )}

        {step === 'untangle' && scenario && state && (
          <UntangleBoard
            scenario={scenario}
            state={state}
            onSetType={setType}
            onToggleConfirm={toggleConfirm}
            onToggleRemove={toggleRemove}
            onConfirmAll={confirmAllSegments}
            onResolve={resolve}
            onBack={() => setStep('intake')}
            onProceed={() => setStep('card')}
          />
        )}

        {step === 'card' && scenario && clarity && (
          <ClarityCard
            scenario={scenario}
            clarity={clarity}
            onBack={() => setStep('untangle')}
            onReset={reset}
          />
        )}
      </main>

      <footer className="footer">
        <p>
          纯前端演示 Demo · 无登录 / 无数据库 / 无外部 API · 「口述」为脚本化模拟、分析结果为
          <b> 示例标注</b>（真实版由模型实时生成）。产品创新点：语音不是更快的键盘，是边想边说的白板。
        </p>
      </footer>
    </div>
  )
}
