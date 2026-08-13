import { useState } from 'react';
import { LEARNER_PROFILE } from './data/mock';
import { emptyProgress } from './engine';
import type { Progress } from './types';
import PracticeTab from './components/PracticeTab';
import GapMapTab from './components/GapMapTab';
import DrillDeckTab from './components/DrillDeckTab';

type TabId = 'practice' | 'map' | 'drill';

const TABS: { id: TabId; label: string; sub: string }[] = [
  { id: 'practice', label: '今日一练', sub: 'Practice' },
  { id: 'map', label: '我的口音图谱', sub: 'Gap Map' },
  { id: 'drill', label: '补差牌组', sub: 'Drill Deck' },
];

export default function App() {
  const [tab, setTab] = useState<TabId>('practice');
  const [progress, setProgress] = useState<Progress>(emptyProgress);

  return (
    <div className="app">
      <header className="hero">
        <div className="hero-inner">
          <div className="brand">
            <div className="logo">顺</div>
            <div>
              <h1>
                顺口 <span className="pinyin">Shùnkǒu</span>
              </h1>
              <div className="tagline">母语差距教练 · Native-Gap Coach</div>
            </div>
          </div>
          <p className="pitch">
            从你的<strong>真实英文产出</strong>里，聚类出让你"不地道"的那几个<strong>反复出现的习惯</strong>，
            做成一张会随练习<strong>可见收敛</strong>的个人口音图谱，再精准补掉。
            <span className="no-phon">不碰发音 —— 只做发音之上的地道度。</span>
          </p>
          <div className="learner-chip">
            <span className="lc-dot" /> {LEARNER_PROFILE.name} · {LEARNER_PROFILE.level} · {LEARNER_PROFILE.context}
          </div>
        </div>
      </header>

      <nav className="tabs">
        {TABS.map((t) => (
          <button key={t.id} className={`tab-btn ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
            <span className="tb-label">{t.label}</span>
            <span className="tb-sub">{t.sub}</span>
          </button>
        ))}
      </nav>

      <main className="main">
        {tab === 'practice' && <PracticeTab onGoMap={() => setTab('map')} />}
        {tab === 'map' && <GapMapTab progress={progress} onGoDrill={() => setTab('drill')} />}
        {tab === 'drill' && <DrillDeckTab progress={progress} setProgress={setProgress} />}
      </main>

      <footer className="foot">
        <div className="foot-honest">
          <strong>诚实说明</strong>：这是<strong>纯前端静态 Demo</strong>。母语改写、跨样本聚类出"习惯"、按习惯生成练习，
          均由<strong>脚本化"模拟 AI 引擎" + 全 mock 语料</strong>呈现（真实产品接 LLM）；不接后端 / 数据库 / 语音 /
          登录 / 支付 / 外部 API。发音评分<strong>刻意不做</strong>（那是 ELSA/Linforge 的地盘，也非本产品切入点）。
        </div>
        <div className="foot-meta">
          顺口 Shùnkǒu · product-opportunity-lab · 2026-08-13 · 演示"把学习单位从词/音素/单句升级为你的产出习惯"
        </div>
      </footer>
    </div>
  );
}
