import type { ArchId } from '../../types';
import { ARCHITECTURES } from '../../data/architectures';

const COLORS: Record<ArchId, string> = {
  'self-vps': '#e0a458',
  local: '#8b93a7',
  'cloud-persistent': '#6aa9ff',
  'edge-ondemand': '#54d1a8',
};

// 不可能三角雷达：隔离 / 可靠 / 单位成本效率三轴，直观展示「无法三者全满」。
export function TriangleRadar({ highlightId }: { highlightId?: ArchId | null }) {
  const W = 360;
  const H = 320;
  const cx = W / 2;
  const cy = H / 2 + 6;
  const R = 110;
  const axes = ['隔离性', '可靠性', '单位成本效率'];
  const angles = [-90, 30, 150].map((d) => (d * Math.PI) / 180);

  const point = (val: number, i: number) => {
    const r = (clamp(val, 0, 100) / 100) * R;
    return [cx + r * Math.cos(angles[i]), cy + r * Math.sin(angles[i])];
  };

  return (
    <div className="chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="不可能三角雷达图">
        {[0.25, 0.5, 0.75, 1].map((f) => {
          const pts = angles
            .map((a) => `${cx + R * f * Math.cos(a)},${cy + R * f * Math.sin(a)}`)
            .join(' ');
          return <polygon key={f} points={pts} fill="none" stroke="#20263a" />;
        })}
        {angles.map((a, i) => {
          const x = cx + R * Math.cos(a);
          const y = cy + R * Math.sin(a);
          const lx = cx + (R + 26) * Math.cos(a);
          const ly = cy + (R + 26) * Math.sin(a);
          return (
            <g key={i}>
              <line x1={cx} y1={cy} x2={x} y2={y} stroke="#2b3350" />
              <text x={lx} y={ly + 4} textAnchor="middle" className="axis-label">
                {axes[i]}
              </text>
            </g>
          );
        })}
        {ARCHITECTURES.map((arch) => {
          const vals = [arch.isolation, arch.reliability, arch.costEfficiency];
          const pts = vals.map((v, i) => point(v, i));
          const d = pts.map((pp) => `${pp[0].toFixed(1)},${pp[1].toFixed(1)}`).join(' ');
          const isHi = highlightId === arch.id;
          return (
            <polygon
              key={arch.id}
              points={d}
              fill={isHi ? hexA(COLORS[arch.id], 0.22) : 'none'}
              stroke={COLORS[arch.id]}
              strokeWidth={isHi ? 2.6 : 1.4}
              strokeOpacity={highlightId && !isHi ? 0.35 : 1}
            />
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
      <p className="chart-note">三轴越靠外越好；没有一种架构能同时把三个角都拉满——这就是不可能三角。</p>
    </div>
  );
}

function clamp(x: number, lo: number, hi: number): number {
  return Math.min(Math.max(x, lo), hi);
}
function hexA(hex: string, a: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r},${g},${b},${a})`;
}
