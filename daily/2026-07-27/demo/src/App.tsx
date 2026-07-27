import { useMemo, useState } from 'react';
import { runEngine } from './logic/engine';
import ChangePlanView from './components/ChangePlanView';
import ClashView from './components/ClashView';
import DecisionView from './components/DecisionView';

type TabId = 'plan' | 'clash' | 'decide';

const TABS: { id: TabId; n: string; t: string; s: string }[] = [
  { id: 'plan', n: 'STEP 1', t: '① 变更计划（逐条视图）', s: 'Agent 提交的 12 条写操作，逐条预览全绿' },
  { id: 'clash', n: 'STEP 2', t: '② 联动风险（合流视图）', s: '整批 dry-run，抓叠加后的涌现冲突' },
  { id: 'decide', n: 'STEP 3', t: '③ 决策与回滚', s: '计划层剔除 → 冲突归零 → 单一回滚点' },
];

export default function App() {
  const [tab, setTab] = useState<TabId>('plan');
  const full = useMemo(() => runEngine(), []);

  return (
    <div className="app">
      <header className="hero">
        <h1>
          <span className="zh">合流 Héliú</span> · AI Agent 批量变更的联动风险预演台
        </h1>
        <p className="tag">
          当电商 / 运营 Agent 一次提交<b> 一批 </b>写操作时，不逐条预览，而是把整批物化后做一次
          <b> dry-run</b>，专门抓「每条各自合法、叠加后违规」的涌现冲突 —— 让人在
          <b> 计划层</b>而不是单条层拍板。
        </p>
        <span className="wedge">
          核心洞见：逐条预览看的是「单条合法」，危险恰恰发生在「组合」上 —— 整体的危险 &gt; 逐条预览之和。
        </span>
        <div className="scene">
          <b>场景：</b>商家对运营 Agent 说「为夏季清仓大促做准备：过季夏装打折、爆款加量、统一包邮门槛、清理断码
          SKU」。Agent 一次生成 <b>12 条</b>写操作 —— 逐条预览 <b>12/12 通过</b>，但合起来会让 3 个 SKU
          跌破成本 / 负毛利、2 个促销指向无货商品、1 处促销超叠加、1 个常规款被误扫入清仓促销。
        </div>
      </header>

      <nav className="tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`tab ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            <div className="n">{t.n}</div>
            <div className="t">{t.t}</div>
            <div className="s">{t.s}</div>
          </button>
        ))}
      </nav>

      {tab === 'plan' && <ChangePlanView full={full} onGoClash={() => setTab('clash')} />}
      {tab === 'clash' && <ClashView full={full} onGoDecide={() => setTab('decide')} />}
      {tab === 'decide' && <DecisionView full={full} />}

      <footer className="footer">
        合流 Héliú · 2026-07-27 产品机会循环 Demo · rev.1
        <div className="disclaimer">
          纯前端静态 Demo：mock 商品目录 + mock Agent 批量变更 + 确定性业务规则引擎。
          不接后端 / 数据库 / 支付 / 登录 / 真实电商后台 / 真实 LLM。
          引擎为确定性规则（非 AI 判断）；AI 核心在于「这批写操作由 Agent 一次性生成」这一前提。
          灵感来自 product-hunt-radar 2026-07-27 报告（Athena / Openbase / PureBox 的逐条预览确认），
          但切入点为其所无的「整批 dry-run + 涌现冲突检测」，非任何产品的克隆。
        </div>
      </footer>
    </div>
  );
}
