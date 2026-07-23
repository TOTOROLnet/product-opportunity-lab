import type { DiagnosisResult, SignatureId } from '../types';
import { SIGNATURES } from '../data/corpus';
import { CompareBar, Gauge, Pill } from './ui';
import { pct } from './ui';

export function ProgressView({
  base,
  live,
  mastered,
  onGoMoves,
}: {
  base: DiagnosisResult;
  live: DiagnosisResult;
  mastered: Set<SignatureId>;
  onGoMoves: () => void;
}) {
  const delta = live.proficiency - base.proficiency;
  const masteredList = [...mastered];
  // 还没掌握、但仍在拖后腿的失手（残余影响力最高的未掌握项）
  const remaining = live.perSignature.filter((d) => !mastered.has(d.signature.id));

  return (
    <div className="view">
      <section className="panel prog-hero">
        <div className="prog-hero-left">
          <h2>你的长进</h2>
          <p className="panel-sub">
            掌握的招式越多，指标越好——但这是<b>教练不是魔法</b>：习惯要练，指数不会瞬间满分。
          </p>
          <div className="mastered-chips">
            {masteredList.length === 0 ? (
              <span className="empty-hint">还没掌握任何招式。去「招式库」练一招，回来看变化。</span>
            ) : (
              masteredList.map((id) => (
                <Pill key={id} tone="good">
                  {SIGNATURES[id].emoji} {SIGNATURES[id].name} ✓
                </Pill>
              ))
            )}
          </div>
        </div>
        <div className="prog-hero-right">
          <Gauge score={live.proficiency} delta={delta} />
          <div className="prog-updown">
            生手基线 <b>{base.proficiency}</b> → 现在 <b>{live.proficiency}</b>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>生手 vs 上手后（随你掌握的招式实时变化）</h2>
        </div>
        <div className="cmp-grid">
          <CompareBar
            label="一次过率（越高越好）"
            before={base.firstPassRate}
            after={live.firstPassRate}
            max={1}
            fmt={pct}
          />
          <CompareBar
            label="平均返工轮数（越低越好）"
            before={base.avgRounds}
            after={live.avgRounds}
            max={base.avgRounds}
            fmt={(n) => `${n} 轮`}
            betterWhenLower
          />
          <CompareBar
            label="放弃率（越低越好）"
            before={base.gaveupRate}
            after={live.gaveupRate}
            max={Math.max(0.2, base.gaveupRate)}
            fmt={pct}
            betterWhenLower
          />
          <CompareBar
            label="将就率（越低越好）"
            before={base.settledRate}
            after={live.settledRate}
            max={Math.max(0.5, base.settledRate)}
            fmt={pct}
            betterWhenLower
          />
        </div>
      </section>

      <section className="panel honest">
        <div className="panel-head">
          <h2>诚实提示：还在拖后腿的习惯</h2>
        </div>
        {remaining.length === 0 ? (
          <p className="panel-sub">
            你已掌握全部招式——但注意：残余影响仍在（每招修复约 70%），所以上手指数上限约 {live.proficiency}，
            这是行为习惯的真实上限，不是产品在藏功劳。
          </p>
        ) : (
          <>
            <p className="panel-sub">这些失手你还没练招式，仍在消耗你的效率——它们是你最值得下一个攻克的：</p>
            <div className="remain-list">
              {remaining.slice(0, 3).map((d) => (
                <div key={d.signature.id} className="remain-item">
                  <span className="remain-emoji">{d.signature.emoji}</span>
                  <span className="remain-name">{d.signature.name}</span>
                  <span className="remain-stat">
                    仍出现 {d.frequency} 次 · 影响力 {d.impact}
                  </span>
                  <button className="btn btn-ghost btn-sm" onClick={onGoMoves}>
                    去练 →
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
