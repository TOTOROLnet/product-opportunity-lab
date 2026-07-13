import { useMemo, useState } from 'react';
import { SCENARIOS } from './data/scenarios';
import {
  classifyBase,
  governRecall,
  governedSummary,
  nakedSummary,
  type Decision,
  type DecisionMap,
} from './logic/mneme';
import type { MemoryItem } from './types';
import { TrustMeter } from './components/TrustMeter';
import { MemoryCard } from './components/MemoryCard';
import { InjectedPreview } from './components/InjectedPreview';

export default function App() {
  const [scenarioId, setScenarioId] = useState<string>(SCENARIOS[0].id);
  const [governed, setGoverned] = useState<boolean>(false);
  const [decisions, setDecisions] = useState<DecisionMap>({});

  const scenario = useMemo(
    () => SCENARIOS.find((s) => s.id === scenarioId) ?? SCENARIOS[0],
    [scenarioId],
  );

  const mode = governed ? 'governed' : 'naked';

  const governedItems = useMemo(() => governRecall(scenario, decisions), [scenario, decisions]);

  const summary = useMemo(
    () => (governed ? governedSummary(governedItems, scenario) : nakedSummary(scenario)),
    [governed, governedItems, scenario],
  );

  const injectedMemories: MemoryItem[] = useMemo(() => {
    if (!governed) return scenario.recalled;
    return governedItems.filter((g) => g.verdict === 'inject').map((g) => g.memory);
  }, [governed, governedItems, scenario]);

  function changeScenario(id: string) {
    setScenarioId(id);
    setDecisions({});
  }

  function onAction(id: string, action: Decision) {
    setDecisions((prev) => ({ ...prev, [id]: action }));
  }

  function onKeepConflict(id: string) {
    const mem = scenario.recalled.find((m) => m.id === id);
    setDecisions((prev) => {
      const next = { ...prev, [id]: 'kept' as Decision };
      if (mem?.contradictsId) next[mem.contradictsId] = 'retired';
      return next;
    });
  }

  function onUndo(id: string) {
    const mem = scenario.recalled.find((m) => m.id === id);
    setDecisions((prev) => {
      const next = { ...prev };
      delete next[id];
      if (mem?.contradictsId) delete next[mem.contradictsId];
      return next;
    });
  }

  function partnerContent(m: MemoryItem): string | undefined {
    if (!m.contradictsId) return undefined;
    return scenario.recalled.find((x) => x.id === m.contradictsId)?.content;
  }

  const decidedCount = Object.keys(decisions).length;

  return (
    <div className="app">
      <header className="hero">
        <div className="brand">
          <span className="logo">记衡</span>
          <span className="brand-en">Mneme</span>
        </div>
        <h1>跨工具自持记忆的「调阅治理层」</h1>
        <p className="tagline">
          入库 ≠ 可信，接通 ≠ 全看。在记忆被 <code>recall</code> 注入进某个 AI 工具之前，先按
          <b>作用域</b>过滤（最小权限），再做<b>卫生</b>治理（出处 / 矛盾 / 过期 / 投毒），
          只放行干净、正确、最小的上下文。
        </p>
      </header>

      <section className="controls">
        <div className="control-group">
          <span className="control-label">接入工具</span>
          <div className="seg">
            {SCENARIOS.map((s) => (
              <button
                key={s.id}
                className={`seg-btn ${s.id === scenarioId ? 'active' : ''}`}
                onClick={() => changeScenario(s.id)}
              >
                {s.tool.name}
                {s.tool.isControl && <span className="control-badge">对照</span>}
              </button>
            ))}
          </div>
        </div>

        <div className="control-group">
          <span className="control-label">调阅模式</span>
          <div className="toggle">
            <button className={`toggle-btn ${!governed ? 'active naked' : ''}`} onClick={() => setGoverned(false)}>
              裸调阅
            </button>
            <button className={`toggle-btn ${governed ? 'active gov' : ''}`} onClick={() => setGoverned(true)}>
              记衡治理
            </button>
          </div>
        </div>

        {governed && (
          <button className="reset" onClick={() => setDecisions({})} disabled={decidedCount === 0}>
            重置裁决
          </button>
        )}
      </section>

      <p className="narrative">{scenario.narrative}</p>

      <div className="scope-hint">
        「{scenario.tool.name}」授权可读作用域：
        {scenario.tool.allowedScopes.map((sc) => (
          <span key={sc} className={`scope scope-${sc}`}>
            {sc}
          </span>
        ))}
        <span className="scope-purpose">· 用途：{scenario.tool.purpose}</span>
      </div>

      <TrustMeter summary={summary} mode={mode} />

      <div className="layout">
        <main className="cards">
          {scenario.recalled.map((m, i) => {
            const g = governedItems[i];
            const base = classifyBase(m, scenario.tool);
            return (
              <MemoryCard
                key={m.id}
                memory={m}
                mode={mode}
                verdict={governed ? g.verdict : base.verdict}
                reason={governed ? g.reason : base.reason}
                resolved={governed ? !!g.resolved : false}
                hasDecision={!!decisions[m.id]}
                partnerContent={partnerContent(m)}
                onAction={onAction}
                onKeepConflict={onKeepConflict}
                onUndo={onUndo}
              />
            );
          })}
        </main>

        <InjectedPreview
          toolName={scenario.tool.name}
          injected={injectedMemories}
          mode={mode}
          blockedCount={summary.blocked}
          heldCount={summary.held}
        />
      </div>

      <footer className="explain">
        <h2>这是什么 / 为何不是照抄</h2>
        <div className="explain-grid">
          <div>
            <h3>它解决什么</h3>
            <p>
              一份"自持"记忆接进多个 AI 工具后，涌现出存储层不解决的新问题：<b>越界泄漏</b>（每个工具都能
              recall 你的全部）、<b>投毒扩散</b>（一个 agent 的幻觉经 recall 进入所有工具）、
              <b>记忆腐烂</b>（过期/矛盾长期驻留）、<b>出处盲区</b>。
            </p>
          </div>
          <div>
            <h3>增量在哪（vs Second Brain）</h3>
            <p>
              Second Brain 等解决"记忆<b>存哪、怎么搜、归谁</b>"；记衡不碰存储，只在 recall →
              注入之间做治理：这条记忆<b>该不该进这个工具、进去前可不可信</b>。是"仓库"与"海关/质检"的关系。
            </p>
          </div>
          <div>
            <h3>报告信号锚定</h3>
            <p>
              基于 2026-07-13 报告趋势 1「记忆/状态层从厂商内建走向<b>用户自持 + MCP 标准化</b>」（Second Brain
              15/18、FetchSandbox 13/18）。报告建议把记忆做成一等服务，但未点出"注入前治理"这层——正是本机会的切入点。
            </p>
          </div>
        </div>
        <p className="disclaim">
          纯前端静态 Demo，全部数据为 mock；不接登录/数据库/支付/外部 API/真实记忆存储。密钥、住址等均为虚构演示。
        </p>
      </footer>
    </div>
  );
}
