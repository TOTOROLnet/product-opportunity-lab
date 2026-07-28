import { useMemo, useState } from 'react';
import { EXPERIMENTS } from './data/experiments';
import { computeReadout } from './logic/engine';
import DesignView from './components/DesignView';
import ReadoutView from './components/ReadoutView';
import LedgerView from './components/LedgerView';

type Tab = 'design' | 'readout' | 'ledger';

const TABS: { id: Tab; label: string; hint: string }[] = [
  { id: 'design', label: '① 实验设计台', hint: '建议 → n-of-1 协议' },
  { id: 'readout', label: '② 读数', hint: '基线/干预回放 + 诚实结论' },
  { id: 'ledger', label: '③ 实验档案', hint: '个人证据库' },
];

export default function App() {
  const [tab, setTab] = useState<Tab>('design');
  const [selectedId, setSelectedId] = useState<string>(EXPERIMENTS[0].id);

  const selected = useMemo(
    () => EXPERIMENTS.find((e) => e.id === selectedId) ?? EXPERIMENTS[0],
    [selectedId],
  );
  const readouts = useMemo(
    () => Object.fromEntries(EXPERIMENTS.map((e) => [e.id, computeReadout(e)])),
    [],
  );

  const goReadout = (id: string) => {
    setSelectedId(id);
    setTab('readout');
  };

  return (
    <div className="app">
      <header className="hero">
        <div className="hero-inner">
          <div className="brand">
            <span className="logo">验</span>
            <div>
              <h1>
                验己 <span className="pinyin">Yànjǐ</span>
              </h1>
              <p className="tagline">个人健康 · n-of-1 自我实验教练</p>
            </div>
          </div>
          <p className="pitch">
            健康 AI 会主动告诉你「<b>该试试 X</b>」——但它对<b>你一个人</b>到底有没有用？
            验己坐在建议的<b>下游</b>：把每条建议变成一场为你设计的<b>对照实验</b>，
            再用能识破 <b>安慰剂 / 均值回归 / 数据不足</b> 的读数，诚实告诉你结论——
            <b>对大多数建议，它敢说「没证据」。</b>
          </p>
          <div className="pitch-row">
            <span className="chip">建议 → 实验 → 诚实读数</span>
            <span className="chip chip-alt">不是又一个「推送建议」的助手</span>
            <span className="chip chip-ghost">全 mock 数据 · 非医疗建议</span>
          </div>
        </div>
      </header>

      <nav className="tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`tab ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            <span className="tab-label">{t.label}</span>
            <span className="tab-hint">{t.hint}</span>
          </button>
        ))}
      </nav>

      <main className="content">
        {tab === 'design' && (
          <DesignView
            experiments={EXPERIMENTS}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onGoReadout={goReadout}
          />
        )}
        {tab === 'readout' && (
          <ReadoutView
            experiments={EXPERIMENTS}
            selected={selected}
            readout={readouts[selected.id]}
            onSelect={setSelectedId}
          />
        )}
        {tab === 'ledger' && (
          <LedgerView experiments={EXPERIMENTS} readouts={readouts} onOpen={goReadout} />
        )}
      </main>

      <footer className="footer">
        <p>
          验己 Yànjǐ · 纯前端演示（Vite + React + TS）。所有健康数据均为 <b>mock</b>；
          读数为<b>确定性统计替身</b>，非真实 AI 推断。<b>本产品只做行为实验与诚实读数，不提供医疗诊断或医疗建议，请咨询专业人士。</b>
          <span className="rev"> · rev.1</span>
        </p>
      </footer>
    </div>
  );
}
