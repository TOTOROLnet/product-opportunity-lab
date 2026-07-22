import { useState } from 'react';
import type { Decision } from './types';
import { scenario } from './data/scenario';
import { computeSession } from './logic/engine';
import { GuardView } from './components/GuardView';
import { ImpactView } from './components/ImpactView';
import { AboutView } from './components/AboutView';

type Tab = 'guard' | 'impact' | 'about';

const recToDecision: Record<string, Decision> = {
  approve: 'approved',
  modify: 'modified',
  reject: 'rejected',
};

export default function App() {
  const [tab, setTab] = useState<Tab>('guard');
  const [selectedId, setSelectedId] = useState<string>(scenario.orders[0].id);
  const [decisions, setDecisions] = useState<Record<string, Decision>>({});

  const stats = computeSession(scenario.orders, decisions);

  const decide = (id: string, decision: Decision) => {
    setDecisions((prev) => ({ ...prev, [id]: prev[id] === decision ? 'pending' : decision }));
  };

  const acceptAll = () => {
    const next: Record<string, Decision> = {};
    for (const o of scenario.orders) next[o.id] = recToDecision[o.recommendation];
    setDecisions(next);
  };

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-shield">🛡️</span>
          <div>
            <div className="brand-name">付前一秒 CommitGuard</div>
            <div className="brand-tag">你的 AI 消费 agent 与钱包之间的成交守门人</div>
          </div>
        </div>
        <nav className="tabs">
          <button className={tab === 'guard' ? 'tab active' : 'tab'} onClick={() => setTab('guard')}>
            守门台
          </button>
          <button
            className={tab === 'impact' ? 'tab active' : 'tab'}
            onClick={() => setTab('impact')}
          >
            价值对比
            {stats.verified > 0 && <span className="tab-dot" />}
          </button>
          <button className={tab === 'about' ? 'tab active' : 'tab'} onClick={() => setTab('about')}>
            它是什么
          </button>
        </nav>
      </header>

      <div className="content">
        {tab === 'guard' && (
          <GuardView
            scenario={scenario}
            decisions={decisions}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onDecide={decide}
            onAcceptAll={acceptAll}
          />
        )}
        {tab === 'impact' && <ImpactView scenario={scenario} decisions={decisions} />}
        {tab === 'about' && <AboutView />}
      </div>

      <footer className="footer">
        纯前端静态 Demo · mock 数据 + 确定性核验引擎 · 不接真实支付 / 数据库 / 登录 / 外部 API ·
        灵感来自 2026-07-22 PH AI 雷达「transactable web」信号
      </footer>
    </div>
  );
}
