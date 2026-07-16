import { useEffect, useState } from 'react';
import { ROLE, TRAINING } from '../data/cases';
import { ruleById } from '../data/rules';
import type { Verdict } from '../types';
import { FeatureChips, VERDICT_LABEL, VerdictBadge } from './shared';

interface Props {
  index: number;
  adoptedRuleIds: string[];
  onResolve: (adoptRuleId: string | null) => void;
  onAutoCoach: () => void;
  onReset: () => void;
  onGoEvaluate: () => void;
}

export function CoachView({ index, adoptedRuleIds, onResolve, onAutoCoach, onReset, onGoEvaluate }: Props) {
  const total = TRAINING.length;
  const done = index >= total;
  const current = done ? null : TRAINING[index];
  const [picked, setPicked] = useState<Verdict | null>(null);

  useEffect(() => {
    setPicked(null);
  }, [index]);

  const suggestedRule = current?.teachesRuleId ? ruleById(current.teachesRuleId) : undefined;

  return (
    <div className="view">
      <div className="coach-head">
        <div>
          <div className="eyebrow">带教工作台 · 示例域：{ROLE}</div>
          <h2>看 agent 判断 → 你只需「认同 / 改判」。你的批改会被蒸馏成规则。</h2>
        </div>
        <div className="coach-actions">
          <div className="progress-pill">
            已带教 <b>{Math.min(index, total)}</b> / {total}
          </div>
          <button className="btn ghost" onClick={onAutoCoach} title="一键按专家最佳实践带教全部，便于快速看 before/after">
            自动带教（演示）
          </button>
          <button className="btn ghost" onClick={onReset}>
            重置
          </button>
        </div>
      </div>

      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${(Math.min(index, total) / total) * 100}%` }} />
      </div>

      {done ? (
        <div className="done-card">
          <div className="done-emoji">✓</div>
          <h3>这一轮带教完成</h3>
          <p>
            你已处理全部 {total} 个训练 case，技能卡里现在有 <b>{adoptedRuleIds.length}</b> 条规则。
            去「验收」看看：这些规则把「与你（专家）一致率」在全新的候选人上抬高了多少——这个数字是<b>实测</b>的。
          </p>
          <div className="row">
            <button className="btn primary" onClick={onGoEvaluate}>
              去验收 · 看 before / after →
            </button>
            <button className="btn ghost" onClick={onReset}>
              重新带教
            </button>
          </div>
        </div>
      ) : current ? (
        <div className="case-layout">
          <div className="case-card">
            <div className="case-top">
              <div>
                <div className="case-handle">{current.handle}</div>
                <div className="case-headline">"{current.headline}"</div>
              </div>
              <div className="case-years">{current.years} 年经验</div>
            </div>
            <p className="case-blurb">{current.blurb}</p>
            <FeatureChips features={current.features} />

            <div className="agent-box">
              <div className="agent-label">Agent 的判断</div>
              <div className="agent-verdict">
                <VerdictBadge v={current.baseVerdict} />
                <span className="agent-reason">{current.baseReason}</span>
              </div>
            </div>

            <div className="expert-box">
              <div className="expert-label">你的裁定</div>
              <div className="verdict-picker">
                {(['advance', 'maybe', 'reject'] as Verdict[]).map((v) => (
                  <button
                    key={v}
                    className={`vbtn vbtn-${v} ${picked === v ? 'active' : ''}`}
                    onClick={() => setPicked(v)}
                  >
                    {VERDICT_LABEL[v]}
                  </button>
                ))}
              </div>

              {picked && picked === current.baseVerdict && (
                <div className="resolve agree">
                  <span>✓ 你认同了 agent 的判断，无需新增规则。</span>
                  <button className="btn primary sm" onClick={() => onResolve(null)}>
                    认同并继续 →
                  </button>
                </div>
              )}

              {picked && picked !== current.baseVerdict && (
                <div className="resolve override">
                  <div className="override-head">
                    你把判定从 <VerdictBadge v={current.baseVerdict} size="sm" /> 改为{' '}
                    <VerdictBadge v={picked} size="sm" />。
                  </div>
                  {suggestedRule && picked === current.expertVerdict ? (
                    <div className="rule-suggest">
                      <div className="rule-suggest-label">系统从你这次批改蒸馏出一条规则：</div>
                      <div className="rule-suggest-text">「{suggestedRule.text}」</div>
                      <div className="rule-suggest-meta">
                        触发条件：{suggestedRule.when} · 来源：{current.handle}
                      </div>
                      <div className="row">
                        <button className="btn primary sm" onClick={() => onResolve(suggestedRule.id)}>
                          采纳规则并继续 →
                        </button>
                        <button className="btn ghost sm" onClick={() => onResolve(null)}>
                          仅改判，不加规则
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="rule-suggest">
                      <div className="rule-suggest-label">已记录你的改判。这次批改暂不蒸馏出可复用规则。</div>
                      <button className="btn primary sm" onClick={() => onResolve(null)}>
                        继续 →
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <aside className="skill-mini">
            <div className="skill-mini-head">技能卡（实时生长）</div>
            {adoptedRuleIds.length === 0 ? (
              <div className="skill-mini-empty">还没有规则。改判并采纳后，规则会出现在这里。</div>
            ) : (
              <ol className="skill-mini-list">
                {adoptedRuleIds.map((id) => {
                  const r = ruleById(id);
                  if (!r) return null;
                  return (
                    <li key={id} className="skill-mini-item">
                      <span className={`dot dot-${r.weight}`} />
                      {r.text}
                    </li>
                  );
                })}
              </ol>
            )}
          </aside>
        </div>
      ) : null}
    </div>
  );
}
