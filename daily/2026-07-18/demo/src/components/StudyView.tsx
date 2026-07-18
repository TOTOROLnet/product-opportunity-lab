import type { ModelState, Question, SelectionScore } from '../types';
import { SKILL_BY_ID } from '../data/skills';
import { SkillGraph, pct, skillName } from './shared';

interface Props {
  model: ModelState;
  turn: number;
  activeQ: Question | null;
  activeScores: SelectionScore[];
  picked: number | null;
  last: { skillId: string; delta: number; correct: boolean } | null;
  onAnswer: (optionIndex: number) => void;
  onNext: () => void;
  onCorrectSlip: (skillId: string) => void;
  onReset: () => void;
}

function difficultyLabel(d: number): string {
  if (d < 0.35) return '易';
  if (d < 0.6) return '中';
  return '难';
}

function fmtDelta(delta: number): string {
  const v = Math.round(delta * 100);
  return `${v >= 0 ? '+' : ''}${v}%`;
}

export default function StudyView({
  model,
  turn,
  activeQ,
  activeScores,
  picked,
  last,
  onAnswer,
  onNext,
  onCorrectSlip,
  onReset,
}: Props) {
  const chosen = activeScores.find((s) => s.chosen);
  const answered = picked !== null;

  return (
    <div className="grid study">
      {/* 左：题卡 */}
      <div className="panel">
        <div className="qmeta">
          <span className="pill accent">第 {turn} 题</span>
          {activeQ && (
            <>
              <span className="pill">{skillName(activeQ.skillId)}</span>
              <span className="pill">难度 {difficultyLabel(activeQ.difficulty)}</span>
            </>
          )}
        </div>

        {!activeQ ? (
          <p className="hint">没有更多可出的题了。切到「认知地图」看 AI 对你的完整判断，或重来一遍。</p>
        ) : (
          <>
            <div className="qprompt">{activeQ.prompt}</div>
            <div className="options">
              {activeQ.options.map((opt, i) => {
                let cls = 'opt';
                if (answered) {
                  if (i === activeQ.correctIndex) cls += ' correct';
                  else if (i === picked) cls += ' wrong';
                }
                return (
                  <button
                    key={i}
                    className={cls}
                    disabled={answered}
                    onClick={() => onAnswer(i)}
                  >
                    {opt}
                    {answered && i === activeQ.correctIndex && <span className="mark">✓</span>}
                    {answered && i === picked && i !== activeQ.correctIndex && (
                      <span className="mark">✗</span>
                    )}
                  </button>
                );
              })}
            </div>

            {answered && last && (
              <div className="explain">
                <div>
                  <b>{last.correct ? '答对了。' : '答错了。'}</b>
                  <span className="d"> {activeQ.explain}</span>
                </div>
                <div style={{ marginTop: 8 }}>
                  模型更新：<b>{SKILL_BY_ID[last.skillId].short}</b> 掌握度{' '}
                  <b style={{ color: last.delta >= 0 ? 'var(--good)' : 'var(--bad)' }}>
                    {fmtDelta(last.delta)}
                  </b>
                  {' → 现为 '}
                  {pct(model[last.skillId].mastery)}
                </div>
              </div>
            )}

            <div className="btnrow">
              <button className="btn primary" disabled={!answered} onClick={onNext}>
                下一题 →
              </button>
              {answered && last && !last.correct && (
                <button
                  className="btn"
                  title="撤销这次误判，并让引擎重新规划后续路径"
                  onClick={() => onCorrectSlip(last.skillId)}
                >
                  ✋ 我其实会这个（刚才手滑）
                </button>
              )}
              <button className="btn ghost small" onClick={onReset}>
                重来
              </button>
            </div>
            {answered && last && !last.correct && (
              <p className="hint" style={{ marginTop: 10, marginBottom: 0 }}>
                提示：点上面的「手滑」按钮，右侧「为什么现在考它」会当场变化——这就是校正权。
              </p>
            )}
          </>
        )}
      </div>

      {/* 右：为什么现在考它 + 迷你图谱 */}
      <div className="panel">
        <h2>为什么现在考它？</h2>
        <p className="hint">
          这不是黑盒。下一题由这些可见因素打分选出：缺口(1-掌握度) · 不确定性(1-置信度) ·
          前置就绪 · 你的兴趣 · 近期是否刚练过。
        </p>
        <SkillGraph model={model} highlightId={chosen?.skillId ?? null} />
        <div className="why" style={{ marginTop: 14 }}>
          {activeScores.slice(0, 4).map((s) => (
            <div key={s.skillId} className={`whyrow${s.chosen ? ' chosen' : ''}`}>
              <div className="top">
                <span className="name">
                  {s.chosen ? '▶ ' : ''}
                  {skillName(s.skillId)}
                </span>
                <span className="score">{s.score.toFixed(3)}</span>
              </div>
              <div className="factors">
                <span>
                  缺口 <b>{s.gap.toFixed(2)}</b>
                </span>
                <span>
                  不确定 <b>{s.uncertainty.toFixed(2)}</b>
                </span>
                <span>
                  前置就绪 <b>{s.readiness.toFixed(2)}</b>
                </span>
                <span>
                  兴趣 <b>×{s.interest.toFixed(1)}</b>
                </span>
                <span>
                  近期 <b>×{s.recency.toFixed(2)}</b>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
