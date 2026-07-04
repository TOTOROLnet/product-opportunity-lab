import { useMemo, useState } from 'react';
import { RUNS } from './data/runs';
import { Inbox } from './components/Inbox';
import { AuditView } from './components/AuditView';
import { EvidenceBoard } from './components/EvidenceBoard';
import { evidenceScore, riskyClaims, SELF_REPORTED_SCORE } from './logic/scoring';

type View = 'inbox' | 'audit' | 'evidence';

export default function App() {
  const [selectedRunId, setSelectedRunId] = useState<string>(RUNS[0].id);
  const [view, setView] = useState<View>('inbox');

  const run = useMemo(
    () => RUNS.find((r) => r.id === selectedRunId) ?? RUNS[0],
    [selectedRunId],
  );

  const score = evidenceScore(run.claims);
  const risky = riskyClaims(run.claims).length;

  function openRun(id: string) {
    setSelectedRunId(id);
    setView('audit');
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="logo">◆</span>
          <div>
            <h1>Attestor</h1>
            <p className="tagline">Agent 自述报告的证据审计器 · 反“幻觉式完成”验收台</p>
          </div>
        </div>
        <nav className="tabs">
          <button className={view === 'inbox' ? 'tab active' : 'tab'} onClick={() => setView('inbox')}>
            交付收件箱
          </button>
          <button className={view === 'audit' ? 'tab active' : 'tab'} onClick={() => setView('audit')}>
            逐句证据审计
          </button>
          <button
            className={view === 'evidence' ? 'tab active' : 'tab'}
            onClick={() => setView('evidence')}
          >
            证据台
          </button>
        </nav>
      </header>

      {view !== 'inbox' && (
        <div className="run-context">
          <span className="ctx-label">当前交付</span>
          <span className="ctx-task">{run.task}</span>
          <span className="ctx-agent">{run.agent}</span>
          <span className="ctx-scores">
            自述 <b className="self">{SELF_REPORTED_SCORE}%</b>
            <span className="arrow">→</span>
            证据 <b className={score >= 70 ? 'ok' : score >= 40 ? 'warn' : 'bad'}>{score}%</b>
          </span>
          {risky > 0 && <span className="ctx-risky">{risky} 条待复核</span>}
        </div>
      )}

      <main className="content">
        {view === 'inbox' && <Inbox runs={RUNS} onOpen={openRun} />}
        {view === 'audit' && <AuditView run={run} onGotoEvidence={() => setView('evidence')} />}
        {view === 'evidence' && <EvidenceBoard run={run} />}
      </main>

      <footer className="foot">
        <span>
          纯前端 mock Demo · 数据与判定均为演示用途，非真实运行结果 · 不接后端 / 数据库 / 外部 API / 真实
          LLM
        </span>
        <span className="foot-src">
          source: product-hunt-radar 2026-07-04（Osloq / Glaze）· 创新切入点非照抄 · build 2026-07-04
        </span>
      </footer>
    </div>
  );
}
