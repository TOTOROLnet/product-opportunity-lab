import type { ClaimStatus, SourceKind } from '../types';

export function FreshnessGauge({
  score,
  size = 96,
}: {
  score: number;
  size?: number;
}) {
  const r = size / 2 - 8;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - score / 100);
  const color = score >= 90 ? 'var(--green)' : score >= 70 ? 'var(--amber)' : 'var(--red)';
  return (
    <div className="gauge" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--track)"
          strokeWidth={8}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset .5s ease, stroke .3s ease' }}
        />
      </svg>
      <div className="gauge-label" style={{ color }}>
        <span className="gauge-num">{score}</span>
        <span className="gauge-pct">%</span>
      </div>
    </div>
  );
}

const STATUS_TEXT: Record<ClaimStatus, string> = {
  fresh: '鲜',
  stale: '已腐',
  manual: '需人判断',
};

export function StatusBadge({ status }: { status: ClaimStatus }) {
  return <span className={`badge badge-${status}`}>{STATUS_TEXT[status]}</span>;
}

const KIND_TEXT: Record<SourceKind, string> = {
  policy: '政策',
  pricing: '定价',
  api: '接口',
  finance: '财务',
  ops: '运营',
};

export function KindTag({ kind }: { kind: SourceKind }) {
  return <span className={`kind kind-${kind}`}>{KIND_TEXT[kind]}</span>;
}

/** 把模板句子拆成 [前缀, 值, 后缀]，用于高亮句中的"来源值"。 */
export function splitTemplate(template: string, value: string): [string, string, string] {
  const i = template.indexOf('{value}');
  if (i < 0) return [renderPlain(template, value), '', ''];
  return [template.slice(0, i), value, template.slice(i + '{value}'.length)];
}

function renderPlain(template: string, value: string): string {
  return template.replace('{value}', value);
}
