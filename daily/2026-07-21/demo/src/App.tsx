import { useMemo, useState } from 'react';
import { initSession, type SessionState } from './logic/engine';
import Cockpit from './components/Cockpit';
import Ladder from './components/Ladder';
import Compare from './components/Compare';

type Tab = 'cockpit' | 'ladder' | 'compare';

const TABS: { id: Tab; label: string; hint: string }[] = [
  { id: 'cockpit', label: '① 审阅台', hint: '逐条处置 agent 动作，把重复的养成自动' },
  { id: 'ladder', label: '② 信任阶梯', hint: '每个类目的信任阶与可撤销策略' },
  { id: 'compare', label: '③ 价值对比', hint: '全人工闸门 vs 信任阶梯（实测）' },
];

export default function App() {
  const [tab, setTab] = useState<Tab>('cockpit');
  const [session, setSession] = useState<SessionState>(() => initSession());
  const reset = useMemo(() => () => setSession(initSession()), []);

  return (
    <div className="app">
      <header className="masthead">
        <div className="masthead-inner">
          <div className="brand">
            <span className="brand-mark">▚</span>
            <div>
              <h1>信任阶梯 · TrustLadder</h1>
              <p className="tagline">Agent 写权限的渐进授权层 —— 把「批准/拒绝」编译成可撤销的分级自动放行</p>
            </div>
          </div>
          <div className="masthead-meta">
            <span className="pill">2026-07-21 每日机会 Demo</span>
            <span className="pill pill-ghost">纯前端 · mock 数据 · 无后端/LLM</span>
          </div>
        </div>
        <nav className="tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`tab ${tab === t.id ? 'tab-active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              <span className="tab-label">{t.label}</span>
              <span className="tab-hint">{t.hint}</span>
            </button>
          ))}
        </nav>
      </header>

      <main className="stage">
        {tab === 'cockpit' && (
          <Cockpit session={session} setSession={setSession} reset={reset} goCompare={() => setTab('compare')} />
        )}
        {tab === 'ladder' && <Ladder session={session} setSession={setSession} />}
        {tab === 'compare' && <Compare />}
      </main>

      <footer className="foot">
        <p>
          灵感来自 product-hunt-radar 2026-07-21 报告的「自主 ops agent · 审批+审计」趋势（Rex / Nautis / Lunen 等，均为报告事实）。
          本 Demo 是**独立创新切入点**：把「信任一格一格挣」做成可运行的状态机——
          <strong>非任何产品的克隆</strong>。所有数据为 mock、时间线脚本化。
        </p>
      </footer>
    </div>
  );
}
