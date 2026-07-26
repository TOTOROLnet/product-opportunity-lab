import { useState } from 'react';
import ReplayView from './components/ReplayView';
import ForkpointView from './components/ForkpointView';
import LedgerView from './components/LedgerView';
import { SESSION_META } from './data/session';

type Tab = 'replay' | 'fork' | 'ledger';

const TABS: { id: Tab; label: string; num: string }[] = [
  { id: 'replay', label: '会话回放', num: '01' },
  { id: 'fork', label: '岔口纠偏', num: '02' },
  { id: 'ledger', label: '归因台账', num: '03' },
];

export default function App() {
  const [tab, setTab] = useState<Tab>('replay');

  return (
    <div className="app">
      <header className="header">
        <div className="brand">
          <h1>
            岔口 <span className="en">Forkpoint</span>
          </h1>
          <p>
            面向可续跑 / 可分叉 agent 会话的「时间旅行归因 + 纠偏分叉」调试台。给一次给出「看起来对但错」结论的
            agent 会话，自动揪出决定错误结论的那 1 个折返步，从该步 fork 一条纠偏轨迹 + 确定性重放，证明「修这一步→结论翻转」。
          </p>
        </div>
        <div className="session-chip">
          <div className="row">
            <span>会话</span>
            <b>{SESSION_META.id}</b>
          </div>
          <div className="row">
            <span>Agent</span>
            <b>{SESSION_META.agent}</b>
          </div>
          <div className="row">
            <span>运行时</span>
            <b>可续跑事件日志</b>
          </div>
          <div className="row">
            <span>时长</span>
            <b>{SESSION_META.durationMin} min</b>
          </div>
        </div>
      </header>

      <nav className="tabs">
        {TABS.map((t) => (
          <button key={t.id} className={`tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
            <span className="num">{t.num}</span>
            {t.label}
          </button>
        ))}
      </nav>

      {tab === 'replay' && <ReplayView />}
      {tab === 'fork' && <ForkpointView />}
      {tab === 'ledger' && <LedgerView />}

      <footer className="footer">
        <div>
          岔口 Forkpoint · 纯前端静态 Demo（Vite + React + TS）· 灵感来自 2026-07-26 Product Hunt AI 雷达
          日报中 OpenComputer（可续跑 agent 运行时）等「开源自持 agent 基础设施」信号 · rev.1
        </div>
        <div className="disc">
          说明：全部为 mock 演示数据与确定性引擎，不接真实 agent 运行时 / 数据库 / 外部 API / 真实统计推断；不做诊断或投资建议。
          留存数字、p 值等均为演示用，仅用于说明「选错指标口径如何导致看似合理但错误的结论」。
        </div>
      </footer>
    </div>
  );
}
