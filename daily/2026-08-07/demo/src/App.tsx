import { useMemo, useState } from 'react';
import { scenario } from './data/scenario';
import { reconcile } from './logic/reconcile';
import { Overview } from './components/Overview';
import { Ledger } from './components/Ledger';
import { Brief } from './components/Brief';

type View = 'overview' | 'ledger' | 'brief';

const NAV: { id: View; step: string; label: string }[] = [
  { id: 'overview', step: '①', label: '复跑总览' },
  { id: 'ledger', step: '②', label: '世界重校' },
  { id: 'brief', step: '③', label: '复跑简报' },
];

export default function App() {
  const [view, setView] = useState<View>('overview');
  const [overrides, setOverrides] = useState<Set<string>>(new Set());

  const result = useMemo(() => reconcile(scenario, overrides), [overrides]);

  const toggle = (id: string) =>
    setOverrides((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const resetAll = () => setOverrides(new Set());
  const alignAll = () =>
    setOverrides(new Set(scenario.assumptions.map((a) => a.id)));

  return (
    <div className="app">
      <header className="masthead">
        <div className="logo">🧭</div>
        <div>
          <h1>归位 Guīwèi</h1>
          <p className="tagline">
            长任务 Agent 复跑前的「世界重校安检台」——在按 append-only 日志原地续跑之前，
            把 Agent 记得的世界与现在的世界逐条对齐，算漂移、给裁决，决定该不该续。
          </p>
          <div className="claim">
            <b>回放还原 Agent，归位还原「续跑是否安全」。</b>
            Muse Code 式的日志能精确重建 Agent 内部状态，却默认世界静止；归位把世界漂移变成可见、可裁决的一等公民。
          </div>
        </div>
      </header>

      <nav className="nav">
        {NAV.map((n) => (
          <button
            key={n.id}
            className={view === n.id ? 'active' : ''}
            onClick={() => setView(n.id)}
          >
            <span className="step-no">{n.step}</span>
            {n.label}
          </button>
        ))}
      </nav>

      {view === 'overview' && (
        <Overview
          scenario={scenario}
          result={result}
          onNaive={() => setView('brief')}
          onGated={() => setView('ledger')}
        />
      )}
      {view === 'ledger' && (
        <Ledger
          scenario={scenario}
          result={result}
          onToggle={toggle}
          onResetAll={resetAll}
          onAlignAll={alignAll}
        />
      )}
      {view === 'brief' && <Brief scenario={scenario} result={result} />}

      <div className="mock-note">
        ⚠ 纯前端 Demo：全部 T0/T1 世界快照与探测结果均为 mock，不读取任何真实 Git/CI/DB/工单，无后端 / LLM / 数据库 / 登录 / 支付 / 外部 API。演示的是「复跑前世界重校」这一创新切入点，与 Muse Code（恢复引擎）目标函数相反，非照抄。
      </div>

      <footer className="footer">
        归位 Guīwèi · product-opportunity-lab · 2026-08-07 · 抽象基础设施机会 → 模拟体验 + 价值可视化
      </footer>
    </div>
  );
}
