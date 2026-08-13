import { useMemo, useState } from 'react';
import { buildGapMap, masteryOf, profileSummary } from '../engine';
import type { HabitType, Progress } from '../types';
import { Bar, HabitTag, Pill } from './shared';

export default function GapMapTab({ progress, onGoDrill }: { progress: Progress; onGoDrill: () => void }) {
  const aggs = useMemo(() => buildGapMap(progress), [progress]);
  const [openId, setOpenId] = useState<HabitType | null>(null);
  const summary = useMemo(() => profileSummary(aggs), [aggs]);

  return (
    <div className="tab">
      <div className="tab-head">
        <h2>我的口音图谱 · 你反复出现的习惯</h2>
        <p className="muted">
          分析单位不是词、不是音素、不是单句错误，而是<strong>你反复出现的产出习惯</strong>。
          这正是与逐条改错工具（Grammarly）、发音评分（ELSA/Linforge）的本质区别。
        </p>
      </div>

      <div className="card summary">
        <div className="summary-icon">🎯</div>
        <div>
          <div className="summary-title">你的地道度画像</div>
          <div className="summary-text">{summary}</div>
        </div>
      </div>

      <div className="habit-list">
        {aggs.map((a) => {
          const mastery = masteryOf(a.meta.id, progress);
          const converged = mastery >= 100 && a.drillCount > 0;
          const open = openId === a.meta.id;
          return (
            <div key={a.meta.id} className={`habit-card ${converged ? 'converged' : ''}`}>
              <div className="habit-main" onClick={() => setOpenId(open ? null : a.meta.id)}>
                <div className="habit-left">
                  <HabitTag meta={a.meta} />
                  <span className="habit-en">{a.meta.en}</span>
                </div>
                <div className="habit-right">
                  <span className="freq">
                    出现 <strong>{a.freq}</strong> 次
                  </span>
                  {a.drillCount > 0 ? (
                    converged ? (
                      <Pill tone="good">已收敛 ✓</Pill>
                    ) : mastery > 0 ? (
                      <Pill tone="warn">巩固 {mastery}%</Pill>
                    ) : (
                      <Pill>待练</Pill>
                    )
                  ) : (
                    <Pill>无补差练习</Pill>
                  )}
                  <span className={`chev ${open ? 'up' : ''}`}>▾</span>
                </div>
              </div>

              <div className="habit-desc">{a.meta.desc}</div>

              {a.drillCount > 0 && (
                <div className="habit-progress">
                  <span className="pg-label">收敛进度</span>
                  <Bar value={mastery} color={a.meta.color} />
                  <span className="pg-num">{mastery}%</span>
                </div>
              )}

              {open && (
                <div className="instances">
                  <div className="ins-head">在各任务里的实例（下钻）</div>
                  {a.instances.map((ins, i) => (
                    <div key={i} className="ins">
                      <div className="ins-task">{ins.taskTitle}</div>
                      <div className="ins-frag ins-bad">✗ {ins.learner}</div>
                      <div className="ins-frag ins-good">✓ {ins.native}</div>
                      <div className="ins-note">{ins.note}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="cta-row">
        <p className="muted small">
          下一步：只针对上面这几个习惯做<strong>间隔微练习</strong>，练一道，这里的频次条就会实时收敛。
        </p>
        <button className="btn-primary" onClick={onGoDrill}>
          去补差牌组 →
        </button>
      </div>
    </div>
  );
}
