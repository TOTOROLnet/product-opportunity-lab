import { useEffect, useMemo, useRef, useState } from 'react';
import type { AnswerMap, Confidence, Doc } from '../types';
import { cancelSpeech, speak, speechAvailable } from '../audio/speech';
import { computeUnitMastery } from '../logic/mastery';
import { ProgressBar, StatusPill } from './shared';

interface Props {
  doc: Doc;
  /** 本次会话要播放的概念单元 id 列表（全程 = 全部；重听 = 单个）。 */
  unitIds: string[];
  onComplete: (sessionAnswers: AnswerMap) => void;
  onExit: () => void;
  /** 是否为"重听并再测"的单概念小节。 */
  relisten?: boolean;
}

type Phase = 'playing' | 'question';
const CONFIDENCES: { key: Confidence; label: string }[] = [
  { key: 'high', label: '很有把握' },
  { key: 'mid', label: '一般' },
  { key: 'low', label: '不确定' },
];

export function PlayerView({ doc, unitIds, onComplete, onExit, relisten }: Props) {
  const units = useMemo(
    () => unitIds.map((id) => doc.units.find((u) => u.id === id)!).filter(Boolean),
    [doc, unitIds],
  );

  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>('playing');
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [rate, setRate] = useState(1);
  const [narrate, setNarrate] = useState(speechAvailable());

  const [qIdx, setQIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [confidence, setConfidence] = useState<Confidence | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [answers, setAnswers] = useState<AnswerMap>({});

  const unit = units[idx];
  const question = unit?.questions[qIdx];
  const timerRef = useRef<number | null>(null);

  const clearTimer = () => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => {
    if (phase !== 'playing' || !unit) return;
    if (paused) {
      clearTimer();
      cancelSpeech();
      return;
    }
    if (narrate) speak(unit.script, rate);
    const durationMs = Math.max(4200, unit.script.length * 95) / rate;
    const stepMs = 80;
    const inc = stepMs / durationMs;
    timerRef.current = window.setInterval(() => {
      setProgress((p) => {
        const next = p + inc;
        if (next >= 1) {
          clearTimer();
          cancelSpeech();
          if (unit.questions.length > 0) {
            setPhase('question');
          } else {
            advanceUnit();
          }
          return 1;
        }
        return next;
      });
    }, stepMs);
    return clearTimer;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, idx, paused, rate, narrate]);

  useEffect(() => () => cancelSpeech(), []);

  function skipToQuestion() {
    clearTimer();
    cancelSpeech();
    setProgress(1);
    if (unit && unit.questions.length > 0) setPhase('question');
    else advanceUnit();
  }

  function advanceUnit() {
    cancelSpeech();
    if (idx + 1 >= units.length) {
      onComplete(answers);
      return;
    }
    setIdx((i) => i + 1);
    setQIdx(0);
    setProgress(0);
    setPhase('playing');
    resetQuestionUI();
  }

  function resetQuestionUI() {
    setSelected(null);
    setConfidence(null);
    setRevealed(false);
  }

  function submitAnswer() {
    if (selected === null || confidence === null || !unit || !question) return;
    const correct = selected === question.correctIndex;
    setAnswers((prev) => ({
      ...prev,
      [unit.id]: {
        ...(prev[unit.id] ?? {}),
        [question.id]: { selectedIndex: selected, confidence, correct },
      },
    }));
    setRevealed(true);
  }

  function nextAfterQuestion() {
    if (!unit) return;
    if (qIdx + 1 < unit.questions.length) {
      setQIdx((q) => q + 1);
      resetQuestionUI();
      return;
    }
    advanceUnit();
  }

  if (!unit) return null;

  const liveMastery = computeUnitMastery(doc, answers).filter((m) =>
    unitIds.includes(m.unitId),
  );
  const doneCount = idx + (phase === 'question' && revealed && qIdx + 1 >= unit.questions.length ? 1 : 0);

  return (
    <div className="view player">
      <div className="player__topbar">
        <button className="btn btn--ghost" onClick={onExit}>
          ← 退出
        </button>
        <div className="player__doc">
          {relisten ? '🔁 重听并再测 · ' : ''}
          {doc.title}
        </div>
        <div className="player__count">
          单元 {idx + 1} / {units.length}
        </div>
      </div>

      <div className="player__grid">
        <main className="player__main">
          <div className="unit-head">
            <div className="unit-head__idx">概念 {idx + 1}</div>
            <h2 className="unit-head__title">{unit.title}</h2>
          </div>

          <div className={`script ${phase === 'question' ? 'script--dim' : ''}`}>
            {unit.script}
          </div>

          {phase === 'playing' && (
            <div className="playbox">
              <div className="playbox__row">
                <button
                  className="btn btn--round"
                  onClick={() => setPaused((p) => !p)}
                  aria-label={paused ? '继续' : '暂停'}
                >
                  {paused ? '▶' : 'II'}
                </button>
                <ProgressBar value={progress} />
                <button className="btn btn--ghost" onClick={skipToQuestion}>
                  跳到追问 »
                </button>
              </div>
              <div className="playbox__controls">
                <div className="seg">
                  {[1, 1.5, 2].map((r) => (
                    <button
                      key={r}
                      className={`seg__btn ${rate === r ? 'is-active' : ''}`}
                      onClick={() => setRate(r)}
                    >
                      {r}x
                    </button>
                  ))}
                </div>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={narrate}
                    disabled={!speechAvailable()}
                    onChange={(e) => setNarrate(e.target.checked)}
                  />
                  <span>
                    朗读{speechAvailable() ? '' : '（此环境不支持，已用文字模式）'}
                  </span>
                </label>
              </div>
              <div className="hint-callout">
                听到概念边界会自动暂停，向你发问——这一步"被打断的主动回忆"，正是记得牢的关键。
              </div>
            </div>
          )}

          {phase === 'question' && question && (
            <div className="qcard">
              <div className="qcard__tag">🧠 主动回忆 · 而不是"我好像听过"</div>
              <div className="qcard__prompt">{question.prompt}</div>
              <div className="qcard__options">
                {question.options.map((opt, i) => {
                  const isSel = selected === i;
                  const isCorrect = i === question.correctIndex;
                  let cls = 'opt';
                  if (revealed) {
                    if (isCorrect) cls += ' opt--correct';
                    else if (isSel) cls += ' opt--wrong';
                  } else if (isSel) {
                    cls += ' opt--sel';
                  }
                  return (
                    <button
                      key={i}
                      className={cls}
                      disabled={revealed}
                      onClick={() => setSelected(i)}
                    >
                      <span className="opt__mark">{String.fromCharCode(65 + i)}</span>
                      {opt}
                    </button>
                  );
                })}
              </div>

              {!revealed && (
                <>
                  <div className="conf">
                    <span className="conf__label">你的把握度：</span>
                    <div className="seg">
                      {CONFIDENCES.map((c) => (
                        <button
                          key={c.key}
                          className={`seg__btn ${confidence === c.key ? 'is-active' : ''}`}
                          onClick={() => setConfidence(c.key)}
                        >
                          {c.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button
                    className="btn btn--primary"
                    disabled={selected === null || confidence === null}
                    onClick={submitAnswer}
                  >
                    确认回答
                  </button>
                </>
              )}

              {revealed && (
                <div
                  className={`feedback ${
                    selected === question.correctIndex ? 'feedback--ok' : 'feedback--no'
                  }`}
                >
                  <div className="feedback__head">
                    {selected === question.correctIndex ? '✓ 答对了' : '✗ 答错了'}
                    {selected !== question.correctIndex &&
                      confidence === 'high' &&
                      ' — 而且是"自信地答错"，这类最该重听纠偏'}
                  </div>
                  <div className="feedback__exp">{question.explanation}</div>
                  <div className="feedback__key">🔑 该记住：{unit.keyIdea}</div>
                  <button className="btn btn--primary" onClick={nextAfterQuestion}>
                    {qIdx + 1 < unit.questions.length
                      ? '下一题'
                      : idx + 1 < units.length
                        ? '继续收听下一个概念 →'
                        : '完成，看我的保留度 →'}
                  </button>
                </div>
              )}
            </div>
          )}
        </main>

        <aside className="player__side">
          <div className="side-title">本次保留度（实时）</div>
          <div className="side-progress">已完成 {doneCount} / {units.length} 个概念</div>
          <ul className="side-list">
            {units.map((u, i) => {
              const m = liveMastery.find((x) => x.unitId === u.id);
              const current = i === idx;
              return (
                <li key={u.id} className={`side-item ${current ? 'is-current' : ''}`}>
                  <span className="side-item__title">{u.title}</span>
                  {m && m.answered ? (
                    <span className="side-item__right">
                      <b>{m.score}</b>
                      <StatusPill status={m.status} />
                    </span>
                  ) : (
                    <span className="side-item__pending">{current ? '进行中' : '待听'}</span>
                  )}
                </li>
              );
            })}
          </ul>
          <div className="side-foot">
            答对 × 把握度 → 掌握分。<br />
            "自信地答错"会被标红，优先进重听队列。
          </div>
        </aside>
      </div>
    </div>
  );
}
