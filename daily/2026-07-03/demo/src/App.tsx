import { useMemo, useState } from 'react'
import type { AgentAction, Policy, PolicyMode, Verdict } from './types'
import { initialActions, initialPolicies } from './data/mockData'
import Inbox from './components/Inbox'
import DecisionDetail from './components/DecisionDetail'
import Policies from './components/Policies'

type View = 'inbox' | 'policies'

const WEEKLY_AUTO_BASE = 37 // mock: 本周已被既有策略自动处理的动作数

function derivePolicy(action: AgentAction): Policy {
  let rule = `同类动作（${action.tool}）默认需人工审批`
  let mode: PolicyMode = 'needs_approval'
  switch (action.tool) {
    case 'postgres.query':
      rule = '不带 LIMIT 或软删除的批量 DELETE 一律拦截'
      mode = 'block'
      break
    case 'stripe.refunds.create':
      rule = '单笔退款 > $4,000 需人工审批'
      mode = 'needs_approval'
      break
    case 'resend.batch.send':
      rule = '群发触达量 > 5,000 需人工审批'
      mode = 'needs_approval'
      break
  }
  return {
    id: `pol-${action.id}`,
    rule,
    mode,
    source: 'auto',
    origin: `源自今天对「${action.title}」的拒绝`,
  }
}

const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '')
const initialView: View = params.get('view') === 'policies' ? 'policies' : 'inbox'
const initialSelected = params.get('action')

export default function App() {
  const [actions, setActions] = useState<AgentAction[]>(initialActions)
  const [policies, setPolicies] = useState<Policy[]>(initialPolicies)
  const [view, setView] = useState<View>(initialView)
  const [selectedId, setSelectedId] = useState<string | null>(initialSelected)
  const [decidedCount, setDecidedCount] = useState(0)
  const [autoHandled, setAutoHandled] = useState(WEEKLY_AUTO_BASE)

  const selected = actions.find((a) => a.id === selectedId) ?? null
  const pendingCount = actions.filter((a) => a.status === 'pending').length

  const avgDecisionSec = useMemo(() => (decidedCount === 0 ? 0 : 9), [decidedCount])

  function handleVerdict(id: string, verdict: Verdict, createPolicy: boolean) {
    setActions((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: verdict } : a)),
    )
    setDecidedCount((c) => c + 1)
    if (verdict === 'rejected' && createPolicy) {
      const action = actions.find((a) => a.id === id)
      if (action) {
        setPolicies((prev) =>
          prev.some((p) => p.id === `pol-${action.id}`) ? prev : [derivePolicy(action), ...prev],
        )
        setAutoHandled((n) => n + 1)
      }
    }
    setSelectedId(null)
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">§</span>
          <div>
            <div className="brand-name">Gavel</div>
            <div className="brand-sub">Agent 动作审批驾驶舱</div>
          </div>
        </div>

        <nav className="nav">
          <button className={view === 'inbox' ? 'active' : ''} onClick={() => setView('inbox')}>
            收件箱{pendingCount > 0 && <span className="badge">{pendingCount}</span>}
          </button>
          <button className={view === 'policies' ? 'active' : ''} onClick={() => setView('policies')}>
            策略与学习
          </button>
        </nav>

        <div className="metrics">
          <div className="metric"><span className="m-num">{pendingCount}</span><span className="m-label">待裁决</span></div>
          <div className="metric"><span className="m-num">{decidedCount}</span><span className="m-label">今日已裁决</span></div>
          <div className="metric"><span className="m-num">{avgDecisionSec}s</span><span className="m-label">平均耗时</span></div>
          <div className="metric"><span className="m-num">{autoHandled}</span><span className="m-label">本周策略自动处理</span></div>
        </div>
      </header>

      <main className="content">
        {view === 'inbox' ? (
          <Inbox actions={actions} onSelect={setSelectedId} />
        ) : (
          <Policies policies={policies} />
        )}
      </main>

      {selected && (
        <DecisionDetail action={selected} onClose={() => setSelectedId(null)} onVerdict={handleVerdict} />
      )}

      <footer className="app-foot">
        纯前端 Demo · 数据均为 mock · Product Opportunity Lab / 2026-07-03
      </footer>
    </div>
  )
}
