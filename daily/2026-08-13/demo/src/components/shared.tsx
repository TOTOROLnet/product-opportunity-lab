import type { HabitMeta } from '../types';

export function HabitTag({ meta, small }: { meta: HabitMeta; small?: boolean }) {
  return (
    <span
      className={small ? 'tag tag-sm' : 'tag'}
      style={{ background: meta.color + '22', color: meta.color, borderColor: meta.color + '55' }}
    >
      <span className="dot" style={{ background: meta.color }} />
      {meta.label}
      {meta.priority === 'low' && <span className="tag-low">低优先</span>}
    </span>
  );
}

export function Bar({ value, color, track }: { value: number; color: string; track?: string }) {
  return (
    <div className="bar" style={{ background: track ?? 'rgba(148,163,184,.18)' }}>
      <div className="bar-fill" style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: color }} />
    </div>
  );
}

export function Pill({ children, tone = 'default' }: { children: React.ReactNode; tone?: 'default' | 'good' | 'warn' }) {
  return <span className={`pill pill-${tone}`}>{children}</span>;
}
