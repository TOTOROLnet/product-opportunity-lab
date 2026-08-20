import { useState } from 'react';
import type { AgentPR, FlipResult, Summary } from '../types';
import { CandidateTable, Stat, SEVERITY_LABEL } from './ui';

export function Explainer({
  pr,
  flips,
  summary,
  onGoCalibrate,
}: {
  pr: AgentPR;
  flips: FlipResult[];
  summary: Summary;
  onGoCalibrate: () => void;
}) {
  const [open, setOpen] = useState<string | null>(flips.find((f) => f.flipped)?.decision.id ?? pr.decisions[0].id);

  const headline =
    summary.flips === 0
      ? '在当前口味下，这次 PR 的选型我们都没有异议。'
      : `这次 PR 里，agent 悄悄替你做了 ${summary.decisions} 个选型决定，其中 ${summary.regrets} 个你八成会后悔` +
        (summary.softFlips ? `，另有 ${summary.softFlips} 个可优化` : '') +
        `；${summary.goodPicks} 个选得对味。`;

  return (
    <div>
      <div className="card">
        <h2>选型说明书 · 这次 agent 替你做了什么选择</h2>
        <p className="hint">
          coding agent 在这个 PR 里为了完成任务，自己决定了要装哪些依赖 / 库 / 工具。这些决定资深工程师本会反复权衡，agent
          却一笔带过。下面把每个决定摊开：它为什么加、考虑过哪些替代、逐轴权衡。
        </p>
        <div className="pr-meta">
          <span>
            <code>{pr.branch}</code>
          </span>
          <span>by {pr.agent}</span>
          <span>{pr.filesChanged} files changed</span>
          <span>{pr.decisions.length} 个选型决定</span>
        </div>
        <div className="pr-task">
          <b>{pr.title}</b>
          <br />
          {pr.task}
        </div>
      </div>

      <div className="card">
        <div className="summary">
          <Stat num={summary.decisions} lbl="选型决定" />
          <Stat num={summary.regrets} lbl="八成会后悔" tone="red" />
          <Stat num={summary.softFlips} lbl="可优化" tone="amber" />
          <Stat num={summary.goodPicks} lbl="选得对味" tone="olive" />
        </div>
        <p className="hint" style={{ marginTop: 14, marginBottom: 0 }}>
          {headline}（依据你当前的「选型口味」判定，去{' '}
          <button className="linkish" onClick={onGoCalibrate}>
            口味校准
          </button>{' '}
          调一调，这里会实时变化。）
        </p>
      </div>

      {flips.map((f) => {
        const sev = f.flipped ? SEVERITY_LABEL[f.severity] : SEVERITY_LABEL.keep;
        const cls = f.flipped ? `flip-${f.severity}` : 'keep';
        const isOpen = open === f.decision.id;
        return (
          <div className={`decision ${cls}`} key={f.decision.id}>
            <div className="d-head" onClick={() => setOpen(isOpen ? null : f.decision.id)}>
              <div className="d-goal">
                <div className="goal">{f.decision.subGoal}</div>
                <div className="pick">
                  agent 选了 <b>{f.agentPick.name}</b>
                  {f.agentPick.isNativeApproach ? '' : ` ${f.agentPick.bundleKb}KB`}
                  {f.flipped ? ` · 对味会改成 ${f.tastePick.name}` : ' · 无异议'}
                </div>
              </div>
              <span className={`badge ${sev.cls}`}>{sev.text}</span>
              <span className="chev">{isOpen ? '▲' : '▼'}</span>
            </div>
            {isOpen && (
              <div className="d-body">
                <div className="rationale">
                  <b>agent 的理由：</b>
                  {f.decision.agentRationale}
                </div>
                {f.decision.seniorFlag ? (
                  <div className="senior-flag">{f.decision.seniorFlag}</div>
                ) : (
                  <div className="good-note">
                    这一处 agent 选得不错：{f.agentPick.note} 在你的口味下也无需改判。
                  </div>
                )}
                <CandidateTable
                  decision={f.decision}
                  agentPickName={f.agentPick.name}
                  tastePickName={f.tastePick.name}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
