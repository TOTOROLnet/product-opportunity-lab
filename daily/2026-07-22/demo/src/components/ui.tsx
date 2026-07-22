import type { ReactNode } from 'react';
import type { Category, Severity } from '../types';

export const categoryIcon: Record<Category, string> = {
  hotel: '🏨',
  subscription: '🔁',
  flight: '✈️',
};

export const severityMeta: Record<Severity, { label: string; cls: string }> = {
  low: { label: '低', cls: 'sev-low' },
  medium: { label: '中', cls: 'sev-medium' },
  high: { label: '高', cls: 'sev-high' },
};

export function Pill({ children, cls }: { children: ReactNode; cls?: string }) {
  return <span className={`pill ${cls ?? ''}`}>{children}</span>;
}

/** 可逆性仪表：0–100，越高越安全。 */
export function ReversibilityGauge({ score }: { score: number }) {
  const tone = score >= 70 ? 'good' : score >= 40 ? 'warn' : 'bad';
  return (
    <div className={`gauge gauge-${tone}`}>
      <div className="gauge-num">{score}</div>
      <div className="gauge-track">
        <div className="gauge-fill" style={{ width: `${Math.max(4, score)}%` }} />
      </div>
      <div className="gauge-cap">/100 可逆</div>
    </div>
  );
}

/** 通用小分数条（商户可信度等）。 */
export function ScoreBar({ score }: { score: number }) {
  const tone = score >= 70 ? 'good' : score >= 50 ? 'warn' : 'bad';
  return (
    <div className="scorebar">
      <div className={`scorebar-fill sb-${tone}`} style={{ width: `${Math.max(4, score)}%` }} />
      <span className="scorebar-num">{score}</span>
    </div>
  );
}
