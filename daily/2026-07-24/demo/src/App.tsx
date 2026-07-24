import { useState } from 'react';
import DriveView from './components/DriveView';
import SentinelView from './components/SentinelView';
import LedgerView from './components/LedgerView';

type Tab = 'drive' | 'sentinel' | 'ledger';

const TABS: { id: Tab; label: string; hint: string }[] = [
  { id: 'drive', label: '共享盘', hint: '工件 · 依赖 · 契约' },
  { id: 'sentinel', label: '漂移哨兵', hint: '核心 · before/after' },
  { id: 'ledger', label: '契约台账', hint: '契约 · 漂移历史' },
];

export default function App() {
  const [tab, setTab] = useState<Tab>('drive');
  const [selected, setSelected] = useState<string[]>(['unit']);

  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">榫卯</span>
          <span className="brand-en">TENON</span>
        </div>
        <span className="tagline">多 agent 共享工件的「接口契约 + 漂移哨兵」</span>
        <span className="brand-right">rev.1 · mock demo</span>
      </header>

      <nav className="tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`tab ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            <span className="tab-label">{t.label}</span>
            <span className="tab-hint">{t.hint}</span>
          </button>
        ))}
      </nav>

      <main className="main">
        {tab === 'drive' && <DriveView />}
        {tab === 'sentinel' && <SentinelView selected={selected} toggle={toggle} />}
        {tab === 'ledger' && <LedgerView selected={selected} />}
      </main>

      <footer className="footer">
        榫卯 Tenon · product-opportunity-lab 每日机会 Demo（2026-07-24）· 纯前端静态演示，数据全为 mock<br />
        灵感来自当日报告 A 类趋势 #2「多 agent 共享文件系统（Blaxel Agent Drive）」——但不照抄：
        Blaxel 给管道，榫卯给「管道里工件彼此契合」的保证；亦区别于 valv/Kastra/HOL Guard 的动作授权治理栈。
      </footer>
    </div>
  );
}
