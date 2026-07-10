import { useMemo, useState } from 'react';
import type { GenElement } from './types';
import { SCENARIOS } from './data/scenarios';
import { summarize, buildPrecheck, nakedActionResult } from './logic/grounding';
import { ScenarioSwitcher } from './components/ScenarioSwitcher';
import { ModeToggle, type Mode } from './components/ModeToggle';
import { GeneratedCard } from './components/GeneratedCard';
import { TruthMeter } from './components/TruthMeter';
import { Modal } from './components/Modal';
import { ElementBadge } from './components/ElementBadge';
import { HowItWorks } from './components/HowItWorks';

interface Toast {
  title: string;
  body: string;
  tone: 'safe' | 'warn';
}

export default function App() {
  const [scenarioId, setScenarioId] = useState(SCENARIOS[0].id);
  const [mode, setMode] = useState<Mode>('naked');
  const [inspectEl, setInspectEl] = useState<GenElement | null>(null);
  const [actionEl, setActionEl] = useState<GenElement | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);

  const scenario = useMemo(
    () => SCENARIOS.find((s) => s.id === scenarioId) ?? SCENARIOS[0],
    [scenarioId],
  );
  const summary = useMemo(() => summarize(scenario.elements), [scenario]);

  const precheck = actionEl ? buildPrecheck(actionEl) : null;

  function handleAction(el: GenElement) {
    if (mode === 'naked') {
      const r = nakedActionResult(el);
      setToast({ title: r.title, body: r.body, tone: 'warn' });
      return;
    }
    setActionEl(el);
  }

  function confirmAction() {
    if (!actionEl?.action) {
      setActionEl(null);
      return;
    }
    setToast({
      title: '✅ 已在你确认后执行',
      body: actionEl.action.plainEffect,
      tone: 'safe',
    });
    setActionEl(null);
  }

  function switchScenario(id: string) {
    setScenarioId(id);
    setInspectEl(null);
    setActionEl(null);
    setToast(null);
  }

  return (
    <div className="app">
      <header className="hero">
        <div className="hero-badge">Pane · 明窗</div>
        <h1>生成式 UI 的可信层</h1>
        <p className="hero-sub">
          消费级 AI 正在「逃离聊天框」——用<strong>现场生成的可交互界面</strong>取代长文本（如
          Monogram、Google generative UI）。但界面本身是模型输出：一个编造的价格放进真实感的价签里，
          比放进一段文字里更具欺骗性。<strong>Pane 给生成的界面加一层玻璃</strong>：每个数字、按钮、
          对比表都能被追问——这是真的吗？点了会发生什么？这界面几成是编的？
        </p>
        <div className="hero-note">
          下面是一个<strong>模拟</strong>的生成式 UI 助手。用顶部开关在「裸生成式 UI」与「接入 Pane
          后」之间切换，亲眼看看同一张界面的差别。
        </div>
      </header>

      <div className="controls">
        <ScenarioSwitcher scenarios={SCENARIOS} activeId={scenarioId} onSelect={switchScenario} />
        <ModeToggle mode={mode} onChange={setMode} />
      </div>

      <main className="stage">
        <GeneratedCard
          scenario={scenario}
          mode={mode}
          onInspect={setInspectEl}
          onAction={handleAction}
        />

        <aside className="side">
          {mode === 'pane' ? (
            <>
              <TruthMeter summary={summary} />
              <div className={`verdict verdict-${scenario.paneVerdict}`}>
                <div className="verdict-head">
                  {scenario.paneVerdict === 'caught' ? '⚠ Pane 拆穿了这块界面' : '✓ Pane 为这块界面背书'}
                </div>
                <p>{scenario.verdictNote}</p>
              </div>
            </>
          ) : (
            <div className="side-empty">
              <div className="side-empty-icon">🫥</div>
              <p>
                裸模式下没有任何可信信息。界面越精美，你越容易默认它都是真的——这正是生成式 UI
                放大幻觉的地方。
              </p>
              <button className="link-btn" onClick={() => setMode('pane')}>
                切到 Pane 看看真相 →
              </button>
            </div>
          )}
        </aside>
      </main>

      <HowItWorks />

      <footer className="foot">
        <span>Pane（明窗）· 生成式 UI 可信层 · 概念 Demo</span>
        <span className="foot-dim">
          纯前端静态原型 · 全部数据为 mock · 不接真实模型/支付/账户/外部 API · rev.1
        </span>
      </footer>

      {inspectEl && (
        <Modal onClose={() => setInspectEl(null)}>
          <div className="prov">
            <div className="prov-head">
              <ElementBadge grounding={inspectEl.grounding} />
              <h3>{inspectEl.label}</h3>
            </div>
            {inspectEl.value && <div className="prov-value">{inspectEl.value}</div>}
            <dl className="prov-dl">
              <dt>来源</dt>
              <dd>{inspectEl.provenance.source}</dd>
              <dt>抓取时间</dt>
              <dd>{inspectEl.provenance.fetchedAt ?? '—（无，未经核实）'}</dd>
              <dt>判定理由</dt>
              <dd>{inspectEl.provenance.reason}</dd>
            </dl>
          </div>
        </Modal>
      )}

      {actionEl && precheck && (
        <Modal onClose={() => setActionEl(null)}>
          <div className={`precheck precheck-${precheck.tone}`}>
            <h3>{precheck.title}</h3>
            {precheck.bodyLines.map((line, i) => (
              <p key={i}>{line}</p>
            ))}
            <div className="precheck-actions">
              {precheck.needsConfirm ? (
                <>
                  <button className="btn-ghost" onClick={() => setActionEl(null)}>
                    取消
                  </button>
                  <button
                    className={`btn-confirm ${precheck.tone === 'money' ? 'money' : ''}`}
                    onClick={confirmAction}
                  >
                    {precheck.confirmLabel}
                  </button>
                </>
              ) : (
                <button className="btn-ghost" onClick={() => setActionEl(null)}>
                  {precheck.confirmLabel}
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}

      {toast && (
        <Modal onClose={() => setToast(null)}>
          <div className={`toast toast-${toast.tone}`}>
            <h3>{toast.title}</h3>
            <p>{toast.body}</p>
            <button className="btn-ghost" onClick={() => setToast(null)}>
              知道了
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
