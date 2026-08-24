import type { ArchId, StressAxis, WorkloadProfile } from '../../types';
import { ARCHITECTURES } from '../../data/architectures';
import { AXIS_META, stressScan } from '../../lib/costModel';

const COLORS: Record<ArchId, string> = {
  'self-vps': '#e0a458',
  local: '#8b93a7',
  'cloud-persistent': '#6aa9ff',
  'edge-ondemand': '#54d1a8',
};

// 毛利率 × 某个压力维度：直观展示每种架构在压力下的「毛利转负」点。
export function StressChart({ profile, axis }: { profile: WorkloadProfile; axis: StressAxis }) {
  const { xs, marginByArch } = stressScan(profile, axis);
  const meta = AXIS_META[axis];
  const W = 640;
  const H = 300;
  const padL = 46;
  const padR = 16;
  const padT = 16;
  const padB = 44;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const yMin = -100;
  const yMax = 100;

  const xVal = (u: number) => (meta.logX ? Math.log10(Math.max(u, 1)) : u);
  const xMin = xVal(xs[0]);
  const xMax = xVal(xs[xs.length - 1]);

  const xOf = (u: number) => padL + ((xVal(u) - xMin) / (xMax - xMin || 1)) * plotW;
  const yOf = (m: number) => padT + ((yMax - clamp(m, yMin, yMax)) / (yMax - yMin)) * plotH;

  const zeroY = yOf(0);
  const yTicks = [-100, -50, 0, 50, 100];
  const xTicks = pickXTicks(xs, meta.logX);

  return (
    <div className="chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`毛利率随${meta.label}变化曲线`}>
        {yTicks.map((t) => (
          <g key={t}>
            <line
              x1={padL}
              x2={W - padR}
              y1={yOf(t)}
              y2={yOf(t)}
              stroke={t === 0 ? '#5b6478' : '#20263a'}
              strokeDasharray={t === 0 ? '0' : '3 4'}
            />
            <text x={padL - 8} y={yOf(t) + 4} textAnchor="end" className="axis-label">
              {t}%
            </text>
          </g>
        ))}
        {xTicks.map((t) => (
          <text key={t} x={xOf(t)} y={H - padB + 20} textAnchor="middle" className="axis-label">
            {meta.fmt(t)}
          </text>
        ))}
        <text x={W - padR} y={H - 8} className="axis-title" textAnchor="end">
          {meta.label} →
        </text>

        {ARCHITECTURES.map((arch) => {
          const series = marginByArch[arch.id];
          const d = series
            .map((m, i) => `${i === 0 ? 'M' : 'L'} ${xOf(xs[i]).toFixed(1)} ${yOf(m).toFixed(1)}`)
            .join(' ');
          let cliffIdx = -1;
          for (let i = 1; i < series.length; i++) {
            if (series[i] < 0 && series[i - 1] >= 0) {
              cliffIdx = i;
              break;
            }
          }
          return (
            <g key={arch.id}>
              <path d={d} fill="none" stroke={COLORS[arch.id]} strokeWidth={2.2} />
              {cliffIdx > 0 && (
                <circle cx={xOf(xs[cliffIdx])} cy={zeroY} r={4.5} fill={COLORS[arch.id]} />
              )}
            </g>
          );
        })}
      </svg>
      <div className="legend">
        {ARCHITECTURES.map((a) => (
          <span key={a.id} className="legend-item">
            <i style={{ background: COLORS[a.id] }} /> {a.name}
          </span>
        ))}
      </div>
      <p className="chart-note">
        圆点 = 该架构毛利首次转负的{meta.label}（转负点）。0% 线以下即亏损区。
      </p>
    </div>
  );
}

function pickXTicks(xs: number[], logX: boolean): number[] {
  if (logX) {
    return [10, 100, 1000, 10000, 100000].filter((t) => t >= xs[0] && t <= xs[xs.length - 1]);
  }
  const out: number[] = [];
  for (let i = 0; i < xs.length; i += Math.ceil(xs.length / 6)) out.push(xs[i]);
  if (out[out.length - 1] !== xs[xs.length - 1]) out.push(xs[xs.length - 1]);
  return out;
}

function clamp(x: number, lo: number, hi: number): number {
  return Math.min(Math.max(x, lo), hi);
}
