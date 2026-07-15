import type { MasteryStatus } from '../types';
import { STATUS_LABEL } from '../logic/mastery';

export function ProgressBar({ value }: { value: number }) {
  return (
    <div className="progress">
      <div className="progress__fill" style={{ width: `${Math.round(value * 100)}%` }} />
    </div>
  );
}

export function StatusPill({ status }: { status: MasteryStatus }) {
  return <span className={`pill pill--${status}`}>{STATUS_LABEL[status]}</span>;
}

export function ScoreRing({ score }: { score: number }) {
  const status: MasteryStatus = score >= 75 ? 'mastered' : score >= 45 ? 'shaky' : 'weak';
  return (
    <div className={`ring ring--${status}`}>
      <span className="ring__num">{score}</span>
    </div>
  );
}

export function Tag({ children }: { children: React.ReactNode }) {
  return <span className="tag">{children}</span>;
}
