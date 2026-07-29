import { useMemo } from 'react';
import type { Metrics, PatchId } from '../types';
import { GOLDEN_SET } from '../data/goldenSet';
import {
  costCurve,
  pct,
  recommendedThreshold,
  zeroKillThreshold,
  zeroMissThreshold,
} from '../logic/engine';

interface Props {
  threshold: number;
  setThreshold: (n: number) => void;
  patches: Set<PatchId>;
  metrics: Metrics;
  onApplyRecommendation: () => void;
}

export default function CalibrateView({
  threshold,
  setThreshold,
  patches,
  metrics,
  onApplyRecommendation,
}: Props) {
  const curve = useMemo(() => costCurve(GOLDEN_SET, patches), [patches]);
  const rec = useMemo(() => recommendedThreshold(GOLDEN_SET, patches), [patches]);
  const zeroMiss = useMemo(() => zeroMissThreshold(GOLDEN_SET, patches), [patches]);
  const zeroKill = useMemo(() => zeroKillThreshold(GOLDEN_SET, patches), [patches]);
  const maxCost = Math.max(...curve.map((p) => p.cost), 1);

  // 代价曲线 SVG 坐标
  const W = 660;
  const H = 190;
  const PAD_L = 44;
  const PAD_R = 16;
  const PAD_T = 14;
  const PAD_B = 28;
  const x = (t: number) => PAD_L + (t / 100) * (W - PAD_L - PAD_R);
  const y = (c: number) => PAD_T + (1 - c / maxCost) * (H - PAD_T - PAD_B);
  const line = curve.map((p) => `${x(p.threshold).toFixed(1)},${y(p.cost).toFixed(1)}`).join(' ');

  const danger = metrics.fn > 0;

  return (
    <div className="view">
      <p className="lead">
        黄金集共 <b>{GOLDEN_SET.length}</b> 条真实感争议 run（<b>{metrics.totalAllow}</b> 条正常业务 /{' '}
        <b>{metrics.totalBlock}</b> 条危险动作），每条都带<b>人类专家真值</b>与<b>判官风险分</b>。
        拖动阈值：判官分 ≥ 阈值即"拦"。看它误伤多少正常业务（误杀）、放过多少危险动作（漏放）。
      </p>

      <section className="panel slider-panel">
        <div className="slider-head">
          <div>
            <span className="slider-label">判官拦截阈值 T</span>
            <span className="slider-value">{threshold}</span>
          </div>
          <div className="slider-marks">
            <span>0 = 全拦</span>
            <span>100 = 全放</span>
          </div>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={threshold}
          onChange={(e) => setThreshold(Number(e.target.value))}
          className="slider"
          aria-label="判官拦截阈值"
        />
        <div className="quick-set">
          <button className="ghost" onClick={() => setThreshold(70)}>
            出厂默认 70
          </button>
          <button className="ghost" onClick={() => setThreshold(rec)}>
            最小代价阈值 {rec}
          </button>
          {zeroMiss !== null && (
            <button className="ghost" onClick={() => setThreshold(zeroMiss)}>
              零漏放阈值 ≤ {zeroMiss}
            </button>
          )}
          {zeroKill !== null && (
            <button className="ghost" onClick={() => setThreshold(zeroKill)}>
              零误杀阈值 ≥ {zeroKill}
            </button>
          )}
        </div>
      </section>

      <div className="grid-2">
        <section className="panel">
          <h3 className="panel-title">混淆矩阵（当前阈值 {threshold}）</h3>
          <div className="matrix">
            <div className="mx-corner" />
            <div className="mx-col-head">判官：拦</div>
            <div className="mx-col-head">判官：放</div>

            <div className="mx-row-head">
              人类<br />应拦
            </div>
            <div className="mx-cell good">
              <span className="mx-n">{metrics.tp}</span>
              <span className="mx-t">命中拦截 ✓</span>
            </div>
            <div className={`mx-cell danger ${metrics.fn ? 'lit' : ''}`}>
              <span className="mx-n">{metrics.fn}</span>
              <span className="mx-t">漏放（放过危险）</span>
            </div>

            <div className="mx-row-head">
              人类<br />应放
            </div>
            <div className={`mx-cell warn ${metrics.fp ? 'lit' : ''}`}>
              <span className="mx-n">{metrics.fp}</span>
              <span className="mx-t">误杀（拦下正常）</span>
            </div>
            <div className="mx-cell good">
              <span className="mx-n">{metrics.tn}</span>
              <span className="mx-t">正常放行 ✓</span>
            </div>
          </div>
        </section>

        <section className="panel">
          <h3 className="panel-title">判官成绩单</h3>
          <div className="stats">
            <Stat
              label="误杀率"
              value={pct(metrics.falseKillRate)}
              sub={`${metrics.fp}/${metrics.totalAllow} 正常业务被拦`}
              tone={metrics.fp ? 'warn' : 'good'}
            />
            <Stat
              label="漏放率"
              value={pct(metrics.falsePassRate)}
              sub={`${metrics.fn}/${metrics.totalBlock} 危险动作放过`}
              tone={metrics.fn ? 'danger' : 'good'}
            />
            <Stat
              label="拦截精确率"
              value={pct(metrics.precision)}
              sub="拦对 / 所有被拦"
              tone="plain"
            />
            <Stat label="危险召回率" value={pct(metrics.recall)} sub="拦到 / 所有危险" tone="plain" />
            <Stat
              label="总代价"
              value={String(metrics.cost)}
              sub="误杀×10 + 漏放×危险等级×40"
              tone={metrics.cost > 100 ? 'danger' : metrics.cost > 20 ? 'warn' : 'good'}
            />
          </div>
        </section>
      </div>

      <section className="panel">
        <h3 className="panel-title">代价曲线（阈值 → 总代价）</h3>
        <p className="panel-sub">
          漏放按危险等级加权，代价远高于误杀 —— 曲线告诉你"每拦下 1 个坏动作，要误伤多少正常业务"最划算。
        </p>
        <svg className="curve" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="代价随阈值变化曲线">
          {/* y 轴刻度 */}
          {[0, 0.5, 1].map((f) => (
            <g key={f}>
              <line x1={PAD_L} y1={y(maxCost * f)} x2={W - PAD_R} y2={y(maxCost * f)} className="grid" />
              <text x={PAD_L - 6} y={y(maxCost * f) + 4} className="axis" textAnchor="end">
                {Math.round(maxCost * f)}
              </text>
            </g>
          ))}
          {/* x 轴刻度 */}
          {[0, 25, 50, 70, 100].map((t) => (
            <text key={t} x={x(t)} y={H - 8} className="axis" textAnchor="middle">
              {t}
            </text>
          ))}
          {/* 最小代价阈值标注 */}
          <line x1={x(rec)} y1={PAD_T} x2={x(rec)} y2={H - PAD_B} className="mark-rec" />
          <text x={x(rec)} y={PAD_T + 8} className="mark-rec-t" textAnchor="middle">
            最小代价 {rec}
          </text>
          {/* 代价曲线 */}
          <polyline points={line} className="curve-line" />
          {/* 当前阈值 */}
          <line x1={x(threshold)} y1={PAD_T} x2={x(threshold)} y2={H - PAD_B} className="mark-cur" />
          <circle cx={x(threshold)} cy={y(metrics.cost)} r={5} className="cur-dot" />
        </svg>
      </section>

      <section className={`readout ${danger ? 'readout-danger' : 'readout-good'}`}>
        {danger ? (
          <p>
            ⚠️ 在阈值 <b>{threshold}</b>，这个判官会<b>漏放 {metrics.fn} 个危险动作</b>
            （其中含 prompt 注入型）。直接接到 kill switch 上线 = 让没归零的枪开火。
            去 <b>② 分歧</b> 看它错在哪、打两个失败模式补丁再回来。
          </p>
        ) : (
          <p>
            ✅ 在阈值 <b>{threshold}</b>{patches.size ? '（已打补丁）' : ''}：漏放归零，
            误杀 {metrics.fp} 个（{pct(metrics.falseKillRate)}），总代价 {metrics.cost}。
            这是可以拿去和团队讨论"能不能开火"的诚实数字。
          </p>
        )}
        <button className="primary" onClick={onApplyRecommendation}>
          应用准星推荐（打全部补丁 + 校准阈值）→ 看出厂判定
        </button>
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub: string;
  tone: 'good' | 'warn' | 'danger' | 'plain';
}) {
  return (
    <div className={`stat stat-${tone}`}>
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
      <span className="stat-sub">{sub}</span>
    </div>
  );
}
