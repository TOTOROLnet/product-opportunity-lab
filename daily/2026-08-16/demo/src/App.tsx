import { useMemo, useState } from 'react';
import type { Policy, RulePref, ToolCategory } from './types';
import { ACTIONS, BALANCED, BASELINE, PRESETS, clonePolicy } from './data/mock';
import { runPolicy } from './engine';
import PolicyDesk from './components/PolicyDesk';
import Replay from './components/Replay';
import BlastRadius from './components/BlastRadius';
import { Delta } from './components/shared';

type Tab = 'desk' | 'replay' | 'blast';

export default function App() {
  const [tab, setTab] = useState<Tab>('desk');
  const [policy, setPolicy] = useState<Policy>(() => clonePolicy(BALANCED));

  const { verdicts, scorecard } = useMemo(() => runPolicy(ACTIONS, policy), [policy]);
  const baseline = useMemo(() => runPolicy(ACTIONS, BASELINE).scorecard, []);

  function applyPreset(name: 'loose' | 'balanced' | 'strict') {
    setPolicy(clonePolicy(PRESETS[name]));
  }
  function update(patch: Partial<Policy>) {
    setPolicy((p) => ({ ...p, ...patch, preset: 'custom' }));
  }
  function updateCategory(cat: ToolCategory, pref: RulePref) {
    setPolicy((p) => ({
      ...p,
      preset: 'custom',
      categoryRules: { ...p.categoryRules, [cat]: pref },
    }));
  }

  const overBudget = scorecard.reviewLoad > scorecard.reviewBudget;

  const tabs: { id: Tab; label: string }[] = [
    { id: 'desk', label: '① 策略台' },
    { id: 'replay', label: '② 回放' },
    { id: 'blast', label: '③ 爆炸半径 & 盲区' },
  ];

  return (
    <div className="app">
      <header className="app-head">
        <div className="brand">
          <span className="logo">🚦</span>
          <div>
            <h1>
              闸口 <span className="pinyin">Zhākǒu</span>
            </h1>
            <p className="tagline">Agent 动作策略的「爆炸半径」上线前预演台 —— 不拦真实动作，帮你把策略调对</p>
          </div>
        </div>
        <nav className="tabs">
          {tabs.map((t) => (
            <button key={t.id} className={tab === t.id ? 'tab-btn on' : 'tab-btn'} onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      <div className="metrics-bar">
        <div className="metric">
          <span className="m-label">爆炸半径</span>
          <span className="m-num">{scorecard.blastRadius}</span>
          <span className="m-delta">
            <Delta value={scorecard.blastRadius - baseline.blastRadius} />
          </span>
        </div>
        <div className="metric">
          <span className="m-label">漏网不可逆/敏感</span>
          <span className={`m-num ${scorecard.leakedCount > 0 ? 'danger' : 'ok'}`}>
            {scorecard.leakedCount}
          </span>
          <span className="m-delta">
            <Delta value={scorecard.leakedCount - baseline.leakedCount} />
          </span>
        </div>
        <div className="metric">
          <span className="m-label">人审负载/预算</span>
          <span className={`m-num ${overBudget ? 'warn' : 'ok'}`}>
            {scorecard.reviewLoad}/{scorecard.reviewBudget}
          </span>
          <span className="m-delta">{overBudget ? '超预算' : '预算内'}</span>
        </div>
        <div className="metric">
          <span className="m-label">策略盲区</span>
          <span className={`m-num ${scorecard.gaps > 0 ? 'warn' : 'ok'}`}>{scorecard.gaps}</span>
          <span className="m-delta">无规则命中</span>
        </div>
        <div className="metric route-mini">
          <span className="rm allow">✅ {scorecard.allow}</span>
          <span className="rm review">🙋 {scorecard.review}</span>
          <span className="rm deny">⛔ {scorecard.deny}</span>
        </div>
      </div>

      <main>
        {tab === 'desk' && (
          <PolicyDesk
            policy={policy}
            onPreset={applyPreset}
            onUpdate={update}
            onCategory={updateCategory}
            onGoReplay={() => setTab('replay')}
          />
        )}
        {tab === 'replay' && <Replay verdicts={verdicts} onGoBlast={() => setTab('blast')} />}
        {tab === 'blast' && (
          <BlastRadius verdicts={verdicts} scorecard={scorecard} baseline={baseline} />
        )}
      </main>

      <footer className="app-foot">
        <span>
          纯前端静态 Demo · 全 mock · 确定性护栏引擎（不接 LLM / 真实 agent 运行时 / 后端 / 数据库 / 支付 / 外部 API）
        </span>
        <span className="muted">
          演示的是「设计期策略预演」这一创新切入点，非 Phinq(运行时守卫) 的克隆
        </span>
      </footer>
    </div>
  );
}
