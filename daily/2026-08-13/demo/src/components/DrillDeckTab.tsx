import { useMemo, useState } from 'react';
import { DRILLS, HABITS, MOCK_STREAK_DAYS } from '../data/mock';
import { buildGapMap, checkDrill, drillsForHabit, masteryOf } from '../engine';
import type { DrillVerdict } from '../engine';
import type { Drill, HabitType, Progress } from '../types';
import { HabitTag, Pill } from './shared';

function DrillCard({
  drill,
  done,
  onCorrect,
}: {
  drill: Drill;
  done: boolean;
  onCorrect: () => void;
}) {
  const [answer, setAnswer] = useState('');
  const [verdict, setVerdict] = useState<DrillVerdict | null>(null);
  const [showSample, setShowSample] = useState(false);
  const meta = HABITS[drill.habit];

  function submit() {
    const v = checkDrill(drill, answer);
    setVerdict(v);
    if (v === 'correct') {
      setShowSample(true);
      if (!done) onCorrect();
    }
  }

  return (
    <div className={`drill ${done ? 'drill-done' : ''}`} style={{ ['--hc' as string]: meta.color }}>
      <div className="drill-top">
        <HabitTag meta={meta} small />
        <span className="drill-prompt">{drill.promptCn}</span>
        {done && <Pill tone="good">已完成 ✓</Pill>}
      </div>

      <div className="drill-stem">{drill.stem}</div>

      <div className="drill-input">
        <input
          type="text"
          value={answer}
          placeholder="用更地道的说法重写……"
          onChange={(e) => {
            setAnswer(e.target.value);
            setVerdict(null);
          }}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
        />
        <button className="btn-check" onClick={submit}>
          检查
        </button>
      </div>

      <div className="drill-hint">💡 {drill.hint}</div>

      {verdict === 'correct' && <div className="verdict good">对了！这就是母语者的说法 👏</div>}
      {verdict === 'close' && (
        <div className="verdict close">
          接近了，但还没到点子上——再想想提示。
          <button className="link" onClick={() => setShowSample(true)}>
            看参考答案
          </button>
        </div>
      )}
      {verdict === 'retry' && (
        <div className="verdict retry">
          先动手改一改这句吧。
          <button className="link" onClick={() => setShowSample(true)}>
            看参考答案
          </button>
        </div>
      )}

      {showSample && (
        <div className="drill-sample">
          <div className="ds-line">
            <span className="ds-label">参考</span>
            {drill.sample}
          </div>
          <div className="ds-explain">{drill.explain}</div>
        </div>
      )}
    </div>
  );
}

export default function DrillDeckTab({
  progress,
  setProgress,
}: {
  progress: Progress;
  setProgress: React.Dispatch<React.SetStateAction<Progress>>;
}) {
  const [done, setDone] = useState<Record<string, boolean>>({});

  // 按习惯频次排序展示练习（优先补最常犯的）。
  const ordered = useMemo(() => {
    const aggOrder = buildGapMap(progress).map((a) => a.meta.id);
    return [...DRILLS].sort((a, b) => aggOrder.indexOf(a.habit) - aggOrder.indexOf(b.habit));
  }, [progress]);

  function markCorrect(habit: HabitType, drillId: string) {
    setDone((d) => ({ ...d, [drillId]: true }));
    setProgress((p) => {
      const total = drillsForHabit(habit).length;
      return { ...p, [habit]: Math.min(total, p[habit] + 1) };
    });
  }

  const aggs = buildGapMap(progress).filter((a) => a.drillCount > 0);
  const converged = aggs.filter((a) => masteryOf(a.meta.id, progress) >= 100).length;
  const pending = aggs.length - converged;
  const doneCount = Object.values(done).filter(Boolean).length;

  return (
    <div className="tab">
      <div className="tab-head">
        <h2>补差牌组 · 只练你的习惯</h2>
        <p className="muted">
          这些练习不是通用课程，而是<strong>按你图谱里的 Top 习惯自动生成</strong>的间隔微练习。
          练对一道，「我的口音图谱」里对应习惯的收敛进度就会实时上升。
        </p>
      </div>

      <div className="progress-bar-card">
        <div className="pgc-item">
          <div className="pgc-num good">{converged}</div>
          <div className="pgc-label">习惯已收敛</div>
        </div>
        <div className="pgc-item">
          <div className="pgc-num warn">{pending}</div>
          <div className="pgc-label">习惯待练</div>
        </div>
        <div className="pgc-item">
          <div className="pgc-num">{doneCount}</div>
          <div className="pgc-label">本次已练</div>
        </div>
        <div className="pgc-item">
          <div className="pgc-num">🔥 {MOCK_STREAK_DAYS}</div>
          <div className="pgc-label">连续练习天（mock）</div>
        </div>
      </div>

      <div className="deck">
        {ordered.map((d) => (
          <DrillCard
            key={d.id}
            drill={d}
            done={!!done[d.id]}
            onCorrect={() => markCorrect(d.habit, d.id)}
          />
        ))}
      </div>

      {converged === aggs.length && aggs.length > 0 && (
        <div className="all-done">🎉 本轮 Top 习惯已全部收敛。真实产品会在你下一批产出里重新采样，看它们是否复发。</div>
      )}
    </div>
  );
}
