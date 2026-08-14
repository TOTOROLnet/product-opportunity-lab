import { useMemo, useState } from 'react';
import type { DirectorNote } from './types';
import { DRAFT_SHOTS, PRESET_NOTES, emptyNote } from './data/mock';
import DraftTab from './components/DraftTab';
import DirectTab from './components/DirectTab';
import DiffTab from './components/DiffTab';

type Tab = 'draft' | 'direct' | 'diff';

function initialNotes(): Record<string, DirectorNote> {
  const n: Record<string, DirectorNote> = {};
  for (const s of DRAFT_SHOTS) n[s.id] = emptyNote(s.id);
  return n;
}

export default function App() {
  const [tab, setTab] = useState<Tab>('draft');
  const [notes, setNotes] = useState<Record<string, DirectorNote>>(initialNotes);
  const [applied, setApplied] = useState(false);

  const shots = useMemo(() => DRAFT_SHOTS, []);

  function setNote(shotId: string, patch: Partial<DirectorNote>) {
    setApplied(false);
    setNotes((prev) => ({ ...prev, [shotId]: { ...prev[shotId], ...patch } }));
  }

  function applyPreset() {
    setApplied(false);
    setNotes({ ...PRESET_NOTES });
  }

  function resetNotes() {
    setApplied(false);
    setNotes(initialNotes());
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'draft', label: '① 放映台' },
    { id: 'direct', label: '② 导演台' },
    { id: 'diff', label: '③ 改动预览' },
  ];

  return (
    <div className="app">
      <header className="app-head">
        <div className="brand">
          <span className="logo">🎬</span>
          <div>
            <h1>
              说戏 <span className="pinyin">Shuōxì</span>
            </h1>
            <p className="tagline">给「brief→成片」agent 用的导演改稿台 —— 不生成视频，只帮你改</p>
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

      <main>
        {tab === 'draft' && (
          <DraftTab shots={shots} notes={notes} applied={applied} onGoDirect={() => setTab('direct')} />
        )}
        {tab === 'direct' && (
          <DirectTab
            shots={shots}
            notes={notes}
            setNote={setNote}
            applyPreset={applyPreset}
            resetNotes={resetNotes}
            onPreview={() => setTab('diff')}
          />
        )}
        {tab === 'diff' && (
          <DiffTab
            shots={shots}
            notes={notes}
            onApply={() => {
              setApplied(true);
              setTab('draft');
            }}
            onBack={() => setTab('direct')}
          />
        )}
      </main>

      <footer className="app-foot">
        <span>
          纯前端静态 Demo · 全 mock · 脚本化「导演引擎」（不接 LLM / 视频生成 / 后端 / 外部 API）
        </span>
        <span className="muted">
          演示的是「改稿层」这一创新切入点，非 Vizard(生成) / CapCut(时间线) 的克隆
        </span>
      </footer>
    </div>
  );
}
