import { useMemo } from 'react';
import { defaultRun } from '../logic/engine';

export default function LedgerView() {
  const run = useMemo(() => defaultRun(), []);

  return (
    <div>
      <div className="panel">
        <h2>归因台账：每步 × 目标不变量</h2>
        <p className="hint">
          折返步的判定完全可复算：<b>最早「被违反、且单独修正它就能让最终结论翻转为正确」的步</b>。这让「哪步坏了」不再靠直觉。
        </p>
        <div style={{ overflowX: 'auto' }}>
          <table className="ledger">
            <thead>
              <tr>
                <th>#</th>
                <th>动作</th>
                <th>目标不变量</th>
                <th>期望</th>
                <th>实际</th>
                <th>校验</th>
                <th>传导到结论</th>
              </tr>
            </thead>
            <tbody>
              {run.steps.map((s) => (
                <tr key={s.seq} className={s.health === 'pivotal' ? 'pivotal-row' : ''}>
                  <td>{s.seq}</td>
                  <td>{s.action}</td>
                  <td>{s.invariant.label}</td>
                  <td className="mono">{s.invariant.expected}</td>
                  <td className="mono">{s.invariant.actual}</td>
                  <td>
                    {s.invariant.violated ? (
                      <span className="pill fail">违反</span>
                    ) : (
                      <span className="pill pass">通过</span>
                    )}
                  </td>
                  <td>
                    {!s.invariant.violated ? (
                      <span style={{ color: 'var(--muted)' }}>—</span>
                    ) : s.invariant.outcomeRelevant ? (
                      <span className="pill rel">是</span>
                    ) : (
                      <span className="pill norel">否</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="note" style={{ marginTop: 12 }}>
          注意第 3 步：它<b>确实违反</b>了「无静默丢弃」不变量（丢了 120 行），但单独修它<b>不改变结论</b>——所以它是「异常但非因果」，
          不是折返步。岔口<b>有判别力</b>，不会见异常就报警；它只把那 1 个真正决定错误结论的步标红。
        </p>
      </div>

      <div className="split">
        <div className="mini-card">
          <h3>如果没有 <span className="em">岔口</span></h3>
          <p className="note">
            长链路 agent 给出「看起来专业、其实错了」的结论时，你要么逐步读完几十步日志、还不敢确定是哪步导致；
            要么直接重跑整条链——贵、慢、且可能<b>再错一次</b>。最坏的情况：误信错误结论，把坏决策上线。
          </p>
        </div>
        <div className="mini-card">
          <h3>岔口 与 <span className="em">OpenComputer</span> 的分工</h3>
          <p className="note">
            OpenComputer（可续跑事件日志 / checkpoint 分叉）是<b>马达</b>——让「回到某步续跑」在工程上可行；
            岔口是<b>方向盘 + 证据</b>——告诉你<b>该回到哪一步、为什么是这步、回去修了结论真的变对</b>。
            二者互补：岔口的输出（折返步 + 纠偏点）正是喂给运行时「从 seq N 续跑/分叉」的决策输入。
          </p>
        </div>
      </div>

      <div className="panel">
        <h2>为什么这不是「又一个 trace 查看器」</h2>
        <p className="note">
          只读 trace / observability 工具让你<b>看得到</b>每一步；岔口在此之上多了两件事：
          （1）<b>因果定位</b>——自动指出决定错误结论的那 1 个折返步，并区分「异常但非因果」；
          （2）<b>纠偏证据</b>——从折返步 fork 一条纠偏轨迹、确定性重放，用 before/after <b>证明</b>「修这一步→结论翻转」。
          从「看得到」升级为「<b>定位 + 因果确认 + 纠偏证据</b>」。
        </p>
      </div>
    </div>
  );
}
