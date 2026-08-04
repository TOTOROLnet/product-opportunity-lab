import { useMemo } from 'react';
import { weeklyReadout } from '../logic/engine';
import { WEEK, DAY_NAMES } from '../data/sessions';
import { C, StatChip } from './shared';

export default function ProgressView() {
  const w = useMemo(() => weeklyReadout(WEEK, DAY_NAMES), []);
  const maxClaimed = Math.max(...w.days.map((d) => d.claimed), 1);

  // 深度趋势折线（SVG）。
  const W = 340;
  const H = 130;
  const padL = 34;
  const padR = 12;
  const padT = 14;
  const padB = 24;
  const dom = [50, 100];
  const xAt = (i: number) => padL + (i / (w.days.length - 1)) * (W - padL - padR);
  const yAt = (v: number) => padT + (1 - (v - dom[0]) / (dom[1] - dom[0])) * (H - padT - padB);
  const pts = w.days.map((d, i) => `${xAt(i)},${yAt(d.medDepth)}`).join(' ');

  return (
    <div>
      <div className="card">
        <div className="view-head">
          <div>
            <h2>诚实进度 · 本周</h2>
            <p className="muted small">只拿「真看清并计入」的次数与动作质量说话，不用虚荣总次数糊弄你。</p>
          </div>
        </div>
        <div className="readout">
          <p>
            这一周你以为做了 <b>{w.totalClaimed}</b> 次，有数只认可信的 <b style={{ color: C.good }}>{w.totalTrusted}</b> 次
            （<b>{w.trustPct}%</b>）——其余是没看清或喊停后硬撑的<b style={{ color: C.unseen }}>水分</b>。
          </p>
          <p>
            但真进步实打实：深蹲深度中位数从 <b>{w.depthStart}%</b> 涨到 <b style={{ color: C.good }}>{w.depthEnd}%</b>
            （<b style={{ color: C.good }}>+{w.depthDelta}</b>）。
            仍有 <b style={{ color: C.stop }}>{w.fatigueDays}</b> 天在后半段硬撑掉深度 → 下周建议每组少 2 次、把质量守住。
          </p>
        </div>
        <div className="readout-stats">
          <StatChip label="以为做了" value={w.totalClaimed} sub="虚荣总次数" />
          <StatChip label="可信计入" value={w.totalTrusted} color={C.good} sub={`${w.trustPct}% 可信`} />
          <StatChip label="深度进步" value={`+${w.depthDelta}`} color={C.good} sub={`${w.depthStart}→${w.depthEnd}%`} />
          <StatChip label="仍硬撑" value={`${w.fatigueDays} 天`} color={C.stop} sub="后半段掉深度" />
        </div>
      </div>

      <div className="two-col">
        <div className="card">
          <h4>每天：你以为的次数 vs 可信次数</h4>
          <div className="daybars">
            {w.days.map((d) => {
              const trustedW = (d.trusted / maxClaimed) * 100;
              const waterW = ((d.claimed - d.trusted) / maxClaimed) * 100;
              return (
                <div key={d.day} className="daybar-row">
                  <span className="db-day">{d.day}</span>
                  <div className="db-track">
                    <div className="db-trusted" style={{ width: trustedW + '%' }} title={`可信 ${d.trusted}`}>
                      {d.trusted}
                    </div>
                    {waterW > 0 && (
                      <div className="db-water" style={{ width: waterW + '%' }} title={`水分 ${d.claimed - d.trusted}（看不清/硬撑）`}>
                        +{d.claimed - d.trusted}
                      </div>
                    )}
                  </div>
                  <span className="db-ex muted small">{d.exercise}</span>
                </div>
              );
            })}
          </div>
          <div className="daybar-legend small muted">
            <span><i style={{ background: C.good }} /> 可信计入</span>
            <span><i style={{ background: C.unseen }} /> 水分（看不清 / 硬撑）</span>
          </div>
        </div>

        <div className="card">
          <h4>动作质量趋势（深度中位数）</h4>
          <svg viewBox={`0 0 ${W} ${H}`} className="trend" role="img" aria-label="深度中位数趋势">
            {[60, 80, 100].map((g) => (
              <g key={g}>
                <line x1={padL} y1={yAt(g)} x2={W - padR} y2={yAt(g)} stroke="var(--line)" strokeWidth="1" />
                <text x={padL - 6} y={yAt(g) + 3} textAnchor="end" fontSize="10" fill="var(--muted2)">
                  {g}
                </text>
              </g>
            ))}
            <line x1={padL} y1={yAt(80)} x2={W - padR} y2={yAt(80)} stroke={C.good} strokeWidth="1" strokeDasharray="4 4" opacity="0.5" />
            <polyline points={pts} fill="none" stroke={C.accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            {w.days.map((d, i) => (
              <g key={d.day}>
                <circle cx={xAt(i)} cy={yAt(d.medDepth)} r="3.5" fill={C.accent} />
                <text x={xAt(i)} y={H - 8} textAnchor="middle" fontSize="10" fill="var(--muted2)">
                  {d.day.replace('周', '')}
                </text>
              </g>
            ))}
          </svg>
          <p className="muted small">虚线为达标线 80%。深度中位数稳步上移 = 真进步；这条线不受「看不清 / 硬撑」的虚荣次数污染。</p>
        </div>
      </div>
    </div>
  );
}
