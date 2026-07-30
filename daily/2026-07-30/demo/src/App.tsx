import { useMemo, useState } from 'react';
import type { HostVerbosity, ViewName } from './types';
import { PROGRAM } from './data/program';
import { buildProgram } from './logic/engine';
import RundownView from './components/RundownView';
import PlayerView, { type SegStatus } from './components/PlayerView';
import SignOffView from './components/SignOffView';

const VERBOSITY_OPTIONS: { key: HostVerbosity; label: string }[] = [
  { key: 'concise', label: '简洁' },
  { key: 'normal', label: '正常' },
  { key: 'chatty', label: '健谈' },
];

export default function App() {
  const built = useMemo(() => buildProgram(PROGRAM), []);
  const [view, setView] = useState<ViewName>('rundown');
  const [verbosity, setVerbosity] = useState<HostVerbosity>('normal');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [statuses, setStatuses] = useState<SegStatus[]>(
    () => built.segments.map(() => 'pending' as SegStatus),
  );

  const start = () => {
    setStatuses(built.segments.map(() => 'pending' as SegStatus));
    setCurrentIndex(0);
    setView('player');
  };

  const advance = (mark: SegStatus) => {
    setStatuses((prev) => {
      const next = [...prev];
      next[currentIndex] = mark;
      return next;
    });
    if (currentIndex >= built.segments.length - 1) {
      setView('signoff');
    } else {
      setCurrentIndex((i) => i + 1);
    }
  };

  const replay = () => {
    setStatuses(built.segments.map(() => 'pending' as SegStatus));
    setCurrentIndex(0);
    setView('rundown');
  };

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <div className="logo">◗</div>
          <div>
            <h1>
              收播<span className="en">Sign-Off</span>
            </h1>
            <div className="sub">一档 AI 主持、每天会结束的节目 · 清空你的稍后读</div>
          </div>
        </div>
        <div className="verbosity">
          <span>主持话痨度</span>
          <div className="seg">
            {VERBOSITY_OPTIONS.map((o) => (
              <button
                key={o.key}
                className={verbosity === o.key ? 'active' : ''}
                onClick={() => setVerbosity(o.key)}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {view === 'rundown' && (
        <RundownView built={built} verbosity={verbosity} onStart={start} />
      )}
      {view === 'player' && (
        <PlayerView
          built={built}
          verbosity={verbosity}
          currentIndex={currentIndex}
          statuses={statuses}
          onRead={() => advance('read')}
          onSkip={() => advance('skipped')}
        />
      )}
      {view === 'signoff' && (
        <SignOffView
          built={built}
          verbosity={verbosity}
          statuses={statuses}
          onReplay={replay}
        />
      )}

      <div className="footnote">
        <b>这是一个纯前端静态 Demo（Vite + React + TS）。</b>
        所有积压条目、AI 主持口播、编排结果均为 <b>mock</b>（模拟 AI 从你的积压里"选 + 排 + 写串场"的结果），
        不接入任何真实后端 / LLM / 数据库 / 登录 / 支付 / 外部 API。
        真实产品里，积压来自 Pocket / Readwise / 浏览器书签 / YouTube 稍后看，主持口播由 LLM 生成。
        <br />
        灵感来自 2026-07-29 radar 报告中被低估的一条 2C 洞察（SUB/WAVE：让 AI 当主持/策展而非生成器、刻意反算法），
        但把它从"自托管音乐直播电台"迁到大众的"稍后读积压"，并叠加"节目会结束 + 清空积压"——是创新切入点，非照抄。
      </div>
    </div>
  );
}
