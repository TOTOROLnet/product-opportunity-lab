import { useEffect, useMemo, useState } from 'react';
import type { Mode } from './types';
import { initialDoc } from './data/doc';
import { timeline } from './data/timeline';
import { runBoth } from './logic/engine';
import CoWritingStage from './components/CoWritingStage';
import OwnershipMap from './components/OwnershipMap';
import Compare from './components/Compare';

type Tab = 'stage' | 'map' | 'compare';

export default function App() {
  const runs = useMemo(() => runBoth(initialDoc, timeline), []);
  const humanTexts = useMemo(() => {
    const map: Record<string, string> = {};
    for (const ev of timeline) {
      if (ev.type === 'human_edit' && ev.section && ev.humanText) map[ev.section] = ev.humanText;
    }
    return map;
  }, []);

  const [tab, setTab] = useState<Tab>('stage');
  const [mode, setMode] = useState<Mode>('cobaton');
  const [stepIdx, setStepIdx] = useState(0);
  const [playing, setPlaying] = useState(false);

  const run = runs[mode];
  const last = run.steps.length - 1;
  const clamped = Math.min(stepIdx, last);
  const step = run.steps[clamped];

  useEffect(() => {
    if (!playing) return;
    if (clamped >= last) {
      setPlaying(false);
      return;
    }
    const id = setTimeout(() => setStepIdx((i) => Math.min(i + 1, last)), 1100);
    return () => clearTimeout(id);
  }, [playing, clamped, last]);

  const showControls = tab === 'stage' || tab === 'map';

  return (
    <div>
      <header className="app-header">
        <h1 className="app-title">
          并笔 <span className="en">CoBaton</span>
        </h1>
        <p className="app-tagline">
          垫在任意编辑器<b>之下</b>的冲突消解层：人和 AI agent 在同一份活文档上并行编辑时，保证你
          <b>永不被打断</b>、你的编辑<b>永不被静默丢弃</b>、agent 的活儿<b>永不白费</b>。
        </p>
        <p className="app-sub">
          纯前端模拟 · 数据全 mock · 无后端/LLM/真实 agent　|　riding 2026-07-19 报告信号「人机共编面（OpenMarkdown）」
          与趋势「AI 从聊天框走向共享文档」
        </p>
      </header>

      <div className="tabs">
        <button className={`tab ${tab === 'stage' ? 'active' : ''}`} onClick={() => setTab('stage')}>
          ① 共写台
        </button>
        <button className={`tab ${tab === 'map' ? 'active' : ''}`} onClick={() => setTab('map')}>
          ② 执笔权地图（玻璃盒）
        </button>
        <button className={`tab ${tab === 'compare' ? 'active' : ''}`} onClick={() => setTab('compare')}>
          ③ 对比（Before / After）
        </button>
      </div>

      {showControls && (
        <>
          <div className="controls">
            <div className="mode-switch">
              <button
                className={mode === 'naive' ? 'on naive' : ''}
                onClick={() => setMode('naive')}
              >
                朴素模式（现状）
              </button>
              <button
                className={mode === 'cobaton' ? 'on cobaton' : ''}
                onClick={() => setMode('cobaton')}
              >
                并笔 CoBaton
              </button>
            </div>

            <button className="btn" onClick={() => setPlaying((p) => !p)} disabled={clamped >= last}>
              {playing ? '⏸ 暂停' : '▶ 播放'}
            </button>
            <button
              className="btn"
              onClick={() => {
                setPlaying(false);
                setStepIdx((i) => Math.max(i - 1, 0));
              }}
              disabled={clamped <= 0}
            >
              ⏮ 上一步
            </button>
            <button
              className="btn"
              onClick={() => {
                setPlaying(false);
                setStepIdx((i) => Math.min(i + 1, last));
              }}
              disabled={clamped >= last}
            >
              ⏭ 下一步
            </button>
            <button
              className="btn"
              onClick={() => {
                setPlaying(false);
                setStepIdx(0);
              }}
            >
              ↺ 重置
            </button>

            <span className="step-label">
              事件 {clamped + 1} / {run.steps.length}　#{step.event.t} {step.event.type}
            </span>
          </div>
          <div className="progress">
            <div style={{ width: `${((clamped + 1) / run.steps.length) * 100}%` }} />
          </div>
        </>
      )}

      {tab === 'stage' && <CoWritingStage step={step} mode={mode} humanTexts={humanTexts} />}
      {tab === 'map' && <OwnershipMap run={run} stepIdx={clamped} />}
      {tab === 'compare' && <Compare naive={runs.naive} cobaton={runs.cobaton} />}

      <div className="footer">
        并笔 CoBaton · product-opportunity-lab 每日机会 Demo · 2026-07-19 · rev.1　|　
        本 Demo 是「执笔权协调协议」的可视化模拟，非生产实现（不接真实编辑器/agent/CRDT）。
      </div>
    </div>
  );
}
