import { useMemo, useState } from 'react';
import { compose, DEFAULT_STATE, type ComposeState } from './engine';
import { Compose } from './components/Compose';
import { Perform } from './components/Perform';
import { ThreeReaders } from './components/ThreeReaders';

type TabId = 'compose' | 'perform' | 'readers';

const TABS: { id: TabId; label: string }[] = [
  { id: 'compose', label: '编排台' },
  { id: 'perform', label: '演奏预览' },
  { id: 'readers', label: '一谱三读' },
];

export default function App() {
  const [state, setState] = useState<ComposeState>(DEFAULT_STATE);
  const [tab, setTab] = useState<TabId>('compose');
  const manifest = useMemo(() => compose(state), [state]);

  const files = manifest.filesTouched.length;

  return (
    <div className="app">
      <header className="masthead">
        <div className="logo">谱</div>
        <div>
          <h1>
            编谱 <span className="pinyin">Biānpǔ</span>
          </h1>
          <p className="tagline">
            面向 coding agent 的语义改动谱编排台。把「让 agent 改代码」从一句藏着歧义的散文，
            升级成人能编排、agent 能精确演奏的结构化「改动谱」——歧义在输入端消除，agent 零猜测执行。
          </p>
        </div>
        <div className="kicker">
          <div>
            <b>mock 仓库</b> · acme-checkout
          </div>
          <div>纯前端 · 确定性引擎</div>
          <div>不接 LLM / 后端 / 真实代码</div>
        </div>
      </header>

      {/* 全局收益指标条：随编排实时重算 */}
      <div className="metrics" role="group" aria-label="改动谱指标">
        <div className="metric hero">
          <div className="v">
            4 <span className="arrow">→</span> {manifest.guessesWithScore}
          </div>
          <div className="k">agent 待猜点数（散文 → 谱）</div>
        </div>
        <div className="metric">
          <div className="v">
            {manifest.enabledCount} <small>op</small>
          </div>
          <div className="k">已编排的语义操作</div>
        </div>
        <div className="metric good">
          <div className="v">{manifest.totalEdits}</div>
          <div className="k">确切语义编辑（展开后）</div>
        </div>
        <div className="metric">
          <div className="v">
            {files} <small>文件</small>
          </div>
          <div className="k">
            触达文件{manifest.newModules.length > 0 ? ` · 含 ${manifest.newModules.length} 新模块` : ''}
          </div>
        </div>
        <div className="metric">
          <div className="v">
            {manifest.compatChecked} <small>兼容</small>
          </div>
          <div className="k">自动判定兼容、0 改动</div>
        </div>
      </div>

      <nav className="tabs">
        {TABS.map((t, i) => (
          <button
            key={t.id}
            className={`tab ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            <span className="idx">0{i + 1}</span>
            {t.label}
          </button>
        ))}
      </nav>

      {tab === 'compose' && <Compose state={state} setState={setState} manifest={manifest} />}
      {tab === 'perform' && <Perform manifest={manifest} onGoCompose={() => setTab('compose')} />}
      {tab === 'readers' && <ThreeReaders state={state} manifest={manifest} />}

      <footer className="foot">
        编谱 Biānpǔ · product-opportunity-lab / 2026-08-23 · rev.1 —— 纯前端静态 Demo，全部数据为 mock，
        <code>engine.ts</code> 为确定性语义图引擎，不接任何 LLM / 后端 / 数据库 / 真实代码仓库。
        演示的是「人在意图空间编排、agent 拿无歧义清单执行」的创新切入点，非 Zero（新系统语言）克隆、非 IDE 单点重构。
      </footer>
    </div>
  );
}
