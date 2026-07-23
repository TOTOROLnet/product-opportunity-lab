import { useMemo, useState } from 'react';
import type { SignatureId } from './types';
import { baseline, diagnose, topSignatures } from './logic/engine';
import { DiagnosisView } from './components/DiagnosisView';
import { MovesView } from './components/MovesView';
import { ProgressView } from './components/ProgressView';

type Tab = 'diagnosis' | 'moves' | 'progress';

const TABS: { id: Tab; label: string; hint: string }[] = [
  { id: 'diagnosis', label: '① 诊断台', hint: '你反复犯的失手' },
  { id: 'moves', label: '② 招式库', hint: '针对你的破解招 + 复盘' },
  { id: 'progress', label: '③ 长进', hint: '掌握后的 before/after' },
];

export default function App() {
  const base = useMemo(() => baseline(), []);
  const [mastered, setMastered] = useState<Set<SignatureId>>(new Set());
  const [tab, setTab] = useState<Tab>('diagnosis');
  const [selected, setSelected] = useState<SignatureId>(() => topSignatures(1)[0]);

  const live = useMemo(() => diagnose(mastered), [mastered]);

  const openMove = (id: SignatureId) => {
    setSelected(id);
    setTab('moves');
  };

  const toggleMaster = (id: SignatureId) => {
    setMastered((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">上手</span>
          <span className="brand-en">Knack</span>
        </div>
        <div className="tagline">从你自己的「失手」里，练出用 AI 的手感</div>
        <div className="brand-right">AI 用法教练 · 行为诊断优先</div>
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
        <div className="tabs-spacer" />
        <div className="mastered-count">已掌握 {mastered.size}/{base.perSignature.length} 招</div>
      </nav>

      <main className="main">
        {tab === 'diagnosis' && (
          <DiagnosisView base={base} live={live} mastered={mastered} onOpenMove={openMove} />
        )}
        {tab === 'moves' && (
          <MovesView
            live={live}
            selected={selected}
            mastered={mastered}
            onSelect={setSelected}
            onToggleMaster={toggleMaster}
          />
        )}
        {tab === 'progress' && (
          <ProgressView base={base} live={live} mastered={mastered} onGoMoves={() => setTab('moves')} />
        )}
      </main>

      <footer className="footer">
        上手 Knack · 纯前端静态 Demo（Vite + React + TS）· 数据为 mock、诊断由确定性引擎本地计算 ·
        不接后端 / LLM / 支付 / 登录 / 外部 API · rev.1
      </footer>
    </div>
  );
}
