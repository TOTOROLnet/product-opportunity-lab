import type { Verdict } from '../types';

export function usd(n: number): string {
  return `$${n.toFixed(2)}`;
}

const VERDICT_META: Record<Verdict, { label: string; icon: string }> = {
  worth: { label: '值', icon: '✓' },
  redundant: { label: '冗余', icon: '⟳' },
  wasted: { label: '浪费', icon: '✗' },
  'skipped-budget': { label: '预算跳过', icon: '⏸' },
};

export function VerdictBadge({ verdict }: { verdict: Verdict }) {
  const m = VERDICT_META[verdict];
  return (
    <span className={`badge ${verdict}`}>
      <span>{m.icon}</span>
      {m.label}
    </span>
  );
}
