import { useMemo, useState } from 'react';
import type { PrefId, TasteProfile } from './types';
import { AGENT_PR } from './data/pr';
import { CALIBRATION_CASES } from './data/calibration';
import { computeFlips, summarize, learnTaste, hasActivePrefs } from './engine';
import { PRESETS } from './labels';
import { Explainer } from './components/Explainer';
import { Calibrator } from './components/Calibrator';
import { Compare } from './components/Compare';

type Tab = 'explain' | 'calibrate' | 'compare';

const BALANCED = PRESETS.find((p) => p.id === 'balanced')!.profile;

export default function App() {
  const [tab, setTab] = useState<Tab>('explain');
  const [taste, setTaste] = useState<TasteProfile>({ ...BALANCED });
  const [selectedChips, setSelectedChips] = useState<ReadonlySet<string>>(new Set());
  const [chipDriven, setChipDriven] = useState(false);

  const flips = useMemo(() => computeFlips(AGENT_PR, taste), [taste]);
  const summary = useMemo(() => summarize(flips), [flips]);
  const hasTaste = hasActivePrefs(taste);

  function toggleChip(chipId: string) {
    const next = new Set(selectedChips);
    if (next.has(chipId)) next.delete(chipId);
    else next.add(chipId);
    setSelectedChips(next);
    setChipDriven(next.size > 0);
    setTaste(learnTaste(next, CALIBRATION_CASES));
  }

  function setWeight(pref: PrefId, w: number) {
    setTaste({ ...taste, [pref]: w });
    setSelectedChips(new Set());
    setChipDriven(false);
  }

  function applyPreset(profile: Record<PrefId, number>) {
    setTaste({ ...profile });
    setSelectedChips(new Set());
    setChipDriven(false);
  }

  return (
    <div className="app">
      <div className="masthead">
        <div className="logo">味</div>
        <div className="title-block">
          <h1>对味 Duìwèi</h1>
          <p className="sub">让 coding agent 的「选型」对你的口味 · Taste-Calibrated Dependency Selection</p>
        </div>
      </div>

      <div className="tagline">
        当 coding agent（Origin / Cursor / Claude Code 时代）替你写代码，它会<b>悄悄替你做一连串依赖 / 库 / 工具的选型决定</b
        >。这些决定资深工程师本会反复权衡，agent 却一笔带过。对味把这些沉默的选型<b>变可读</b>、从几个例子里<b
        >学出你的口味</b>、再<b>回放去改判</b>——看它省下多少体积、避免哪些后悔。
        <div className="mock-note">
          纯前端演示：数据与「选型引擎」均为 mock / 确定性模拟，不接后端 / LLM / 真实 registry / 登录 /
          外部 API。真实产品会用 agent 自己的选型理由 + 实时 registry（npm / deps.dev）数据。
        </div>
      </div>

      <div className="tabs">
        <button className={`tab ${tab === 'explain' ? 'active' : ''}`} onClick={() => setTab('explain')}>
          <span className="idx">①</span>选型说明书
        </button>
        <button className={`tab ${tab === 'calibrate' ? 'active' : ''}`} onClick={() => setTab('calibrate')}>
          <span className="idx">②</span>口味校准
        </button>
        <button className={`tab ${tab === 'compare' ? 'active' : ''}`} onClick={() => setTab('compare')}>
          <span className="idx">③</span>对味重选
        </button>
      </div>

      {tab === 'explain' && (
        <Explainer pr={AGENT_PR} flips={flips} summary={summary} onGoCalibrate={() => setTab('calibrate')} />
      )}
      {tab === 'calibrate' && (
        <Calibrator
          cases={CALIBRATION_CASES}
          taste={taste}
          selectedChips={selectedChips}
          chipDriven={chipDriven}
          onToggleChip={toggleChip}
          onSetWeight={setWeight}
          onApplyPreset={applyPreset}
        />
      )}
      {tab === 'compare' && (
        <Compare flips={flips} summary={summary} hasTaste={hasTaste} onGoCalibrate={() => setTab('calibrate')} />
      )}

      <div className="foot">
        <b>对味 Duìwèi</b> · product-opportunity-lab 每日机会 Demo（2026-08-20）· rev.1 ·
        本页所有产品名、版本、体积、下载量、许可、维护数据均为演示用 mock，不代表真实项目现状。 骑乘信号：Gauge
        (Agent-Led Growth) / Origin by Cursor（agent-native 代码托管，产物治理）/「工具越来越是给 agent 消费」趋势。
      </div>
    </div>
  );
}
