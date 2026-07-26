import { useMemo, useState } from 'react';
import { applyFork, compareRows, defaultRun, forkOptions, valueMetrics } from '../logic/engine';
import type { ForkResult, RunResult } from '../types';

function MiniTimeline({ run, title }: { run: RunResult; title: string }) {
  return (
    <div>
      <div className="mini-label">{title}</div>
      <div className="mini">
        {run.steps.map((s) => (
          <div key={s.seq} className={`cell h-${s.health}`} title={`#${s.seq} ${s.action}`}>
            {s.seq}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ForkpointView() {
  const options = useMemo(() => forkOptions(), []);
  const before = useMemo(() => defaultRun(), []);
  const vm = useMemo(() => valueMetrics(), []);
  const [selSeq, setSelSeq] = useState<number>(options[0]?.seq ?? 5);
  const [fork, setFork] = useState<ForkResult | null>(null);

  const doFork = () => setFork(applyFork(selSeq));
  const rows = fork ? compareRows(fork.before, fork.after) : [];

  return (
    <div>
      <div className="panel">
        <h2>选择要 fork 的步 + 纠偏动作</h2>
        <p className="hint">
          有了可续跑事件日志，你能从任意 seq 分叉重放。但「该从哪一步 fork」才是关键——试试在不同步 fork，看结论是否真的变对。
        </p>
        {options.map((o) => (
          <div
            key={o.seq}
            className={`fork-opt ${selSeq === o.seq ? 'sel' : ''}`}
            onClick={() => {
              setSelSeq(o.seq);
              setFork(null);
            }}
          >
            <div className="top">
              <div className="lab">
                第 {o.seq} 步 · {o.label}
              </div>
              <span className="tag t-fix">可纠偏</span>
            </div>
            <div className="chg">
              {o.fromLabel}
              <span className="arrow">→</span>
              {o.toLabel}
            </div>
          </div>
        ))}
        <div className="btn-row">
          <button className="btn btn-primary" onClick={doFork}>
            🛤 从第 {selSeq} 步分叉并重放
          </button>
          {fork && (
            <button className="btn btn-ghost" onClick={() => setFork(null)}>
              重置
            </button>
          )}
        </div>
      </div>

      {fork && (
        <>
          <div className="panel">
            <h2>下游确定性重放</h2>
            <MiniTimeline run={fork.before} title="原始轨迹（默认会话）" />
            <MiniTimeline run={fork.after} title={`从第 ${fork.seq} 步纠偏后的重放轨迹`} />

            <div className={`callout ${fork.hitPivotal ? 'hit' : 'miss'}`}>
              {fork.hitPivotal ? (
                <>
                  <b>✅ 命中折返步。</b> 单独修正第 {fork.seq} 步后，下游 4 步从「被污染」恢复为正常，最终结论
                  <b> 翻转 </b>为正确——这证明它就是决定错误结论的那一步。
                </>
              ) : (
                <>
                  <b>➖ 非折返步。</b> 修正第 {fork.seq} 步是个真实改进（异常减少），但最终结论
                  <b> 没有改变 </b>——说明它不是错误结论的根因。真正的折返步在第 {before.pivotalSeq} 步。
                </>
              )}
            </div>
          </div>

          <div className="grid-2">
            <div className="panel" style={{ margin: 0 }}>
              <h2>Before / After 关键数字</h2>
              <p className="hint">纠偏前（原始）vs 纠偏后（从该步重放）。</p>
              <table className="cmp">
                <thead>
                  <tr>
                    <th>维度</th>
                    <th>纠偏前</th>
                    <th>纠偏后</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.label} className={r.changed ? 'changed' : ''}>
                      <td className="label">{r.label}</td>
                      <td className="before">{r.before}</td>
                      <td className="after">{r.after}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="panel" style={{ margin: 0 }}>
              <h2>结论对比</h2>
              <div className="conclusion wrong" style={{ marginTop: 6 }}>
                <div className="icon">⚠️</div>
                <div>
                  <div className="label">纠偏前</div>
                  <div className="text">{fork.before.conclusion.text}</div>
                </div>
              </div>
              <div className={`conclusion ${fork.after.conclusion.correct ? 'right' : 'wrong'}`}>
                <div className="icon">{fork.after.conclusion.correct ? '✅' : '⚠️'}</div>
                <div>
                  <div className="label">纠偏后</div>
                  <div className="text">{fork.after.conclusion.text}</div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <div className="panel">
        <h2>价值：这次归因 + 纠偏省了什么</h2>
        <div className="metrics">
          <div className="metric">
            <div className="big">{vm.foldSeq}</div>
            <div className="cap">折返步序号（共 {vm.totalSteps} 步）</div>
          </div>
          <div className="metric">
            <div className="big">{vm.taintedCount}</div>
            <div className="cap">被污染的下游步数</div>
          </div>
          <div className="metric">
            <div className="big">-{vm.stepsSaved}</div>
            <div className="cap">少读的日志步数（{vm.totalSteps}→1）</div>
          </div>
          <div className="metric">
            <div className="big">{vm.avoidedBadRollout}</div>
            <div className="cap">避免的错误上线（次）</div>
          </div>
        </div>
        <p className="note" style={{ marginTop: 12 }}>
          没有岔口：你会逐步读完 {vm.totalSteps} 步、信一个「看起来对」的结论，把一个只提升 D1、不提升 D7 的改版
          <b> 全量上线</b>。有岔口：直接跳到第 {vm.foldSeq} 步、一次改对、并用重放<b>证明</b>结论翻转。
        </p>
      </div>
    </div>
  );
}
