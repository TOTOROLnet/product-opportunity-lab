import { useMemo, useState } from 'react';
import { defaultRun } from '../logic/engine';
import { GOAL } from '../data/session';
import type { Health, StepResult } from '../types';

const HEALTH_LABEL: Record<Health, string> = {
  ok: '正常',
  anomaly: '异常(非因果)',
  pivotal: '折返步',
  tainted: '被污染',
};

const HEALTH_COLOR: Record<Health, string> = {
  ok: 'var(--ok)',
  anomaly: 'var(--anomaly)',
  pivotal: 'var(--pivotal)',
  tainted: 'var(--tainted)',
};

export default function ReplayView() {
  const run = useMemo(() => defaultRun(), []);
  const [selectedSeq, setSelectedSeq] = useState<number>(run.pivotalSeq ?? 1);
  const [located, setLocated] = useState(false);

  const selected: StepResult = run.steps.find((s) => s.seq === selectedSeq) ?? run.steps[0];

  const locate = () => {
    if (run.pivotalSeq !== null) setSelectedSeq(run.pivotalSeq);
    setLocated(true);
  };

  return (
    <div>
      <div className="goal">
        <div className="q">🎯 会话任务：{GOAL.question}</div>
        <div className="meta">
          <span className="badge">
            目标指标 <b>{GOAL.metric}</b>
          </span>
          <span className="badge">
            显著性阈值 <b>α={GOAL.alpha}</b>
          </span>
          <span className="badge">
            实验窗口 <b>{GOAL.window}</b>
          </span>
          <span className="badge">
            会话步数 <b>{run.steps.length} 步</b>
          </span>
        </div>
      </div>

      <div className="panel">
        <h2>会话事件日志回放</h2>
        <p className="hint">
          这是一次跑在可续跑运行时上的分析 agent 会话。逐步读它很累——点「自动定位折返步」，岔口直接指出决定错误结论的那一步。
        </p>
        <div className="btn-row" style={{ marginBottom: 14 }}>
          <button className="btn btn-primary" onClick={locate}>
            ⛳ 自动定位折返步
          </button>
        </div>

        <div className="grid-2">
          <div className="timeline">
            {run.steps.map((s) => (
              <div
                key={s.seq}
                className={`step h-${s.health} ${s.seq === selectedSeq ? 'selected' : ''}`}
                onClick={() => setSelectedSeq(s.seq)}
              >
                <div className="seq">{s.seq}</div>
                <div className="body">
                  <div className="act">{s.action}</div>
                  <div className="sum">{s.summary}</div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexDirection: 'column', alignItems: 'flex-end' }}>
                  <span className={`tag t-${s.health}`}>{HEALTH_LABEL[s.health]}</span>
                  {s.hasFix && <span className="tag t-fix">含决策</span>}
                </div>
              </div>
            ))}
          </div>

          <div className="detail">
            <div className="panel" style={{ margin: 0, background: 'var(--bg-soft)' }}>
              <h2 style={{ fontSize: 14 }}>
                #{selected.seq} · {selected.action}
                <span
                  className="tag"
                  style={{ marginLeft: 8, background: 'transparent', color: HEALTH_COLOR[selected.health] }}
                >
                  ● {HEALTH_LABEL[selected.health]}
                </span>
              </h2>
              <div className="kv">
                <div className="k">读入状态</div>
                <div className="v">{selected.reads.join(', ')}</div>
                {Object.entries(selected.writes).map(([k, v]) => (
                  <FragmentKV key={k} k={`写出 ${k}`} v={v} />
                ))}
              </div>

              <div className="inv-box">
                <div className="label">
                  目标不变量：{selected.invariant.label}
                  {selected.invariant.violated ? (
                    <span className="pill fail">违反</span>
                  ) : (
                    <span className="pill pass">通过</span>
                  )}
                </div>
                <div className="line">
                  期望：<span className="mono">{selected.invariant.expected}</span>
                </div>
                <div className="line">
                  实际：<span className="mono">{selected.invariant.actual}</span>
                </div>
                {selected.invariant.violated && (
                  <div className="line">
                    传导到最终结论：
                    {selected.invariant.outcomeRelevant ? (
                      <span className="pill rel">是（在因果路径上）</span>
                    ) : (
                      <span className="pill norel">否（不影响结论）</span>
                    )}
                  </div>
                )}
              </div>

              {located && run.pivotalSeq === selected.seq && (
                <div className="callout hit">
                  <b>这就是折返步。</b> 它是最早「被违反、且单独修正它就能让最终结论翻转为正确」的步——
                  agent 在此把 <span className="mono">retained</span>(D1) 误当成了 <span className="mono">retained_d7</span>(D7)，
                  之后 4 步全建立在这个错误口径上。去「岔口纠偏」从这一步 fork 试试。
                </div>
              )}
            </div>
          </div>
        </div>

        <div className={`conclusion ${run.conclusion.correct ? 'right' : 'wrong'}`}>
          <div className="icon">{run.conclusion.correct ? '✅' : '⚠️'}</div>
          <div>
            <div className="label">Agent 最终结论 {run.conclusion.correct ? '（正确）' : '（看似合理，实则错误）'}</div>
            <div className="text">{run.conclusion.text}</div>
          </div>
        </div>

        <div className="legend">
          <span>
            <span className="dot" style={{ background: 'var(--ok)' }} />
            正常
          </span>
          <span>
            <span className="dot" style={{ background: 'var(--anomaly)' }} />
            异常但不影响结论
          </span>
          <span>
            <span className="dot" style={{ background: 'var(--pivotal)' }} />
            折返步（决定错误结论）
          </span>
          <span>
            <span className="dot" style={{ background: 'var(--tainted)' }} />
            被折返步污染的下游步
          </span>
        </div>
      </div>
    </div>
  );
}

function FragmentKV({ k, v }: { k: string; v: string }) {
  return (
    <>
      <div className="k">{k}</div>
      <div className="v">{v}</div>
    </>
  );
}
