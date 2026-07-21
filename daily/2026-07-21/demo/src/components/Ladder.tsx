import {
  recallAuto,
  CATEGORIES,
  type SessionState,
} from '../logic/engine';
import { AgentTag, RevBadge, RungBar } from './ui';

export default function Ladder({
  session,
  setSession,
}: {
  session: SessionState;
  setSession: (s: SessionState) => void;
}) {
  const autoCats = CATEGORIES.filter((c) => session.autoOn[c.id]);

  const handledOf = (catId: string) =>
    session.audit.filter((a) => a.categoryId === catId && a.outcome !== 'reversed').length;

  return (
    <div className="ladder-page">
      <div className="explainer">
        <h2>「信任阶」是什么</h2>
        <p>
          报告里那句「自主执行的信任要<strong>一格一格</strong>挣」，在别的产品里只是一句风险提示。
          这里把「一格」做成一个<strong>可运行的状态量</strong>：每一次一致的人工批准让某类动作的信任 <b>+1 格</b>；
          到门槛（本 Demo 为 3 格）即可<strong>提升为自动放行</strong>；一旦某条自动放行的动作被反转/投诉，
          该类信任<strong>立即 −1 格并暂停自动</strong>——挣得慢、掉得快，且全程可审计、可一键收回。
        </p>
        <p className="explainer-sub">
          高风险 / 不可逆类目（退款大额、信用冻结、法务、批量改写、生产部署）<b>被锁定为始终人工</b>，
          无论证据多少都不会自动放行——这就是「省力 ≠ 失控」的安全红线。
        </p>
      </div>

      {autoCats.length > 0 && (
        <div className="policy-card">
          <h3>当前生效的自动放行策略（{autoCats.length}）· 可一键收回</h3>
          <ul className="policy-list">
            {autoCats.map((c) => (
              <li key={c.id} className="policy-row">
                <div className="policy-info">
                  <AgentTag agent={c.agent} />
                  <span className="policy-rule">
                    自动放行「<b>{c.label}</b>」（信任 {session.rungs[c.id]}/5，已自动处理{' '}
                    {session.audit.filter((a) => a.categoryId === c.id && a.outcome === 'auto-approved').length} 条）
                  </span>
                </div>
                <button className="btn btn-mini btn-reject" onClick={() => setSession(recallAuto(session, c.id))}>
                  收回自动
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="ladder-grid">
        {CATEGORIES.map((c) => {
          const rung = session.rungs[c.id];
          const auto = session.autoOn[c.id];
          const locked = !c.autoEligible;
          return (
            <div key={c.id} className={`ladder-card ${locked ? 'lc-locked' : ''} ${auto ? 'lc-auto' : ''}`}>
              <div className="lc-head">
                <span className="lc-title">{c.label}</span>
                <AgentTag agent={c.agent} />
              </div>
              <RevBadge level={c.reversibility} />
              <div className="lc-rung">
                <RungBar rung={rung} threshold={c.promoteThreshold} auto={auto} locked={locked} />
              </div>
              <p className="lc-stat">
                已处置 <b>{handledOf(c.id)}</b> 条
                {locked ? ' · 始终人工' : auto ? ' · 自动放行中' : ` · 距自动还差 ${Math.max(0, c.promoteThreshold - rung)} 格`}
              </p>
              <p className="lc-hint">{c.stakeHint}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
