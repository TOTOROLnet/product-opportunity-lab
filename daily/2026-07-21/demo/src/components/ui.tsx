import type { AgentKind, Reversibility } from '../types';
import { MAX_RUNG } from '../logic/engine';

export function agentClass(agent: AgentKind): string {
  if (agent === '应收 Agent') return 'ag-recv';
  if (agent === '运营 Agent') return 'ag-ops';
  return 'ag-eng';
}

export function AgentTag({ agent }: { agent: AgentKind }) {
  return <span className={`agent-tag ${agentClass(agent)}`}>{agent}</span>;
}

const REV_META: Record<Reversibility, { label: string; cls: string }> = {
  high: { label: '易撤销', cls: 'rev-high' },
  medium: { label: '可补救', cls: 'rev-mid' },
  low: { label: '近乎不可逆', cls: 'rev-low' },
};

export function RevBadge({ level }: { level: Reversibility }) {
  const m = REV_META[level];
  return <span className={`rev-badge ${m.cls}`}>可逆性：{m.label}</span>;
}

export function RungBar({
  rung,
  threshold,
  auto,
  locked,
}: {
  rung: number;
  threshold: number;
  auto: boolean;
  locked: boolean;
}) {
  const cells = Array.from({ length: MAX_RUNG }, (_, i) => i < rung);
  return (
    <div className={`rungbar ${auto ? 'rungbar-auto' : ''} ${locked ? 'rungbar-locked' : ''}`}>
      <div className="rungbar-cells">
        {cells.map((on, i) => (
          <span
            key={i}
            className={`rung-cell ${on ? 'on' : ''} ${!locked && i + 1 === threshold ? 'threshold' : ''}`}
          />
        ))}
      </div>
      <span className="rungbar-state">
        {locked ? '锁定 · 始终人工' : auto ? '自动放行中' : `信任 ${rung}/${MAX_RUNG}`}
      </span>
    </div>
  );
}

export function money(n: number): string {
  if (!n) return '—';
  return '¥' + n.toLocaleString('zh-CN');
}
