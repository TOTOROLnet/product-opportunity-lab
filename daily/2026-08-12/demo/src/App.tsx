import { useState } from 'react';
import { run } from './data/run';
import { summarize } from './logic/engine';
import CatchupTab from './components/CatchupTab';
import SelfEditsTab from './components/SelfEditsTab';
import CompareTab from './components/CompareTab';

type Tab = 'catchup' | 'self' | 'compare';

export default function App() {
  const [tab, setTab] = useState<Tab>('catchup');
  const s = summarize(run);

  return (
    <div className="app">
      <div className="topbar">
        <div className="brand">
          随读<span className="dot">.</span>
          <span className="py">Suídú</span>
        </div>
        <div className="tagline">
          自主 Agent 长时运行后的「3 分钟补看」阅读器 · 只帮你读懂，不打分 / 不放行 / 不判对错
        </div>
      </div>

      <div className="mock-banner">
        <b>演示说明</b>：以下是一段<b> 全 mock 的脚本化 agent 运行轨迹</b>
        （章节 / diff / 工具调用 / 假设 / 悬案 / 自我修订 / 原始日志均为预置数据），
        用于演示"把自治运行重构成给人补看的叙事"这一创新切入点，<b>非在线 LLM 推理</b>，不接后端 /
        数据库 / 密钥 / 外部 API。
      </div>

      <section className="runhead">
        <div className="goal">📥 委派任务：{run.goal}</div>
        <div className="meta">
          {run.agent} · {run.startedAt} · 活跃约 {s.durationMin} 分
        </div>
        <div className="chips">
          <span className="statchip">
            <b>{s.steps}</b> 步工具调用
          </span>
          <span className="statchip">
            <b>{s.files}</b> 个文件改动
          </span>
          <span className="statchip hot">
            <b>{s.assumptions}</b> 个假设
          </span>
          <span className="statchip hot">
            <b>{s.looseEnds}</b> 个悬案
          </span>
          <span className="statchip hot">
            <b>{s.selfEdits}</b> 处自我修订
          </span>
          <span className="statchip">
            补看用时 <b>{s.rawReadMin}→{s.catchupMin}</b> 分
          </span>
        </div>
      </section>

      <nav className="tabs">
        <button
          className={`tab ${tab === 'catchup' ? 'active' : ''}`}
          onClick={() => setTab('catchup')}
        >
          ① 补看
          <span className="badge">叙事时间线</span>
        </button>
        <button
          className={`tab ${tab === 'self' ? 'active' : ''}`}
          onClick={() => setTab('self')}
        >
          ② 它改了自己
          <span className="badge">{s.selfEdits} 处自我修订</span>
        </button>
        <button
          className={`tab ${tab === 'compare' ? 'active' : ''}`}
          onClick={() => setTab('compare')}
        >
          ③ 对照
          <span className="badge">{s.rawReadMin}→{s.catchupMin} 分</span>
        </button>
      </nav>

      <main>
        {tab === 'catchup' && <CatchupTab run={run} />}
        {tab === 'self' && <SelfEditsTab run={run} />}
        {tab === 'compare' && <CompareTab run={run} />}
      </main>
    </div>
  );
}
