import type { ReactNode } from 'react';

export function Pill({ children, tone }: { children: ReactNode; tone?: string }) {
  return <span className={`pill ${tone ? `pill-${tone}` : ''}`}>{children}</span>;
}

export function Metric({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: string;
}) {
  return (
    <div className={`metric ${tone ? `metric-${tone}` : ''}`}>
      <div className="metric-value">{value}</div>
      <div className="metric-label">{label}</div>
      {sub && <div className="metric-sub">{sub}</div>}
    </div>
  );
}

/**
 * before/after 对比条。
 * betterWhenLower: true 表示越低越好（静默错误数/检测延迟/排障步数）。
 */
export function CompareBar({
  label,
  off,
  on,
  max,
  fmt,
  betterWhenLower,
}: {
  label: string;
  off: number;
  on: number;
  max: number;
  fmt: (n: number) => string;
  betterWhenLower?: boolean;
}) {
  const improved = betterWhenLower ? on < off : on > off;
  const w = (n: number) => `${Math.max(2, Math.min(100, (n / Math.max(max, 1)) * 100))}%`;
  return (
    <div className="cmp">
      <div className="cmp-label">
        {label}
        {improved && <span className="cmp-tag">改善</span>}
      </div>
      <div className="cmp-row">
        <span className="cmp-name">榫卯 OFF</span>
        <div className="cmp-track">
          <div className="cmp-fill cmp-bad" style={{ width: w(off) }} />
        </div>
        <span className="cmp-num">{fmt(off)}</span>
      </div>
      <div className="cmp-row">
        <span className="cmp-name">榫卯 ON</span>
        <div className="cmp-track">
          <div className="cmp-fill cmp-good" style={{ width: w(on) }} />
        </div>
        <span className="cmp-num">{fmt(on)}</span>
      </div>
    </div>
  );
}
