import {
  categoryOf,
  currentProposal,
  decide,
  promote,
  recommend,
  suggestions,
  clearReversalBanner,
  CATEGORIES,
  SCENARIO,
  type SessionState,
} from '../logic/engine';
import { AgentTag, RevBadge, RungBar, money } from './ui';

const OUTCOME_META: Record<string, { label: string; cls: string }> = {
  'approved-manual': { label: '人工批准', cls: 'oc-ok' },
  'edited-approved': { label: '改后批准', cls: 'oc-ok' },
  rejected: { label: '拒绝', cls: 'oc-reject' },
  escalated: { label: '升级', cls: 'oc-escalate' },
  'auto-approved': { label: '自动放行', cls: 'oc-auto' },
  reversed: { label: '反转·降级', cls: 'oc-reversed' },
};

export default function Cockpit({
  session,
  setSession,
  reset,
  goCompare,
}: {
  session: SessionState;
  setSession: (s: SessionState) => void;
  reset: () => void;
  goCompare: () => void;
}) {
  const current = currentProposal(session);
  const cat = current ? categoryOf(current) : null;
  const sug = suggestions(session);
  const processed = session.cursor;
  const total = SCENARIO.length;
  const banner = session.reversalBanner;

  const handleRecommended = () => {
    let s = session;
    for (const id of suggestions(s)) s = promote(s, id);
    const p = currentProposal(s);
    if (p) s = decide(s, recommend(p));
    setSession(s);
  };

  return (
    <div className="cockpit">
      <section className="col-main">
        {banner && (
          <div className="reversal-banner" onClick={() => setSession(clearReversalBanner(session))}>
            <strong>⤺ 信任被辜负</strong>：一条自动放行的「
            {CATEGORIES.find((c) => c.id === banner.catId)?.label}」动作事后出问题（{banner.summary}）。
            该类目信任 <b>降 1 阶并暂停自动放行</b>，后续同类退回人工。<span className="dismiss">点此关闭</span>
          </div>
        )}

        {sug.length > 0 && (
          <div className="suggest-stack">
            {sug.map((id) => {
              const c = CATEGORIES.find((x) => x.id === id)!;
              return (
                <div key={id} className="suggest-card">
                  <div className="suggest-head">
                    <span className="suggest-spark">✦ 可提升为自动放行</span>
                    <AgentTag agent={c.agent} />
                  </div>
                  <p className="suggest-rule">
                    规则：<b>{c.label}</b> — 你已一致批准 <b>{session.evidence[id]}</b> 次
                    （门槛 {c.promoteThreshold}），可逆性「{c.reversibility === 'high' ? '易撤销' : '可补救'}」。
                  </p>
                  <p className="suggest-sub">提升后同类动作将自动流过，你只在它出问题时被叫回来。</p>
                  <button className="btn btn-promote" onClick={() => setSession(promote(session, id))}>
                    提升为自动放行 ↑
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {current && cat ? (
          <div className="review-card">
            <div className="review-top">
              <AgentTag agent={current.agent} />
              <span className="review-tick">动作 #{processed + 1} / {total}</span>
            </div>
            <h2 className="review-summary">{current.summary}</h2>
            <div className="review-badges">
              <span className="cat-chip">{cat.label}</span>
              <RevBadge level={cat.reversibility} />
              {current.amount > 0 && <span className="amount-chip">金额 {money(current.amount)}</span>}
            </div>
            <p className="stake-hint">代价：{cat.stakeHint}</p>
            {current.redFlag && <div className="redflag">⚑ 红旗：{current.redFlag}</div>}

            <div className="rung-inline">
              <span className="rung-inline-label">该类目当前信任</span>
              <RungBar
                rung={session.rungs[cat.id]}
                threshold={cat.promoteThreshold}
                auto={session.autoOn[cat.id]}
                locked={!cat.autoEligible}
              />
            </div>

            {!cat.autoEligible && (
              <p className="lock-note">
                该类目为高风险 / 不可逆，<b>永远不允许自动放行</b>——这是安全红线，建议「升级」交人工与专业判断。
              </p>
            )}

            <div className="actions">
              <button className="btn btn-approve" onClick={() => setSession(decide(session, 'approve'))}>批准</button>
              <button className="btn btn-edit" onClick={() => setSession(decide(session, 'edit-approve'))}>改后批准</button>
              <button className="btn btn-reject" onClick={() => setSession(decide(session, 'reject'))}>拒绝</button>
              <button className="btn btn-escalate" onClick={() => setSession(decide(session, 'escalate'))}>升级给人</button>
            </div>
            <button className="btn btn-ghost btn-recommend" onClick={handleRecommended}>
              推荐下一步（自动挑最优处置并顺手提升可提升的类目）→
            </button>
          </div>
        ) : (
          <div className="done-card">
            <h2>✔ 上午队列已清空</h2>
            <p>
              共 {total} 条动作：人工审阅 <b>{session.stats.humanReviews}</b> 次、自动放行{' '}
              <b>{session.stats.autoHandled}</b> 次、升级 <b>{session.stats.escalated}</b> 次、反转降级{' '}
              <b>{session.stats.reversed}</b> 次。
            </p>
            <p className="done-sub">
              被你「养」到自动放行的类目，明天开工即已自动——信任会跨天累积，而这个上午的省力只是第一天。
            </p>
            <div className="done-actions">
              <button className="btn btn-approve" onClick={goCompare}>去看「价值对比」→</button>
              <button className="btn btn-ghost" onClick={reset}>重放这个上午</button>
            </div>
          </div>
        )}
      </section>

      <aside className="col-side">
        <div className="side-card">
          <div className="side-head">
            <h3>本上午进度</h3>
            <button className="btn btn-mini" onClick={reset}>重置</button>
          </div>
          <div className="progress">
            <div className="progress-bar" style={{ width: `${(processed / total) * 100}%` }} />
          </div>
          <div className="counters">
            <div className="counter"><b>{session.stats.humanReviews}</b><span>人工审阅</span></div>
            <div className="counter counter-auto"><b>{session.stats.autoHandled}</b><span>自动放行</span></div>
            <div className="counter"><b>{session.stats.escalated}</b><span>升级</span></div>
            <div className="counter counter-rev"><b>{session.stats.reversed}</b><span>反转降级</span></div>
          </div>
        </div>

        <div className="side-card">
          <h3>信任阶梯（实时）</h3>
          <div className="mini-ladder">
            {CATEGORIES.map((c) => (
              <div key={c.id} className="mini-row">
                <span className="mini-label">{c.label}</span>
                <RungBar
                  rung={session.rungs[c.id]}
                  threshold={c.promoteThreshold}
                  auto={session.autoOn[c.id]}
                  locked={!c.autoEligible}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="side-card">
          <h3>审计流（可读，不止用于合规）</h3>
          <ul className="audit">
            {session.audit.length === 0 && <li className="audit-empty">还没有处置记录。</li>}
            {[...session.audit].reverse().slice(0, 12).map((a, i) => {
              const m = OUTCOME_META[a.outcome];
              return (
                <li key={`${a.proposalId}-${a.outcome}-${i}`} className="audit-row">
                  <span className={`oc ${m.cls}`}>{m.label}</span>
                  <span className="audit-summary">{a.summary}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </aside>
    </div>
  );
}
