import { useCallback, useState } from 'react';
import { TRAJECTORY } from './data/trajectory';
import { Explainer } from './components/Explainer';
import { FoldDesk } from './components/FoldDesk';
import { Replay } from './components/Replay';

type Tab = 'how' | 'desk' | 'replay';

const TABS: { id: Tab; label: string; hint: string }[] = [
  { id: 'how', label: '① 原理', hint: '压缩为何让 Agent 跑偏' },
  { id: 'desk', label: '② 折叠台', hint: '看压缩扔了什么 · 钉保命清单' },
  { id: 'replay', label: '③ 回放', hint: '默认 vs 带清单 · 结局对比' },
];

export default function App() {
  const [tab, setTab] = useState<Tab>('how');
  const [pinned, setPinned] = useState<Set<string>>(new Set());

  const togglePin = useCallback((id: string) => {
    setPinned((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const pinAll = useCallback((ids: string[]) => {
    setPinned((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.add(id));
      return next;
    });
  }, []);

  const clearPins = useCallback(() => setPinned(new Set()), []);

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand__logo">痕</span>
          <div className="brand__txt">
            <div className="brand__name">留痕 Liúhén</div>
            <div className="brand__tag">Agent 上下文压缩(compaction)的折叠差异 + 保命清单审计台</div>
          </div>
        </div>
        <nav className="tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`tab ${tab === t.id ? 'tab--active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              <span className="tab__label">{t.label}</span>
              <span className="tab__hint">{t.hint}</span>
            </button>
          ))}
        </nav>
        <div className="pin-indicator" title="当前保命清单条目数">
          📌 保命清单 <b>{pinned.size}</b>
        </div>
      </header>

      <main className="main">
        {tab === 'how' && <Explainer onStart={() => setTab('desk')} />}
        {tab === 'desk' && (
          <FoldDesk
            traj={TRAJECTORY}
            pinned={pinned}
            onTogglePin={togglePin}
            onPinAll={pinAll}
            onClearPins={clearPins}
          />
        )}
        {tab === 'replay' && <Replay traj={TRAJECTORY} pinnedList={[...pinned]} />}
      </main>

      <footer className="footer">
        纯前端静态 Demo · 确定性 mock 引擎 · 不接后端 / LLM / 真实上下文 / 数据库 / 支付 / 密钥 / 登录 / 外部 API ·
        演示的是买方侧、厂商中立的「压缩审计 + 控制面」创新切入点，非任何现有产品克隆。
      </footer>
    </div>
  );
}
