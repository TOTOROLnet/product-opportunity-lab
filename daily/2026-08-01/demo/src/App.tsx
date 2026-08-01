import { useMemo, useState } from 'react';
import { WORKLOADS } from './data/workloads';
import { analyze } from './logic/engine';
import { XrayView } from './components/XrayView';
import { CostView } from './components/CostView';
import { VerdictView } from './components/VerdictView';

type Tab = 'xray' | 'cost' | 'verdict';

const TABS: { id: Tab; label: string }[] = [
  { id: 'xray', label: '① 风洞台 · 兼容 X 光' },
  { id: 'cost', label: '② 成本 × 延迟' },
  { id: 'verdict', label: '③ 阿姆达尔滑杆 · 出厂判定' },
];

export default function App() {
  const [wid, setWid] = useState(WORKLOADS[0].id);
  const [tab, setTab] = useState<Tab>('xray');

  const workload = useMemo(
    () => WORKLOADS.find((w) => w.id === wid) ?? WORKLOADS[0],
    [wid],
  );
  const result = useMemo(() => analyze(workload), [workload]);

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          <span className="logo" aria-hidden>≣›</span>
          <div>
            <h1>
              风洞 <span className="en">WindTunnel</span>
            </h1>
            <p className="tagline">
              WASM agent 运行时「迁移前风洞」：用<b>你自己的工具负载</b>算清到底能不能跑、到底省多少——
              而不是照搬厂商头条的 <b>254×</b>。
            </p>
          </div>
        </div>
      </header>

      <section className="controls">
        <div className="ctrl-label">选一类代表性负载：</div>
        <div className="workload-tabs">
          {WORKLOADS.map((w) => (
            <button
              key={w.id}
              className={`wl-btn ${w.id === wid ? 'active' : ''}`}
              onClick={() => setWid(w.id)}
            >
              {w.name}
            </button>
          ))}
        </div>
        <div className="wl-blurb">{workload.blurb}</div>
      </section>

      <nav className="tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`tab ${t.id === tab ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <main className="content">
        {tab === 'xray' && <XrayView result={result} />}
        {tab === 'cost' && <CostView result={result} />}
        {tab === 'verdict' && <VerdictView result={result} workloadId={workload.id} />}
      </main>

      <footer className="app-footer">
        <span>
          纯前端静态 Demo · 无后端 / LLM / 数据库 / 登录 / 支付 / 外部 API / 真实运行时 · 全部为 mock 负载 +
          确定性可解释引擎
        </span>
        <span className="rev">
          product-opportunity-lab · 2026-08-01 · 风洞 WindTunnel · rev.1
        </span>
      </footer>
    </div>
  );
}
