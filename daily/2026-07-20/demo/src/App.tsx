import { useMemo, useState } from 'react';
import type { Mode } from './types';
import { runAll } from './logic/engine';
import { Workbench } from './components/Workbench';
import { GlassBox } from './components/GlassBox';
import { Compare } from './components/Compare';

type Tab = 'workbench' | 'glass' | 'compare';

export default function App() {
  const runs = useMemo(() => runAll(), []);
  const [tab, setTab] = useState<Tab>('workbench');
  const [mode, setMode] = useState<Mode>('aptly');

  return (
    <div className="app">
      <header className="hdr">
        <h1>
          知时 <span className="en">Aptly</span>
        </h1>
        <p className="tag">该出声时才出声的环境记忆层</p>
        <span className="pill">纯前端模拟 · 数据均为 mock</span>
      </header>

      <p className="sub">
        环境记忆产品（如今日雷达里的 <b>Rewisp</b>）把你看过的屏幕文本存下来、供你 <b>PULL 提问</b>。
        但最痛的场景是 <b>你根本没意识到自己忘了</b> —— PULL 解不了这个悖论；而朴素的主动提醒又必然沦为噪音被你关掉。
        知时不做"记忆存储"，只做垫在其上的 <b>「主动召回决策层」</b>：用
        <b> 相关度 × 时效 × 可行动性 × 新鲜度 </b>打分，再用一个<b>滚动「打扰预算」</b>闸门 + 去重 + 过时抑制，
        决定此刻是把某条旧记忆推到你眼前、还是<b>保持安静</b>。下面同一条工作流会用「朴素推送」与「知时」两种策略回放，
        指标全部由确定性引擎<b>实测</b>。
      </p>

      <nav className="tabs">
        <button className={`tab ${tab === 'workbench' ? 'on' : ''}`} onClick={() => setTab('workbench')}>
          ① 工作台（时间线回放）
        </button>
        <button className={`tab ${tab === 'glass' ? 'on' : ''}`} onClick={() => setTab('glass')}>
          ② 决策透视（玻璃盒）
        </button>
        <button className={`tab ${tab === 'compare' ? 'on' : ''}`} onClick={() => setTab('compare')}>
          ③ 对比（朴素 vs 知时）
        </button>
      </nav>

      {tab === 'workbench' && <Workbench runs={runs} mode={mode} setMode={setMode} />}
      {tab === 'glass' && <GlassBox runs={runs} mode={mode} setMode={setMode} />}
      {tab === 'compare' && <Compare runs={runs} />}

      <p className="foot">
        知时 Aptly · 2026-07-20 每日产品机会 Demo · 基于 product-hunt-radar（Rewisp/环境记忆 + MCP-as-memory 趋势）的<b>独立创新切入点</b>，
        非任何产品克隆 · 引擎确定性、可复现，数值非编造 · rev.1
      </p>
    </div>
  );
}
