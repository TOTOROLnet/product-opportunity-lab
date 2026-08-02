// 盈亏平衡 —— 两个滑杆（B 成功率 / B 步数膨胀）实时驱动裁决与成本比曲线。
import { useMemo, useState } from 'react';
import { analyzeWith, fmtDelta, fmtPct, fmtRatio } from '../logic/engine';
import type { Workload } from '../types';
import { Card, VERDICT_META, REASON_TEXT } from './shared';

const W = 580;
const H = 240;
const PAD_L = 44;
const PAD_R = 16;
const PAD_T = 16;
const PAD_B = 34;
const S_MIN = 0.4;
const S_MAX = 1.0;

export default function BreakevenView({ workload }: { workload: Workload }) {
  const w = workload;
  // 滑杆初值取工作负载定义的 B 值
  const [succ, setSucc] = useState(w.B.success);
  const [step, setStep] = useState(w.B.stepMult);

  // 切换工作负载时用 key 重挂载即可（在 App 里处理），此处以 props 为准的初值
  const a = useMemo(() => analyzeWith(w, succ, step), [w, succ, step]);
  const meta = VERDICT_META[a.verdict];

  // 曲线：固定当前步数膨胀，扫描 B 成功率 → 成本比 r
  const curve = useMemo(() => {
    const pts: { s: number; r: number }[] = [];
    const N = 60;
    for (let i = 0; i <= N; i++) {
      const s = S_MIN + ((S_MAX - S_MIN) * i) / N;
      const r = analyzeWith(w, s, step).costRatio;
      pts.push({ s, r });
    }
    return pts;
  }, [w, step]);

  const rMax = useMemo(() => {
    const hi = Math.max(...curve.map((p) => p.r));
    return Math.min(3, Math.max(1.6, hi * 1.05));
  }, [curve]);

  const be = a.breakEvenSuccess; // 盈亏平衡成功率（r=1）

  const xOf = (s: number) => PAD_L + ((s - S_MIN) / (S_MAX - S_MIN)) * (W - PAD_L - PAD_R);
  const yOf = (r: number) => PAD_T + (1 - Math.min(r, rMax) / rMax) * (H - PAD_T - PAD_B);

  const path = curve
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${xOf(p.s).toFixed(1)},${yOf(p.r).toFixed(1)}`)
    .join(' ');

  const y1 = yOf(1); // 盈亏平衡线 r=1
  const beInRange = be >= S_MIN && be <= S_MAX;

  return (
    <div className="view">
      <p className="scene">
        {w.name} · 拖动滑杆看「候选模型 B 的成功率 / 步数」如何决定这笔迁移是赚是亏
      </p>

      <div className="be-grid">
        <Card>
          <div className="mini-title">调参</div>

          <div className="slider-block">
            <div className="slider-head">
              <span>B 成功率</span>
              <strong style={{ color: succ < w.floor ? '#ff6b6b' : '#38d39f' }}>
                {fmtPct(succ)}
              </strong>
            </div>
            <input
              type="range"
              min={S_MIN}
              max={S_MAX}
              step={0.01}
              value={succ}
              onChange={(e) => setSucc(parseFloat(e.target.value))}
            />
            <div className="slider-foot">
              产品可上线底线 {fmtPct(w.floor)} · A 现有 {fmtPct(w.A.success)}
            </div>
          </div>

          <div className="slider-block">
            <div className="slider-head">
              <span>B 步数膨胀</span>
              <strong>{step.toFixed(2)}×</strong>
            </div>
            <input
              type="range"
              min={0.8}
              max={2.0}
              step={0.05}
              value={step}
              onChange={(e) => setStep(parseFloat(e.target.value))}
            />
            <div className="slider-foot">更弱的模型往往要更多轮工具调用/重试 → 步数↑ → 每任务 token↑</div>
          </div>

          <div className="be-readout">
            <div className="ber">
              <span>诚实成本比 r</span>
              <strong style={{ color: meta.color }}>
                {fmtRatio(a.costRatio)}（{fmtDelta(a.costRatio)}）
              </strong>
            </div>
            <div className="ber">
              <span>盈亏平衡成功率</span>
              <strong>{be > 1 ? '>100%（结构性更贵）' : fmtPct(be)}</strong>
            </div>
          </div>

          <div
            className="verdict-inline"
            style={{ borderColor: meta.color, background: meta.soft, color: meta.color }}
          >
            {meta.label}
          </div>
          <div className="verdict-inline-reason">{REASON_TEXT[a.reasonKey]}</div>
        </Card>

        <Card>
          <div className="mini-title">成本比 r vs B 成功率（步数膨胀固定为当前值）</div>
          <svg viewBox={`0 0 ${W} ${H}`} className="be-svg" role="img" aria-label="成本比曲线">
            {/* 轴 */}
            <line x1={PAD_L} y1={PAD_T} x2={PAD_L} y2={H - PAD_B} className="axis" />
            <line x1={PAD_L} y1={H - PAD_B} x2={W - PAD_R} y2={H - PAD_B} className="axis" />

            {/* 盈亏平衡线 r=1 */}
            <line x1={PAD_L} y1={y1} x2={W - PAD_R} y2={y1} className="breakeven-line" />
            <text x={W - PAD_R} y={y1 - 5} className="be-anno" textAnchor="end">
              盈亏平衡 r=1（上方=更贵）
            </text>

            {/* 底线成功率竖线 */}
            {w.floor >= S_MIN && w.floor <= S_MAX && (
              <>
                <line
                  x1={xOf(w.floor)}
                  y1={PAD_T}
                  x2={xOf(w.floor)}
                  y2={H - PAD_B}
                  className="floor-line"
                />
                <text x={xOf(w.floor)} y={PAD_T + 10} className="be-anno" textAnchor="middle">
                  底线 {fmtPct(w.floor)}
                </text>
              </>
            )}

            {/* 曲线 */}
            <path d={path} className="be-curve" style={{ stroke: meta.color }} />

            {/* 当前点 */}
            <circle cx={xOf(succ)} cy={yOf(a.costRatio)} r={5} style={{ fill: meta.color }} />

            {/* 盈亏平衡点 */}
            {beInRange && (
              <circle cx={xOf(be)} cy={y1} r={4} className="be-dot" />
            )}

            {/* 轴标 */}
            <text x={PAD_L - 6} y={yOf(1)} className="tick" textAnchor="end" dominantBaseline="middle">
              1.0×
            </text>
            <text x={PAD_L - 6} y={yOf(rMax)} className="tick" textAnchor="end" dominantBaseline="middle">
              {rMax.toFixed(1)}×
            </text>
            <text x={xOf(S_MIN)} y={H - PAD_B + 16} className="tick" textAnchor="middle">
              {fmtPct(S_MIN)}
            </text>
            <text x={xOf(S_MAX)} y={H - PAD_B + 16} className="tick" textAnchor="middle">
              {fmtPct(S_MAX)}
            </text>
            <text x={(PAD_L + W - PAD_R) / 2} y={H - 4} className="tick" textAnchor="middle">
              B 成功率 →
            </text>
          </svg>
          <div className="be-hint">
            曲线越靠上越贵。当 B 成功率低于盈亏平衡点，即使 token 更便宜，
            <strong>每个成功任务也比现有模型更贵</strong>——这正是「换个 ID 就享受」骗你的地方。
          </div>
        </Card>
      </div>
    </div>
  );
}
