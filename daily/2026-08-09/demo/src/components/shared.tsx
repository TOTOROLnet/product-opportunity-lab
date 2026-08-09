import type { Verdict, Env } from '../types';

export const VERDICT_META: Record<Verdict, { label: string; cls: string }> = {
  unique: { label: '唯一正确', cls: 'v-unique' },
  ambiguous: { label: '多义', cls: 'v-ambiguous' },
  dangerous: { label: '危险近邻', cls: 'v-dangerous' },
  blindspot: { label: '盲区', cls: 'v-blindspot' },
};

export function VerdictBadge({ v }: { v: Verdict }) {
  const m = VERDICT_META[v];
  return (
    <span className={`vbadge ${m.cls}`}>
      <span className="dot" />
      {m.label}
    </span>
  );
}

export function EnvTag({ env }: { env: Env }) {
  if (env === 'none') return null;
  const label = env === 'prod' ? '生产' : '暂存';
  return <span className={`tag env-${env}`}>{label}</span>;
}

export function ScoreBar({ score, max }: { score: number; max: number }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (score / max) * 100)) : 0;
  return (
    <span className="bar" title={`匹配分 ${score}`}>
      <span style={{ width: `${pct}%` }} />
    </span>
  );
}
