import type { DriftStatus, Severity, Verdict } from '../types';
import { verdictText } from '../logic/reconcile';

const STATUS_META: Record<DriftStatus, { label: string; cls: string }> = {
  aligned: { label: '一致', cls: 'st-aligned' },
  drifted: { label: '漂移', cls: 'st-drifted' },
  invalidated: { label: '已失效', cls: 'st-invalid' },
};

const SEVERITY_META: Record<Severity, { label: string; cls: string }> = {
  none: { label: '无', cls: 'sev-none' },
  low: { label: '低', cls: 'sev-low' },
  medium: { label: '中', cls: 'sev-medium' },
  high: { label: '高', cls: 'sev-high' },
};

const VERDICT_CLS: Record<Verdict, string> = {
  'auto-continue': 'vd-auto',
  skip: 'vd-skip',
  confirm: 'vd-confirm',
  replan: 'vd-replan',
  abort: 'vd-abort',
};

export function StatusPill({ status }: { status: DriftStatus }) {
  const m = STATUS_META[status];
  return <span className={`pill ${m.cls}`}>{m.label}</span>;
}

export function SeverityTag({ severity }: { severity: Severity }) {
  const m = SEVERITY_META[severity];
  return <span className={`tag ${m.cls}`}>危险度 {m.label}</span>;
}

export function VerdictTag({ verdict }: { verdict: Verdict }) {
  return <span className={`tag ${VERDICT_CLS[verdict]}`}>{verdictText(verdict)}</span>;
}

export function StatCard({
  value,
  label,
  tone = 'neutral',
}: {
  value: React.ReactNode;
  label: string;
  tone?: 'neutral' | 'good' | 'warn' | 'bad';
}) {
  return (
    <div className={`stat stat-${tone}`}>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}
