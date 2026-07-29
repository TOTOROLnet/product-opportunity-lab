import { useMemo, useState } from 'react';
import type { PatchId } from './types';
import { GOLDEN_SET, DEFAULT_THRESHOLD, PATCHES } from './data/goldenSet';
import { evaluate, recommendedThreshold } from './logic/engine';
import CalibrateView from './components/CalibrateView';
import DisagreementsView from './components/DisagreementsView';
import VerdictView from './components/VerdictView';

type Tab = 'calibrate' | 'disagreements' | 'verdict';

const TABS: { id: Tab; label: string; hint: string }[] = [
  { id: 'calibrate', label: '① 校准台', hint: '拨阈值 · 看混淆矩阵与代价' },
  { id: 'disagreements', label: '② 分歧', hint: '判官≠人类 · 打失败模式补丁' },
  { id: 'verdict', label: '③ 出厂判定', hint: '朴素上线 vs 准星校准' },
];

const ALL_PATCHES: PatchId[] = ['dekeyword', 'injection'];

export default function App() {
  const [tab, setTab] = useState<Tab>('calibrate');
  const [threshold, setThreshold] = useState<number>(DEFAULT_THRESHOLD);
  const [patches, setPatches] = useState<Set<PatchId>>(new Set());

  const metrics = useMemo(
    () => evaluate(GOLDEN_SET, threshold, patches),
    [threshold, patches],
  );

  function togglePatch(id: PatchId) {
    setPatches((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function applyRecommendation() {
    const next = new Set<PatchId>(ALL_PATCHES);
    setPatches(next);
    setThreshold(recommendedThreshold(GOLDEN_SET, next));
    setTab('verdict');
  }

  const patchCount = patches.size;

  return (
    <div className="app">
      <header className="masthead">
        <div className="brand">
          <div className="logo" aria-hidden>
            <svg viewBox="0 0 100 100" width="40" height="40">
              <circle cx="50" cy="50" r="30" fill="none" stroke="#4f46e5" strokeWidth="6" />
              <line x1="50" y1="8" x2="50" y2="30" stroke="#4f46e5" strokeWidth="6" />
              <line x1="50" y1="70" x2="50" y2="92" stroke="#4f46e5" strokeWidth="6" />
              <line x1="8" y1="50" x2="30" y2="50" stroke="#4f46e5" strokeWidth="6" />
              <line x1="70" y1="50" x2="92" y2="50" stroke="#4f46e5" strokeWidth="6" />
              <circle cx="50" cy="50" r="5" fill="#dc2626" />
            </svg>
          </div>
          <div className="brand-text">
            <h1>
              准星 <span className="pinyin">Zhǔnxīng</span>
            </h1>
            <p className="tagline">运行时 LLM 判官的「归零校准台」</p>
          </div>
        </div>
        <div className="pitch">
          <p>
            评估驱动执行（拦 / 批 / <b>杀</b>）——那 <b>谁来评估评估者？</b>
            在把 LLM 判官接到运行时开火之前，先用你自己的争议案例给它归零。
          </p>
          <div className="chips">
            <span className="chip chip-mock">mock 数据 · 确定性引擎</span>
            <span className="chip chip-mock">非真实模型推断</span>
            <span className="chip chip-mock">准星不下达任何运行时动作</span>
          </div>
        </div>
      </header>

      <nav className="tabs" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            className={`tab ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            <span className="tab-label">{t.label}</span>
            <span className="tab-hint">{t.hint}</span>
          </button>
        ))}
        <div className="tab-status">
          <span>
            阈值 <b>{threshold}</b>
          </span>
          <span>
            补丁 <b>{patchCount}/{PATCHES.length}</b>
          </span>
        </div>
      </nav>

      <main className="content">
        {tab === 'calibrate' && (
          <CalibrateView
            threshold={threshold}
            setThreshold={setThreshold}
            patches={patches}
            metrics={metrics}
            onApplyRecommendation={applyRecommendation}
          />
        )}
        {tab === 'disagreements' && (
          <DisagreementsView
            threshold={threshold}
            patches={patches}
            togglePatch={togglePatch}
            metrics={metrics}
          />
        )}
        {tab === 'verdict' && <VerdictView onApply={applyRecommendation} />}
      </main>

      <footer className="foot">
        <span>
          准星 Zhǔnxīng · 产品机会实验室 Demo（2026-07-29）· 元评估 / 校准层，坐在「评估即执行」上游
        </span>
        <span className="foot-note">
          全部为 mock 争议案例与确定性统计替身，非真实 LLM 判官推断；准星只校准判官，不接管业务、不下达 block/kill。
        </span>
      </footer>
    </div>
  );
}
