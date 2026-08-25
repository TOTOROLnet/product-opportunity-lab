import { useMemo, useState } from 'react';
import type { Fingerprint } from './types';
import { INTENT_CARDS } from './data/intents';
import { FLEET_RUNS } from './data/runs';
import { fleetMonthlyTotal } from './lib/savings';
import { RetrievePanel } from './components/RetrievePanel';
import { RecipeView } from './components/RecipeView';
import { HowTrust } from './components/HowTrust';

type Tab = 'retrieve' | 'recipe' | 'how';

export default function App() {
  const [intentId, setIntentIdRaw] = useState(INTENT_CARDS[0].id);
  const [fingerprint, setFingerprint] = useState<Fingerprint[]>(INTENT_CARDS[0].fingerprint);
  const [fleetSize, setFleetSize] = useState(10);
  const [tab, setTab] = useState<Tab>('retrieve');
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);

  const keywords = useMemo(
    () => INTENT_CARDS.find((c) => c.id === intentId)!.keywords,
    [intentId],
  );

  function setIntentId(id: string) {
    setIntentIdRaw(id);
    const card = INTENT_CARDS.find((c) => c.id === id)!;
    setFingerprint(card.fingerprint);
  }

  function openRecipe(runId: string) {
    setSelectedRunId(runId);
    setTab('recipe');
  }

  const fleetTotal = fleetMonthlyTotal(FLEET_RUNS, fleetSize);

  return (
    <div className="app">
      <header className="header">
        <div className="logo">成</div>
        <div className="brand">
          <h1>
            现成 <span className="pinyin">Xiànchéng</span> · 跨 agent「已验证做法」检索与复用层
          </h1>
          <p>
            跑一支自治 AI agent 舰队时，别让每台「电脑」都从零重学。新任务开工前先「找现成的」：检索兄弟 agent
            是否已在相似意图 + 环境下成功做过，并把那次真实运行蒸馏成已验证、去噪、去弯路的最短配方直接复用。
            运行时之上、厂商中立 —— 纯前端确定性 mock，不跑 agent、不连运行时。
          </p>
        </div>
      </header>

      <div className="controls">
        <nav className="tabs">
          <button className={`tab ${tab === 'retrieve' ? 'active' : ''}`} onClick={() => setTab('retrieve')}>
            <span className="num">1</span>检索台
          </button>
          <button className={`tab ${tab === 'recipe' ? 'active' : ''}`} onClick={() => setTab('recipe')}>
            <span className="num">2</span>配方
          </button>
          <button className={`tab ${tab === 'how' ? 'active' : ''}`} onClick={() => setTab('how')}>
            <span className="num">3</span>来源与信任
          </button>
        </nav>

        <div className="fleet">
          <label htmlFor="fleet">舰队规模</label>
          <input
            id="fleet"
            type="range"
            min={3}
            max={50}
            step={1}
            value={fleetSize}
            onChange={(e) => setFleetSize(Number(e.target.value))}
          />
          <span className="val">{fleetSize} 台</span>
        </div>
      </div>

      {tab === 'retrieve' && (
        <RetrievePanel
          intentId={intentId}
          setIntentId={setIntentId}
          fingerprint={fingerprint}
          setFingerprint={setFingerprint}
          keywords={keywords}
          onOpenRecipe={openRecipe}
        />
      )}

      {tab === 'recipe' && (
        <RecipeView
          runId={selectedRunId}
          keywords={keywords}
          fingerprint={fingerprint}
          fleetSize={fleetSize}
          onBack={() => setTab('retrieve')}
        />
      )}

      {tab === 'how' && <HowTrust />}

      <div className="footer">
        <div className="wedge">
          现成 Xiànchéng — 骑上报告唯一新信号（Construct Computer「每个 agent 一台云电脑」/ agent 运行时层），
          但换到「跨 agent 做法复用」这一没人做的中间层，不重复昨日的成本沙盘。全部数据为 mock，检索/蒸馏为确定性模拟。
        </div>
        <div>
          舰队每月潜在节省上限（{fleetSize} 台，全 corpus）：约 <b style={{ color: 'var(--green)' }}>${fleetTotal}</b> · rev.1
        </div>
      </div>
    </div>
  );
}
