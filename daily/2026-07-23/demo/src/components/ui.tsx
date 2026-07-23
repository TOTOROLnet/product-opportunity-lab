import type { ReactNode } from 'react';

export function pct(x: number): string {
  return `${Math.round(x * 100)}%`;
}

export function Pill({ children, tone }: { children: ReactNode; tone?: string }) {
  return <span className={`pill ${tone ? `pill-${tone}` : ''}`}>{children}</span>;
}

/** 上手指数仪表：0–100，越高越好 */
export function Gauge({ score, delta }: { score: number; delta?: number }) {
  const tone = score >= 70 ? 'good' : score >= 45 ? 'warn' : 'bad';
  return (
    <div className={`gauge gauge-${tone}`}>
      <div className="gauge-head">
        <span className="gauge-num">{score}</span>
        <span className="gauge-cap">/100 上手指数</span>
        {typeof delta === 'number' && delta !== 0 && (
          <span className={`gauge-delta ${delta > 0 ? 'up' : 'down'}`}>
            {delta > 0 ? `▲ +${delta}` : `▼ ${delta}`}
          </span>
        )}
      </div>
      <div className="gauge-track">
        <div className="gauge-fill" style={{ width: `${Math.max(3, score)}%` }} />
      </div>
    </div>
  );
}

/** 关键指标小卡 */
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
 * betterWhenLower: true 表示数值越低越好（返工轮数/放弃率）。
 */
export function CompareBar({
  label,
  before,
  after,
  max,
  fmt,
  betterWhenLower,
}: {
  label: string;
  before: number;
  after: number;
  max: number;
  fmt: (n: number) => string;
  betterWhenLower?: boolean;
}) {
  const improved = betterWhenLower ? after < before : after > before;
  const w = (n: number) => `${Math.max(2, Math.min(100, (n / max) * 100))}%`;
  return (
    <div className="cmp">
      <div className="cmp-label">
        {label}
        {improved && <span className="cmp-tag">改善</span>}
      </div>
      <div className="cmp-row">
        <span className="cmp-name">生手</span>
        <div className="cmp-track">
          <div className="cmp-fill cmp-before" style={{ width: w(before) }} />
        </div>
        <span className="cmp-num">{fmt(before)}</span>
      </div>
      <div className="cmp-row">
        <span className="cmp-name">上手后</span>
        <div className="cmp-track">
          <div className={`cmp-fill ${improved ? 'cmp-after-good' : 'cmp-after'}`} style={{ width: w(after) }} />
        </div>
        <span className="cmp-num">{fmt(after)}</span>
      </div>
    </div>
  );
}

/** 严重度标签 */
export function SeverityTag({ severity }: { severity: number }) {
  const meta =
    severity >= 3
      ? { label: '高', tone: 'bad' }
      : severity === 2
        ? { label: '中', tone: 'warn' }
        : { label: '低', tone: 'good' };
  return <Pill tone={meta.tone}>严重度 {meta.label}</Pill>;
}
