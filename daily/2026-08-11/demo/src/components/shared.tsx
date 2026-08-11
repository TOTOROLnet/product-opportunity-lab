import type { ReactionKind } from '../types';
import { KIND_LABEL } from '../logic/engine';

export const KIND_EMOJI: Record<ReactionKind, string> = {
  engaged: '🟢',
  bored: '💤',
  confused: '❓',
  skeptical: '⚠️',
  drop: '🚪',
};

export function KindBadge({ kind }: { kind: ReactionKind }) {
  return (
    <span className={`kbadge k-${kind}`}>
      <span className={`kdot bg-${kind}`} />
      {KIND_LABEL[kind]}
    </span>
  );
}

// 注意力条：绿(高) -> 黄 -> 红(低)
export function attColor(v: number): string {
  if (v >= 55) return 'var(--k-engaged)';
  if (v >= 25) return 'var(--k-confused)';
  return 'var(--k-skeptical)';
}

export function AttentionBar({ value, dropped }: { value: number; dropped: boolean }) {
  return (
    <div className="att-track">
      <div
        className="att-fill"
        style={{
          width: `${Math.max(0, Math.min(100, value))}%`,
          background: dropped ? 'var(--k-drop)' : attColor(value),
        }}
      />
    </div>
  );
}
