import type { Scenario } from '../types';
import { SURVIVAL_META } from '../logic/rootline';

interface FinalAnswerProps {
  scenario: Scenario;
  lensOn: boolean;
  selectedClaimId: string | null;
  onSelectClaim: (id: string) => void;
}

export function FinalAnswer({ scenario, lensOn, selectedClaimId, onSelectClaim }: FinalAnswerProps) {
  return (
    <div className="final-answer">
      <div className="fa-prompt">
        <span className="fa-label">multi_agent 调用 · 任务</span>
        <p>{scenario.prompt}</p>
      </div>

      <div className={`fa-answer${lensOn ? ' lens' : ''}`}>
        <span className="fa-label">模型最终答案</span>
        <p className="fa-answer-text">{scenario.finalAnswer}</p>
        {!lensOn && (
          <div className="fa-naked-hint">
            看起来自信、可直接执行。但它由一棵子代理树经<strong>逐层有损压缩</strong>聚合而来——
            承重事实活下来了吗？开启<strong>根脉透镜</strong>逐条审计。
          </div>
        )}
      </div>

      {lensOn && (
        <div className="claim-list">
          <div className="panel-title">
            承重结论 <span className="panel-sub">（点结论 → 高亮它的根脉路径）</span>
          </div>
          {scenario.claims.map((c) => {
            const meta = SURVIVAL_META[c.survival];
            const active = selectedClaimId === c.id;
            return (
              <button
                key={c.id}
                className={`claim-chip tone-${meta.tone}${active ? ' active' : ''}`}
                onClick={() => onSelectClaim(c.id)}
              >
                <span className="claim-row">
                  <span className={`survival-dot tone-${meta.tone}`} aria-hidden="true" />
                  <span className="claim-text">「{c.text}」</span>
                  <span className={`survival-tag tone-${meta.tone}`}>{meta.label}</span>
                </span>
                {c.affectsAction && c.survival !== 'intact' && (
                  <span className="action-flag">⛔ 影响可执行决策</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
