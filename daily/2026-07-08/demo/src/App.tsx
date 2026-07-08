import { useMemo, useState } from 'react'
import type { CaseResult } from './types'
import { SCENARIOS, getScenario } from './data/scenarios'
import { computeCase } from './logic/analyze'
import { formatMoney } from './logic/format'
import { Intake } from './components/Intake'
import { StrengthMeter } from './components/StrengthMeter'
import { CompensationBreakdown } from './components/CompensationBreakdown'
import { RegulationCards } from './components/RegulationCards'
import { EscalationLadder } from './components/EscalationLadder'
import { TrustAudit, type AuditEntry } from './components/TrustAudit'

type View = 'intake' | 'case'

function now(): string {
  return new Date().toLocaleTimeString('zh-CN', { hour12: false })
}

export default function App() {
  const [view, setView] = useState<View>('intake')
  const [scenarioId, setScenarioId] = useState<string>(SCENARIOS[0].id)
  const [values, setValues] = useState<Record<string, string>>({})
  const [result, setResult] = useState<CaseResult | null>(null)

  const [doneCount, setDoneCount] = useState(0)
  const [redacted, setRedacted] = useState<Set<string>>(new Set())
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([])
  const auditId = useMemo(() => ({ n: 0 }), [])

  const dataLabels = useMemo(() => {
    if (!result) return []
    const set = new Set<string>()
    result.ladder.forEach((s) => s.dataShared.forEach((d) => set.add(d)))
    return Array.from(set)
  }, [result])

  function log(text: string, tone: AuditEntry['tone']) {
    auditId.n += 1
    setAuditLog((prev) => [...prev, { id: auditId.n, time: now(), text, tone }])
  }

  function handleSelectScenario(id: string) {
    setScenarioId(id)
    setValues({})
  }

  function handleChangeField(key: string, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  function handleFillExample() {
    const scenario = getScenario(scenarioId)
    if (!scenario) return
    const next: Record<string, string> = {}
    scenario.fields.forEach((f) => {
      next[f.key] = f.example
    })
    setValues(next)
  }

  function handleSubmit() {
    const res = computeCase(scenarioId, values)
    if (!res) return
    setResult(res)
    setDoneCount(0)
    setRedacted(new Set())
    auditId.n = 0
    setAuditLog([
      {
        id: 0,
        time: now(),
        text: `已生成「${res.scenarioName}」案卷：强度 ${res.strength}/100，预估可主张 ${formatMoney(res.currency, res.total)}。`,
        tone: 'info',
      },
    ])
    setView('case')
    window.scrollTo({ top: 0 })
  }

  function handleAdvance() {
    if (!result) return
    const step = result.ladder[doneCount]
    if (!step) return
    setDoneCount((c) => c + 1)
    log(`第 ${step.rung} 级「${step.channel}」标记为已由本人发送 / 已回复（筹码 ${step.leverage}）。`, 'action')
  }

  function handleToggleRedact(label: string) {
    setRedacted((prev) => {
      const next = new Set(prev)
      if (next.has(label)) {
        next.delete(label)
        log(`恢复共享数据字段：${label}。`, 'privacy')
      } else {
        next.add(label)
        log(`已脱敏数据字段：${label}（将从后续话术 / 表单中移除）。`, 'privacy')
      }
      return next
    })
  }

  function handleReset() {
    setView('intake')
    setResult(null)
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand" onClick={handleReset} role="button" tabIndex={0}>
          <span className="logo">🪜</span>
          <span className="brand-name">ClaimLadder<em>追偿阶梯</em></span>
        </div>
        <div className="topbar-right">
          {view === 'case' ? (
            <button className="ghost-btn" type="button" onClick={handleReset}>
              ← 重新立案
            </button>
          ) : (
            <span className="topbar-note">纯前端 Demo · 数据全为示例 · 不接后端 / API</span>
          )}
        </div>
      </header>

      <main className="content">
        {view === 'intake' && (
          <Intake
            scenarioId={scenarioId}
            values={values}
            onSelectScenario={handleSelectScenario}
            onChangeField={handleChangeField}
            onFillExample={handleFillExample}
            onSubmit={handleSubmit}
          />
        )}

        {view === 'case' && result && (
          <div className="case-view">
            <section className="case-hero">
              <div className="case-hero-left">
                <div className="pill small">你的案卷 · {result.scenarioName}</div>
                <div className="big-total">
                  <span className="bt-label">预估可主张</span>
                  <span className="bt-amount">{formatMoney(result.currency, result.total)}</span>
                </div>
                <p className="ai-note">
                  🤖 本案卷的分类、法规匹配、金额测算与话术，在真实产品中由 LLM 基于规则库生成；
                  本 Demo 用<strong>离线确定性规则</strong>模拟，保证可复现、不误导。
                </p>
              </div>
              <div className="case-hero-right">
                <StrengthMeter
                  strength={result.strength}
                  verdict={result.strengthVerdict}
                  factors={result.strengthFactors}
                />
              </div>
            </section>

            <section className="two-col">
              <CompensationBreakdown currency={result.currency} lines={result.lines} total={result.total} />
              <RegulationCards regulations={result.regulations} />
            </section>

            {result.notes.length > 0 && (
              <section className="notes">
                <h4>⚠️ 需要留意</h4>
                <ul>
                  {result.notes.map((n, i) => (
                    <li key={i}>{n}</li>
                  ))}
                </ul>
              </section>
            )}

            <EscalationLadder
              steps={result.ladder}
              doneCount={doneCount}
              redacted={redacted}
              onAdvance={handleAdvance}
            />

            <TrustAudit
              dataLabels={dataLabels}
              redacted={redacted}
              onToggle={handleToggleRedact}
              auditLog={auditLog}
            />
          </div>
        )}
      </main>

      <footer className="footer">
        <p>
          ClaimLadder 是「product-opportunity-lab」的每日机会 Demo（2026-07-08）。灵感源自 Product Hunt 雷达对
          AirKaren 的观察，但切入点相反：<strong>不做黑箱全自动代办，而做透明、你做主的维权副驾</strong>。
        </p>
        <p className="fine">
          全部规则、金额、法规引用均为<strong>演示用示例</strong>，不构成法律意见。纯前端静态站点，无登录 / 数据库 / 支付 / 外部 API。
        </p>
      </footer>
    </div>
  )
}
