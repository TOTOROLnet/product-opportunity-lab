import { useEffect, useMemo, useState } from 'react';
import DocView from './components/DocView';
import PatchesView from './components/PatchesView';
import SourcesView from './components/SourcesView';
import { FreshnessGauge } from './components/shared';
import { CLAIMS } from './data/claims';
import { SOURCE_MAP, SOURCES } from './data/sources';
import { BASELINE_DATE, TIMELINE, TODAY } from './data/timeline';
import { computeAll } from './logic/engine';

type Tab = 'doc' | 'sources' | 'patches';

const MAX_POS = TIMELINE.length;

export default function App() {
  const [tab, setTab] = useState<Tab>('doc');
  const [asserted, setAsserted] = useState<Record<string, number>>(() =>
    Object.fromEntries(CLAIMS.map((c) => [c.id, 0])),
  );
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [docViewPos, setDocViewPos] = useState(MAX_POS);
  const [playing, setPlaying] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // “今天”的真实鲜度（表头 + 补丁页都用它）
  const today = useMemo(
    () => computeAll(CLAIMS, SOURCE_MAP, asserted, TIMELINE, MAX_POS),
    [asserted],
  );
  // 文档回放视图（按 docViewPos 展示历史某一刻）
  const docResult = useMemo(
    () => computeAll(CLAIMS, SOURCE_MAP, asserted, TIMELINE, docViewPos),
    [asserted, docViewPos],
  );

  // 回放动画
  useEffect(() => {
    if (!playing) return;
    if (docViewPos >= MAX_POS) {
      setPlaying(false);
      return;
    }
    const t = setTimeout(() => setDocViewPos((p) => Math.min(p + 1, MAX_POS)), 950);
    return () => clearTimeout(t);
  }, [playing, docViewPos]);

  const startPlay = () => {
    setSelectedId(null);
    setDocViewPos(0);
    setPlaying(true);
  };

  const dismissed = today.computed.filter(
    (c) => dismissedIds.includes(c.claim.id) && c.status !== 'fresh',
  );
  const pendingStale = today.stale.filter((c) => !dismissedIds.includes(c.claim.id));
  const pendingManual = today.manual.filter((c) => !dismissedIds.includes(c.claim.id));

  const accept = (id: string) => {
    const c = today.computed.find((x) => x.claim.id === id);
    if (!c) return;
    setAsserted((prev) => ({ ...prev, [id]: c.currentVersionIndex }));
  };
  const acceptAllAuto = () => {
    setAsserted((prev) => {
      const next = { ...prev };
      pendingStale.forEach((c) => {
        next[c.claim.id] = c.currentVersionIndex;
      });
      return next;
    });
  };
  const resolveManual = (id: string, text: string) => {
    const c = today.computed.find((x) => x.claim.id === id);
    if (!c) return;
    setAsserted((prev) => ({ ...prev, [id]: c.currentVersionIndex }));
    setOverrides((prev) => ({ ...prev, [id]: text }));
  };
  const dismiss = (id: string) => setDismissedIds((prev) => [...new Set([...prev, id])]);
  const restore = (id: string) => setDismissedIds((prev) => prev.filter((x) => x !== id));

  const resetAll = () => {
    setAsserted(Object.fromEntries(CLAIMS.map((c) => [c.id, 0])));
    setOverrides({});
    setDismissedIds([]);
    setDocViewPos(MAX_POS);
    setPlaying(false);
    setSelectedId(null);
  };

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="logo">🌲 常青 <span className="en">Evergreen</span></span>
          <span className="tagline">活文档鲜度守护 agent · 让文档不再静默失真</span>
        </div>
        <div className="top-right">
          <div className="mini-gauge">
            <FreshnessGauge score={today.score} size={54} />
          </div>
          <div className="mini-meta">
            <div className="mini-title">文档鲜度（今天）</div>
            <div className="mini-sub">
              {today.loadBearingFresh}/{today.loadBearingTotal} 承重论断为鲜
            </div>
          </div>
        </div>
      </header>

      <nav className="tabs">
        <button className={tab === 'doc' ? 'tab active' : 'tab'} onClick={() => setTab('doc')}>
          ① 文档 · Document
        </button>
        <button
          className={tab === 'sources' ? 'tab active' : 'tab'}
          onClick={() => setTab('sources')}
        >
          ② 来源 · Sources
        </button>
        <button
          className={tab === 'patches' ? 'tab active' : 'tab'}
          onClick={() => setTab('patches')}
        >
          ③ 补丁 · Patches
          {pendingStale.length + pendingManual.length > 0 && (
            <span className="tab-dot">{pendingStale.length + pendingManual.length}</span>
          )}
        </button>
        <button className="tab reset" onClick={resetAll} title="重置到初始状态">
          ↺ 重置
        </button>
      </nav>

      <main className="content">
        {tab === 'doc' && (
          <DocView
            result={docResult}
            viewPos={docViewPos}
            maxPos={MAX_POS}
            onSetViewPos={(p) => {
              setPlaying(false);
              setDocViewPos(p);
            }}
            playing={playing}
            onPlay={startPlay}
            events={TIMELINE}
            baselineDate={BASELINE_DATE}
            today={TODAY}
            selectedId={selectedId}
            onSelect={setSelectedId}
            overrides={overrides}
          />
        )}
        {tab === 'sources' && (
          <SourcesView
            sources={SOURCES}
            computed={today.computed}
            events={TIMELINE}
            baselineDate={BASELINE_DATE}
            today={TODAY}
          />
        )}
        {tab === 'patches' && (
          <PatchesView
            pendingStale={pendingStale}
            pendingManual={pendingManual}
            dismissed={dismissed}
            score={today.score}
            freshLB={today.loadBearingFresh}
            totalLB={today.loadBearingTotal}
            onAccept={accept}
            onDismiss={dismiss}
            onRestore={restore}
            onAcceptAllAuto={acceptAllAuto}
            onResolveManual={resolveManual}
          />
        )}
      </main>

      <footer className="footer">
        纯前端演示 · 数据全为围绕"客服退款"场景虚构的 mock；"论断抽取 / 来源语义变化判定"在真实产品里由 LLM 完成，
        本 Demo 以预编码绑定 + 确定性值比较代替，鲜度分为实测。不接后端 / 数据库 / 外部 API。 · rev.1
      </footer>
    </div>
  );
}
