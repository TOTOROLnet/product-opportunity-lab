import { useMemo, useState } from 'react';
import { scenario } from './data/scenario';
import { fixableIds, scan } from './logic/scan';
import { ScanConsole } from './components/ScanConsole';
import { Ledger } from './components/Ledger';
import { FixProposal } from './components/FixProposal';

type View = 'scan' | 'ledger' | 'fix';

const NAV: { id: View; step: string; label: string }[] = [
  { id: 'scan', step: '①', label: '扫描台' },
  { id: 'ledger', step: '②', label: '契约账本' },
  { id: 'fix', step: '③', label: '对表修复' },
];

export default function App() {
  const [view, setView] = useState<View>('scan');
  const [appliedFixes, setAppliedFixes] = useState<Set<string>>(new Set());

  const result = useMemo(() => scan(scenario, appliedFixes), [appliedFixes]);

  const toggleFix = (id: string) =>
    setAppliedFixes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const fixAll = () => setAppliedFixes(new Set(fixableIds(scenario)));
  const resetFixes = () => setAppliedFixes(new Set());

  return (
    <div className="app">
      <header className="masthead">
        <div className="logo">⇄</div>
        <div>
          <h1>对表 Duìbiǎo</h1>
          <p className="tagline">
            给 Agent 指令做 CI——把仓库里散落的 AGENTS.md / CLAUDE.md / .cursor/rules / README / CI
            当可执行规格，逐条对着仓库现实与 CI 真值判决「对齐 / 漂移 / 冲突 / 无法验证」，给出健康分与一键对表修复。
          </p>
          <div className="claim">
            <b>回放还原 agent，对表还原「这些指令是否还成立」。</b>
            HAR 让你迁移到一套新契约、Reference 用嵌入相似度看文档漂移；对表默认你已有的指令会骗人，专门去证伪——哪条命令过期了、哪两份文件在打架、哪条无对应可执行依据。
          </div>
        </div>
      </header>

      <nav className="nav">
        {NAV.map((n) => (
          <button
            key={n.id}
            className={view === n.id ? 'active' : ''}
            onClick={() => setView(n.id)}
          >
            <span className="step-no">{n.step}</span>
            {n.label}
          </button>
        ))}
      </nav>

      {view === 'scan' && <ScanConsole scenario={scenario} onGotoLedger={() => setView('ledger')} />}
      {view === 'ledger' && (
        <Ledger
          result={result}
          appliedFixes={appliedFixes}
          onToggleFix={toggleFix}
          onFixAll={fixAll}
          onResetFixes={resetFixes}
        />
      )}
      {view === 'fix' && <FixProposal scenario={scenario} />}

      <div className="mock-note">
        ⚠ 纯前端 Demo：仓库快照、指令文件与判决全部为 mock，不读取任何真实仓库、不执行任何真实命令，无后端 /
        LLM / 数据库 / 登录 / 支付 / 外部 API。演示的是「把已有 agent 指令当可执行规格去校验并对表」这一创新切入点，与 HAR（新契约编排）、Reference（嵌入式
        doc-drift）机制本质不同，非照抄。
      </div>

      <footer className="footer">
        对表 Duìbiǎo · product-opportunity-lab · 2026-08-08 · 抽象基础设施机会 → 模拟体验 + 价值可视化
      </footer>
    </div>
  );
}
