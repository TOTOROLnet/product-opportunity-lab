import { useMemo, useState } from 'react';
import type { Memory } from './types';
import { INITIAL_MEMORIES, SCENARIO } from './data/memories';
import { computeGate, computeTrust } from './logic/trust';
import GateView from './components/GateView';
import LedgerView from './components/LedgerView';
import ProvenanceView from './components/ProvenanceView';

type Tab = 'gate' | 'ledger' | 'provenance';

const TABS: { key: Tab; num: string; label: string }[] = [
  { key: 'gate', num: '①', label: '动手前 · 信任闸' },
  { key: 'ledger', num: '②', label: '记忆账本 · 对账台' },
  { key: 'provenance', num: '③', label: '溯源 · 信任拆解' },
];

const TODAY = '2026-07-31';

export default function App() {
  const [memories, setMemories] = useState<Memory[]>(() =>
    INITIAL_MEMORIES.map((m) => ({ ...m })),
  );
  const [managerApproved, setManagerApproved] = useState(false);
  const [tab, setTab] = useState<Tab>('gate');
  const [selectedId, setSelectedId] = useState<string>('m1');
  const [lastChange, setLastChange] = useState<string | null>(null);

  const gate = useMemo(
    () => computeGate(memories, SCENARIO, managerApproved),
    [memories, managerApproved],
  );

  const update = (fn: (prev: Memory[]) => Memory[], msg: string) => {
    setMemories((prev) => {
      const next = fn(prev);
      const g = computeGate(next, SCENARIO, managerApproved);
      setLastChange(`${msg} 「信任闸」结论现在是 ${g.verdict} — ${g.headline}。`);
      return next;
    });
  };

  const patch = (id: string, p: Partial<Memory>) => (prev: Memory[]) =>
    prev.map((m) => (m.id === id ? { ...m, ...p } : m));

  const onRetireToggle = (id: string) => {
    const m = memories.find((x) => x.id === id)!;
    update(patch(id, { retired: !m.retired }), `已${m.retired ? '恢复' : '退役'} ${id}。`);
  };

  const onPinToggle = (id: string) => {
    const m = memories.find((x) => x.id === id)!;
    update(patch(id, { pinned: !m.pinned }), `已${m.pinned ? '取消 pin' : 'pin'} ${id}（pin 会停止时效衰减）。`);
  };

  const onReconfirm = (id: string) => {
    const m = memories.find((x) => x.id === id)!;
    update(
      patch(id, { confirmations: m.confirmations + 1, lastConfirmedAt: TODAY }),
      `已对 ${id} 再确认一次（confirm ${m.confirmations}→${m.confirmations + 1}，时效刷新到今天）。`,
    );
  };

  const onResolveConflict = (id: string) => {
    const m = memories.find((x) => x.id === id)!;
    const b = computeTrust(m, memories);
    // 解决矛盾：保留"赢"的一方，退役"输"的一方。
    if (b.losesConflict) {
      update(patch(id, { retired: true }), `已按"以新/权威为准"退役劣势记忆 ${id}。`);
    } else {
      const loserId = b.activeConflictIds[0];
      update(patch(loserId, { retired: true }), `已按"以 ${id} 为准"退役其矛盾对手 ${loserId}。`);
    }
  };

  const openMemory = (id: string) => {
    setSelectedId(id);
    setTab('provenance');
  };

  return (
    <div className="app">
      <header className="hd">
        <div className="brand">
          <div className="logo">忆</div>
          <div>
            <h1>忆证 Yìzhèng</h1>
            <p className="sub">Agent 记忆的回忆信任闸 · Recall Trust Gate</p>
          </div>
        </div>
        <div className="tagline">
          在 agent 用某条记忆去动手<b>之前</b>，先验明来源 × confirm 次数 × 时效 ×
          矛盾；低于信任阈值就拦下来复核，而不是静默照做。
        </div>
      </header>

      <nav className="tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`tab${tab === t.key ? ' active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            <span className="tnum">{t.num}</span>
            {t.label}
          </button>
        ))}
      </nav>

      {tab === 'gate' && (
        <GateView
          scenario={SCENARIO}
          memories={memories}
          gate={gate}
          managerApproved={managerApproved}
          onManagerApprove={() => {
            setManagerApproved(true);
            setLastChange(null);
          }}
          onOpenMemory={openMemory}
        />
      )}

      {tab === 'ledger' && (
        <LedgerView
          memories={memories}
          lastChange={lastChange}
          onRetireToggle={onRetireToggle}
          onPinToggle={onPinToggle}
          onReconfirm={onReconfirm}
          onResolveConflict={onResolveConflict}
          onOpenMemory={openMemory}
        />
      )}

      {tab === 'provenance' && (
        <ProvenanceView memories={memories} selectedId={selectedId} onSelect={setSelectedId} />
      )}

      <p className="footnote">
        纯前端静态 Demo（Vite + React + TS）。全部数据为 <code>mock</code>，trust
        由确定性可解释公式计算；<b>不接</b> 后端 / LLM / 数据库 / 登录 / 支付 / 外部 API / 真实记忆库。
        忆证 与记忆存储解耦——它不存记忆，只回答"此刻该不该信、该不该拿它动手"。演示的是我们分析出的
        recall-time 记忆信任层，非 Liminal（存储）/ FlowTask（写入门）/ Prefactor（产出评估）的克隆。
      </p>
    </div>
  );
}
