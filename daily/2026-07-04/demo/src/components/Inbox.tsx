import type { AgentRun } from '../types';
import { countByVerdict, evidenceScore, riskyClaims, SELF_REPORTED_SCORE } from '../logic/scoring';

interface Props {
  runs: AgentRun[];
  onOpen: (id: string) => void;
}

function scoreClass(score: number): string {
  return score >= 70 ? 'ok' : score >= 40 ? 'warn' : 'bad';
}

export function Inbox({ runs, onOpen }: Props) {
  return (
    <div className="inbox">
      <div className="inbox-intro">
        <h2>Agent 交付了 3 个任务，都说“完成了”。</h2>
        <p>
          问题是：<b>自称完成 ≠ 被证明完成</b>。全信可能吞下幻觉式完成，全部亲手重验又抵消了 agent
          的效率。 Attestor 把每份交付的自述逐句连到真实证据，只把<b>该复核的那几句</b>顶出来。
        </p>
      </div>

      <div className="run-grid">
        {runs.map((run) => {
          const score = evidenceScore(run.claims);
          const gap = SELF_REPORTED_SCORE - score;
          const counts = countByVerdict(run.claims);
          const risky = riskyClaims(run.claims).length;
          return (
            <button key={run.id} className="run-card" onClick={() => onOpen(run.id)}>
              <div className="run-card-head">
                <span className="run-agent">{run.agent}</span>
                <span className="run-time">{run.finishedAt}</span>
              </div>
              <h3 className="run-task">{run.task}</h3>

              <div className="score-row">
                <div className="score-block">
                  <span className="score-label">自述信任分</span>
                  <span className="score-val self">{SELF_REPORTED_SCORE}%</span>
                </div>
                <span className="score-arrow">→</span>
                <div className="score-block">
                  <span className="score-label">证据信任分</span>
                  <span className={`score-val ${scoreClass(score)}`}>{score}%</span>
                </div>
                <div className={`gap-badge ${scoreClass(score)}`}>缺口 {gap}%</div>
              </div>

              <div className="mini-bar">
                <div className="mini-fill self" style={{ width: '100%' }} />
                <div className={`mini-fill overlay ${scoreClass(score)}`} style={{ width: `${score}%` }} />
              </div>

              <div className="verdict-chips">
                <span className="chip verified">✓ {counts.verified}</span>
                <span className="chip weak">◐ {counts.weak}</span>
                <span className="chip unsupported">⚠ {counts.unsupported}</span>
                <span className="chip contradicted">✖ {counts.contradicted}</span>
              </div>

              {risky > 0 && (
                <div className="run-alert">
                  {risky} 条完成声明没有证据 / 被反证 —— 点击逐句核验
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
