import type { Verdict } from '../types';

export const VERDICT_LABEL: Record<Verdict, string> = {
  advance: '通过',
  maybe: '待定',
  reject: '拒',
};

export function VerdictBadge({ v, size = 'md' }: { v: Verdict; size?: 'sm' | 'md' }) {
  return <span className={`verdict verdict-${v} verdict-${size}`}>{VERDICT_LABEL[v]}</span>;
}

// 环形进度：显示 0..1 的一致率。
export function Gauge({
  value,
  label,
  sub,
  size = 128,
}: {
  value: number;
  label?: string;
  sub?: string;
  size?: number;
}) {
  const pct = Math.round(value * 100);
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - value);
  const hue = Math.round(value * 130); // 红→绿
  return (
    <div className="gauge" style={{ width: size }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`hsl(${hue} 70% 55%)`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset .5s ease, stroke .5s ease' }}
        />
        <text x="50%" y="48%" textAnchor="middle" dominantBaseline="middle" className="gauge-num">
          {pct}%
        </text>
        {sub && (
          <text x="50%" y="66%" textAnchor="middle" dominantBaseline="middle" className="gauge-sub">
            {sub}
          </text>
        )}
      </svg>
      {label && <div className="gauge-label">{label}</div>}
    </div>
  );
}

export function FeatureChips({
  features,
}: {
  features: {
    prodBackend: boolean;
    claimsFullstack: boolean;
    oss: boolean;
    domainMatch: boolean;
    jobHopping: boolean;
    overclaim: boolean;
  };
}) {
  const chips: Array<{ label: string; tone: 'good' | 'warn' | 'bad' | 'neutral' }> = [];
  if (features.prodBackend) chips.push({ label: '生产级后端', tone: 'good' });
  if (features.domainMatch) chips.push({ label: '领域匹配·支付', tone: 'good' });
  if (features.oss) chips.push({ label: '相关开源产出', tone: 'good' });
  if (features.claimsFullstack) chips.push({ label: '自述全栈', tone: 'warn' });
  if (features.jobHopping) chips.push({ label: '频繁跳槽', tone: 'warn' });
  if (features.overclaim) chips.push({ label: '疑似夸大', tone: 'bad' });
  if (chips.length === 0) chips.push({ label: '无突出信号', tone: 'neutral' });
  return (
    <div className="chips">
      {chips.map((c) => (
        <span key={c.label} className={`chip chip-${c.tone}`}>
          {c.label}
        </span>
      ))}
    </div>
  );
}
