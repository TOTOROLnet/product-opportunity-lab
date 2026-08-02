import { useState } from 'react';
import { WORKLOADS } from './data/workloads';
import { analyze, fmtDelta } from './logic/engine';
import { VERDICT_META } from './components/shared';
import DeskView from './components/DeskView';
import LedgerView from './components/LedgerView';
import BreakevenView from './components/BreakevenView';

type Page = 'desk' | 'ledger' | 'breakeven';

const PAGES: { id: Page; label: string; hint: string }[] = [
  { id: 'desk', label: '① 换挡台', hint: '厂商话术 vs 诚实读数 + 裁决' },
  { id: 'ledger', label: '② 逐项复盘', hint: '每任务→每成功任务 的翻转' },
  { id: 'breakeven', label: '③ 盈亏平衡', hint: '成功率掉到多少就亏了' },
];

const REV = 'rev.1';

export default function App() {
  const [page, setPage] = useState<Page>('desk');
  const [wid, setWid] = useState(WORKLOADS[0].id);
  const workload = WORKLOADS.find((w) => w.id === wid) ?? WORKLOADS[0];

  return (
    <div className="app">
      <header className="hero">
        <div className="brand">
          <span className="logo" aria-hidden>
            ⇄
          </span>
          <div>
            <h1>
              换挡 <span className="en">Downshift</span>
            </h1>
            <p className="tagline">模型迁移的「按成功任务计价」离线复盘台</p>
          </div>
        </div>
        <p className="pitch">
          面对 <strong>DeepSeek-V4-Flash</strong> 这类「便宜三倍」的新模型，别看 $/token 单价、别信厂商榜单——
          用你自己的 agent trace 重放，算清<strong>每个成功任务</strong>到底省不省钱、掉不掉成功率，再给可执行裁决。
          核心：<code>每成功任务成本 = 每任务成本 ÷ 成功率</code>。
        </p>
      </header>

      {/* 共享工作负载选择器 */}
      <div className="workload-tabs">
        {WORKLOADS.map((x) => {
          const ax = analyze(x);
          const m = VERDICT_META[ax.verdict];
          const active = x.id === wid;
          return (
            <button
              key={x.id}
              className={`wtab${active ? ' active' : ''}`}
              onClick={() => setWid(x.id)}
              style={active ? { borderColor: m.color } : undefined}
            >
              <span className="wtab-name">{x.name}</span>
              <span className="wtab-verdict" style={{ color: m.color }}>
                {m.label} · {fmtDelta(ax.costRatio)}
              </span>
            </button>
          );
        })}
      </div>

      <nav className="pagenav">
        {PAGES.map((p) => (
          <button
            key={p.id}
            className={`pagebtn${page === p.id ? ' active' : ''}`}
            onClick={() => setPage(p.id)}
          >
            <span className="pb-label">{p.label}</span>
            <span className="pb-hint">{p.hint}</span>
          </button>
        ))}
      </nav>

      <main>
        {page === 'desk' && <DeskView workload={workload} />}
        {page === 'ledger' && <LedgerView workload={workload} />}
        {page === 'breakeven' && <BreakevenView key={workload.id} workload={workload} />}
      </main>

      <footer className="foot">
        <span>
          换挡 Downshift · 纯前端静态 Demo（{REV}）· 全部数值为 mock，方法论演示、非真实跑分
        </span>
        <span className="foot-diff">
          厂商中立 · 买方视角 · 敢说「别换」 —— 不是 DeepSeek（被评估的模型）的克隆，也不是 08-01
          风洞（运行时成本倍率、不碰成功率）的重复
        </span>
        <a
          className="foot-url"
          href="https://totorolnet.github.io/product-opportunity-lab/2026-08-02/"
          target="_blank"
          rel="noreferrer"
        >
          在线体验：totorolnet.github.io/product-opportunity-lab/2026-08-02/
        </a>
      </footer>
    </div>
  );
}
