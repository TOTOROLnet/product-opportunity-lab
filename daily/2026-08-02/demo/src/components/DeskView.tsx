// 换挡台 —— 厂商话术(划掉) vs 诚实每成功任务成本 + 大裁决卡。
import { analyze, fmtDelta, fmtPct, fmtMoney, monthlyCost, fmtRatio } from '../logic/engine';
import type { Workload } from '../types';
import { Card, Stat, VERDICT_META, REASON_TEXT, remediations } from './shared';

export default function DeskView({ workload }: { workload: Workload }) {
  const w = workload;
  const a = analyze(w);
  const meta = VERDICT_META[a.verdict];

  const monthA = monthlyCost(a.cpsA, w.tasksPerMonth);
  const monthB = monthlyCost(a.cpsB, w.tasksPerMonth);
  const monthDelta = monthB - monthA;

  return (
    <div className="view">
      <p className="scene">{w.scene}</p>

      <div className="desk-grid">
        {/* 厂商话术 */}
        <Card className="vanity">
          <div className="mini-title">厂商话术 · 表面单价</div>
          <div className="vanity-line">
            <span className="strike">{fmtDelta(a.vanityRatio)}</span>
            <span className="vanity-tag">输出单价</span>
          </div>
          <div className="vanity-note">
            「换个模型 ID 就享受成本红利」—— 但 $/token 是<strong>虚荣指标</strong>，
            它没算你的步数膨胀、成功率与真实缓存命中。
          </div>
        </Card>

        {/* 诚实读数 */}
        <Card className="honest" style={{ borderColor: meta.color }}>
          <div className="mini-title" style={{ color: meta.color }}>
            诚实读数 · 每成功任务成本
          </div>
          <div className="honest-line" style={{ color: meta.color }}>
            {fmtDelta(a.costRatio)}
            <span className="honest-ratio">（{fmtRatio(a.costRatio)}）</span>
          </div>
          <div className="honest-subs">
            <Stat
              label="成功率 A→B"
              value={
                <span>
                  {fmtPct(w.A.success)} → {fmtPct(w.B.success)}
                </span>
              }
              sub={`底线 ${fmtPct(w.floor)} · Δ ${a.successDelta >= 0 ? '+' : ''}${(
                a.successDelta * 100
              ).toFixed(0)}pt`}
              tone={w.B.success < w.floor ? 'bad' : 'good'}
            />
            <Stat
              label="每任务成本比"
              value={fmtDelta(a.B.costPerTask / a.A.costPerTask)}
              sub="（按 token 算，通常更便宜）"
              tone="muted"
            />
            <Stat
              label="步数膨胀"
              value={`${w.B.stepMult.toFixed(2)}×`}
              sub={`输出啰嗦 ${w.B.verbosity.toFixed(2)}×`}
              tone="muted"
            />
          </div>
        </Card>
      </div>

      {/* 大裁决卡 */}
      <Card className="verdict-card" style={{ borderColor: meta.color, background: meta.soft }}>
        <div className="verdict-head">
          <div className="verdict-big" style={{ color: meta.color }}>
            {meta.label}
          </div>
          <div className="verdict-money">
            <span className="vm-label">按 {(w.tasksPerMonth / 1000).toFixed(0)}k 任务/月估算</span>
            <span className="vm-value">
              {fmtMoney(monthA)} → {fmtMoney(monthB)}
              <span
                className="vm-delta"
                style={{ color: monthDelta <= 0 ? '#38d39f' : '#ff6b6b' }}
              >
                {monthDelta <= 0 ? '省 ' : '多花 '}
                {fmtMoney(Math.abs(monthDelta))}/月
              </span>
            </span>
          </div>
        </div>
        <div className="verdict-reason">{REASON_TEXT[a.reasonKey]}</div>
        <div className="verdict-action">{meta.action}</div>
        <ul className="rem-list">
          {remediations(a.verdict).map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ul>
      </Card>

      <p className="disclaimer">
        ⚠️ 方法论演示 · 全部数值为 mock，非真实跑分。核心公式：
        <code>每成功任务成本 = 每任务成本 ÷ 成功率</code>
        —— 把成本与能力耦合进同一个数。真实使用时把「B 的成功率/步数」换成你自己 trace 的重放实测。
      </p>
    </div>
  );
}
