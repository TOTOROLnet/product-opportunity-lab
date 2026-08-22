import { useMemo, useState } from 'react';
import { presetState, RerouteState } from './engine';
import FallbackMap from './components/FallbackMap';
import ReroutePlan from './components/ReroutePlan';
import CompareExplain from './components/CompareExplain';

type TabId = 'map' | 'plan' | 'compare';

const TABS: { id: TabId; num: string; label: string }[] = [
  { id: 'map', num: '①', label: '回退地图' },
  { id: 'plan', num: '②', label: '改道方案' },
  { id: 'compare', num: '③', label: '对照 & 说明' },
];

export default function App() {
  const [tab, setTab] = useState<TabId>('map');
  // 全局改道开关状态（Tab ② 编辑，Tab ③ 实时联动）。默认 = 推荐改道。
  const [state, setState] = useState<RerouteState>(() => presetState('recommended'));

  const setRerouted = useMemo(
    () => (id: string, val: boolean) => setState((s) => ({ ...s, [id]: val })),
    [],
  );
  const applyPreset = useMemo(
    () => (p: Parameters<typeof presetState>[0]) => setState(presetState(p)),
    [],
  );

  return (
    <div className="wrap">
      <header className="masthead">
        <div className="brandrow">
          <span className="logo">绕行</span>
          <span className="romn">Ràoxíng</span>
          <span className="pill">模型路由「回退税」诊断台 · 纯前端 mock Demo</span>
        </div>
        <p className="tagline">
          接了「便宜模型优先 + 自动 fallback」的 LLM 网关，成本仪表盘显示<b>省了 67%</b>——
          但其中约 <b>14%</b> 的「节省」站不住脚。绕行用<b>失败特征聚类</b>把
          <b>回退税</b>（便宜调用先失败、再打大模型 = 双付 + 尾延迟）与
          <b>静默质量债</b>（便宜模型看似成功、实则输出悄悄变差）从省钱数字里拆出来，
          并给出<b>按请求类别的改道建议</b>。
        </p>
      </header>

      <nav className="tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={'tab' + (tab === t.id ? ' active' : '')}
            onClick={() => setTab(t.id)}
          >
            <span className="num">{t.num}</span>
            {t.label}
          </button>
        ))}
      </nav>

      {tab === 'map' && <FallbackMap onGoPlan={() => setTab('plan')} />}
      {tab === 'plan' && (
        <ReroutePlan state={state} setRerouted={setRerouted} applyPreset={applyPreset} />
      )}
      {tab === 'compare' && <CompareExplain state={state} onGoPlan={() => setTab('plan')} />}

      <div className="foot">
        绕行 Ràoxíng · 数据全为 mock，引擎为确定性纯函数，不路由真实流量、不接任何模型或网关。
        <span className="rev"> · rev.1</span>
      </div>
    </div>
  );
}
