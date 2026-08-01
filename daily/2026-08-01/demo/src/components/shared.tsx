import type { Tier } from '../types';

export const TIER_META: Record<
  Tier,
  { label: string; short: string; cls: string; blurb: string }
> = {
  native: {
    label: '原生 WASM',
    short: 'native',
    cls: 't-native',
    blurb: '进程内直接跑，吃到 254× 红利',
  },
  mount: {
    label: '按需真沙箱',
    short: 'mount',
    cls: 't-mount',
    blurb: '需 mount 真沙箱，拿不到红利、有冷启动尖峰',
  },
  blocked: {
    label: 'WASM 跑不了',
    short: 'blocked',
    cls: 't-blocked',
    blurb: '必须常驻专用真沙箱，迁过去反而更贵',
  },
};

export function TierBadge({ tier }: { tier: Tier }) {
  const m = TIER_META[tier];
  return <span className={`tier-badge ${m.cls}`}>{m.label}</span>;
}

/** 一个横向堆叠条：给定按 tier 分组的数值，画成一条彩色比例条。 */
export function StackBar({
  segments,
  max,
}: {
  segments: { tier: Tier; value: number }[];
  max: number;
}) {
  return (
    <div className="stackbar">
      {segments.map((s, i) =>
        s.value <= 0 ? null : (
          <div
            key={i}
            className={`seg ${TIER_META[s.tier].cls}`}
            style={{ width: `${max > 0 ? (100 * s.value) / max : 0}%` }}
            title={`${TIER_META[s.tier].label}: ${s.value.toFixed(0)}`}
          />
        ),
      )}
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
  value: React.ReactNode;
  sub?: string;
  tone?: string;
}) {
  return (
    <div className={`stat ${tone ?? ''}`}>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {sub ? <div className="stat-sub">{sub}</div> : null}
    </div>
  );
}
