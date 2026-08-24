import { useState } from 'react';
import { Sandbox } from './components/Sandbox';
import { Compare } from './components/Compare';
import { Method } from './components/Method';

type Tab = 'sandbox' | 'compare' | 'method';

const TABS: { id: Tab; label: string }[] = [
  { id: 'sandbox', label: '沙盘' },
  { id: 'compare', label: '架构对比' },
  { id: 'method', label: '方法论 & 透明度' },
];

export default function App() {
  const [tab, setTab] = useState<Tab>('sandbox');

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="logo">算</span>
          <div>
            <h1>召算 Zhàosuàn</h1>
            <p className="subtitle">「AI 员工」运行时成本 × 毛利推演沙盘 · 厂商中立 · 上线前决策</p>
          </div>
        </div>
        <nav className="tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={tab === t.id ? 'active' : ''}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      <div className="pitch">
        给 agent 配「电脑」的成本是<b>用量驱动</b>，定价却常是<b>平价订阅</b>——错配会让毛利在某个用户规模断崖转负。
        在写第一行基础设施代码前，先把账算清、把架构选对。
      </div>

      <main className="content">
        {tab === 'sandbox' && <Sandbox />}
        {tab === 'compare' && <Compare />}
        {tab === 'method' && <Method />}
      </main>

      <footer className="foot">
        纯前端确定性 mock 沙盘 · 不运行 agent / 不接云 / 不接 LLM / 无真实报价 ·
        参考信号来自 product-hunt-radar 2026-08-24（Construct Computer 等）· 演示的是创新决策沙盘，非任何产品克隆。
      </footer>
    </div>
  );
}
