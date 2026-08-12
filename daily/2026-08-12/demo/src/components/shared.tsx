import type { AttentionKind, DiffLine, Phase } from '../types';

export function phaseColor(phase: Phase): string {
  switch (phase) {
    case '确认目标':
      return 'var(--faint)';
    case '首次尝试':
      return 'var(--accent)';
    case '遇阻转向':
      return 'var(--attention)';
    case '收敛':
      return 'var(--done)';
    case '自我修订':
      return 'var(--self)';
    case '收尾':
      return 'var(--muted)';
    default:
      return 'var(--muted)';
  }
}

export const kindMeta: Record<AttentionKind, { label: string; cls: string }> = {
  assumption: { label: '它替我做的假设', cls: 'assume' },
  looseEnd: { label: '悬而未决', cls: 'loose' },
  selfEdit: { label: '它给自己改了什么', cls: 'self' },
};

export function DiffView({ diff }: { diff: DiffLine[] }) {
  if (!diff.length) return null;
  return (
    <div className="diff mono">
      {diff.map((d, i) => (
        <div key={i} className={`dl ${d.kind}`}>
          {d.text}
        </div>
      ))}
    </div>
  );
}

export function PhaseTag({ phase }: { phase: Phase }) {
  const c = phaseColor(phase);
  return (
    <span
      className="phase-tag"
      style={{ color: c, background: 'var(--bg2)', border: `1px solid ${c}` }}
    >
      {phase}
    </span>
  );
}
