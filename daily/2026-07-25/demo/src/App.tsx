import { useMemo, useState } from 'react';
import { TRACE_SLICES } from './data/traces';
import { analyzeSlice } from './logic/engine';
import type { SliceAnalysis } from './types';
import PortraitView from './components/PortraitView';
import DecisionView from './components/DecisionView';
import PortfolioView from './components/PortfolioView';

type Tab = 'portrait' | 'decision' | 'portfolio';

const TABS: { id: Tab; label: string; hint: string }[] = [
  { id: 'portrait', label: '① 用量画像', hint: '钱和错误集中在哪' },
  { id: 'decision', label: '② 决策台', hint: '该不该训·训哪片·数据够不够' },
  { id: 'portfolio', label: '③ 组合与产出', hint: 'before/after + 训练清单' },
];

export default function App() {
  const [tab, setTab] = useState<Tab>('portrait');
  const [selectedId, setSelectedId] = useState<string>(TRACE_SLICES[0].id);

  const analyses: SliceAnalysis[] = useMemo(() => TRACE_SLICES.map(analyzeSlice), []);
  const trainCount = analyses.filter((a) => a.isTraining).length;

  const goDecision = (id: string) => {
    setSelectedId(id);
    setTab('decision');
  };

  return (
    <div className="app">
      <header className="hero">
        <div className="hero-main">
          <div className="brand">
            <span className="brand-mark">火候</span>
            <span className="brand-en">Huohou</span>
          </div>
          <p className="tagline">
            按下「一键微调」之前，先判断 <b>该不该训 · 训哪一片 · 数据够不够 · 值不值</b>——
            并对大多数任务诚实地说「别训」。
          </p>
          <p className="subline">
            基于你已有的前沿模型调用轨迹做训练前预检。本 Demo 全部为 mock 轨迹 + 确定性引擎，
            不训练、不碰 GPU、不调任何 LLM。
          </p>
        </div>
        <div className="hero-badge">
          <div className="hb-num">{trainCount}<span>/{analyses.length}</span></div>
          <div className="hb-label">分片真正值得训练</div>
          <div className="hb-sub">其余 {analyses.length - trainCount} 片：省下训练预算</div>
        </div>
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

      <main className="content">
        {tab === 'portrait' && <PortraitView analyses={analyses} onPick={goDecision} />}
        {tab === 'decision' && (
          <DecisionView analyses={analyses} selectedId={selectedId} onSelect={setSelectedId} />
        )}
        {tab === 'portfolio' && <PortfolioView analyses={analyses} />}
      </main>

      <footer className="foot">
        <span>
          火候 Huohou · 训练前决策与数据预检台 · rev.1 · 2026-07-25 · riding Freesolo Flash（训练执行层）
          的互补上游
        </span>
        <span className="foot-note">纯前端静态 Demo · 无后端 / 无登录 / 无支付 / 无外部 API</span>
      </footer>
    </div>
  );
}
