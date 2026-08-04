import { useState } from 'react';
import CoachView from './components/CoachView';
import CompareView from './components/CompareView';
import ProgressView from './components/ProgressView';

type Tab = 'coach' | 'compare' | 'progress';

const TABS: { id: Tab; label: string; sub: string }[] = [
  { id: 'coach', label: '① 实练台', sub: '看它逐次诚实判定' },
  { id: 'compare', label: '② 讨好 vs 有数', sub: '同一组，两种教练' },
  { id: 'progress', label: '③ 诚实进度', sub: '只算可信次数' },
];

export default function App() {
  const [tab, setTab] = useState<Tab>('coach');

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          <span className="logo">有数</span>
          <div className="brand-text">
            <h1>有数 Yǒushù</h1>
            <p>诚实的端侧实时动作教练 · 看得见才教，练到心里有数</p>
          </div>
        </div>
        <div className="neutral-chip" title="有数不追求「数得多、纠得勤」，而是只在真正看清时才教、看不清就明说、动作垮了就喊停。">
          可信度优先 · 不是覆盖率
        </div>
      </header>

      <div className="why-strip">
        <span>
          端侧 CV 教练的生死线是<b>「看不清却自信乱纠」</b>（健身里 = 教你错误发力、受伤）。
          有数把<b>感知置信度</b>做成第一原则：<b>看得见才教、看不清就明说且不瞎数不瞎纠、动作垮了就喊停</b>——
          用诚实与剂量，替代同类的数满与讨好。
        </span>
      </div>

      <nav className="tabs">
        {TABS.map((t) => (
          <button key={t.id} className={t.id === tab ? 'tab tab-on' : 'tab'} onClick={() => setTab(t.id)}>
            <b>{t.label}</b>
            <small>{t.sub}</small>
          </button>
        ))}
      </nav>

      <main className="main">
        {tab === 'coach' && <CoachView onGoCompare={() => setTab('compare')} />}
        {tab === 'compare' && <CompareView />}
        {tab === 'progress' && <ProgressView />}
      </main>

      <footer className="app-footer">
        <span>
          有数 Yǒushù · 2026-08-04 机会实验室 Demo · 纯前端静态原型，全部数据为 mock（脚本化关节数据模拟端侧 CV），
          无摄像头 / CV 模型 / 后端 / LLM / 数据库 / 登录 / 支付 / 外部 API。
        </span>
        <span className="rev">
          rev.1 · 演示的是「可信度优先」创新切入点，与 CoachAI（覆盖率导向）目标函数相反，非克隆——它追求数得多/纠得勤，有数追求只教真看清的、并敢喊停。
        </span>
      </footer>
    </div>
  );
}
