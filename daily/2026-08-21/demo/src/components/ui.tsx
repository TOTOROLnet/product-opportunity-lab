import type { ReactNode } from 'react';

export function Badge({
  children,
  tone = 'neutral',
}: {
  children: ReactNode;
  tone?: 'neutral' | 'low' | 'mid' | 'high' | 'good' | 'info';
}) {
  return <span className={`badge badge--${tone}`}>{children}</span>;
}

export function Meter({ value, max, tone }: { value: number; max: number; tone?: string }) {
  const pct = Math.max(0, Math.min(100, max === 0 ? 0 : (value / max) * 100));
  return (
    <div className="meter" aria-hidden>
      <div className={`meter__fill meter__fill--${tone ?? 'mid'}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Stat({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  tone?: 'good' | 'bad' | 'neutral';
}) {
  return (
    <div className={`stat stat--${tone ?? 'neutral'}`}>
      <div className="stat__value">{value}</div>
      <div className="stat__label">{label}</div>
      {sub ? <div className="stat__sub">{sub}</div> : null}
    </div>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={`card ${className ?? ''}`}>{children}</div>;
}
