import { useMemo, useState } from 'react';
import { HABITS, TASKS } from '../data/mock';
import { highlightLearner } from '../engine';
import type { Task } from '../types';
import { HabitTag } from './shared';

export default function PracticeTab({ onGoMap }: { onGoMap: () => void }) {
  const [taskId, setTaskId] = useState<string>(TASKS[0].id);
  const [revealed, setRevealed] = useState(false);
  const [activeSpan, setActiveSpan] = useState<number | null>(null);

  const task = useMemo<Task>(() => TASKS.find((t) => t.id === taskId)!, [taskId]);
  const tokens = useMemo(() => highlightLearner(task), [task]);

  function pick(id: string) {
    setTaskId(id);
    setRevealed(false);
    setActiveSpan(null);
  }

  return (
    <div className="tab">
      <div className="tab-head">
        <h2>今日一练 · 从你的真实产出出发</h2>
        <p className="muted">
          选一个真实工作场景，就它自由地写一段英文。这里用 3 段贴合中文母语者的 mock 产出演示——
          点「母语改写对齐」看差距，再点任一处高亮看「为什么 + 母语说法」。
        </p>
      </div>

      <div className="task-picker">
        {TASKS.map((t) => (
          <button key={t.id} className={`task-chip ${t.id === taskId ? 'active' : ''}`} onClick={() => pick(t.id)}>
            <span className="chan">{t.channel}</span>
            {t.title}
          </button>
        ))}
      </div>

      <div className="card scenario">
        <div className="scenario-label">要表达的意图</div>
        <div className="scenario-text">{task.prompt}</div>
      </div>

      <div className="compare">
        <div className="col">
          <div className="col-head">
            <span className="col-title">你的产出</span>
            <span className="col-sub">survival English · 能被听懂</span>
          </div>
          <div className="prose learner">
            {tokens.map((tk, i) =>
              tk.habit ? (
                <mark
                  key={i}
                  className={`hi ${activeSpan === tk.spanIndex ? 'hi-active' : ''}`}
                  style={{ ['--hc' as string]: HABITS[tk.habit].color }}
                  onClick={() => setActiveSpan(tk.spanIndex!)}
                  title="点我看为什么"
                >
                  {tk.text}
                </mark>
              ) : (
                <span key={i}>{tk.text}</span>
              )
            )}
          </div>
        </div>

        <div className="col">
          <div className="col-head">
            <span className="col-title">母语者会这么说</span>
            <span className="col-sub">natural English · 发音之上的地道度</span>
          </div>
          {revealed ? (
            <div className="prose native">{task.nativeRewrite}</div>
          ) : (
            <button className="reveal" onClick={() => setRevealed(true)}>
              母语改写对齐 →
            </button>
          )}
        </div>
      </div>

      <div className="diff-list">
        <div className="diff-head">
          <span>差异清单（按习惯类型归类）</span>
          <span className="muted small">共 {task.spans.length} 处 · 模拟 AI 引擎标注</span>
        </div>
        {task.spans.map((s, i) => {
          const meta = HABITS[s.habit];
          return (
            <div
              key={i}
              className={`diff-item ${activeSpan === i ? 'diff-active' : ''}`}
              style={{ ['--hc' as string]: meta.color }}
              onMouseEnter={() => setActiveSpan(i)}
            >
              <div className="diff-top">
                <HabitTag meta={meta} small />
              </div>
              <div className="diff-body">
                <div className="frag learner-frag">✗ {s.learner}</div>
                <div className="frag native-frag">✓ {s.native}</div>
                <div className="frag note">{s.note}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="cta-row">
        <p className="muted small">
          这些差异不是孤立的——把 3 段产出放一起，就会看到你<strong>反复出现</strong>的那几个习惯。
        </p>
        <button className="btn-primary" onClick={onGoMap}>
          看我的口音图谱 →
        </button>
      </div>
    </div>
  );
}
