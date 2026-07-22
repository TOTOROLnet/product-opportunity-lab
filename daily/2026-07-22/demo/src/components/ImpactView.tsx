import type { Decision, Scenario } from '../types';
import {
  computeSession,
  decisionLabel,
  hiddenTotal,
  isIrreversible,
  money,
  trueTotal,
} from '../logic/engine';

interface Props {
  scenario: Scenario;
  decisions: Record<string, Decision>;
}

export function ImpactView({ scenario, decisions }: Props) {
  const stats = computeSession(scenario.orders, decisions);
  const allDecided = stats.verified === stats.total;

  return (
    <div className="impact">
      <h2 className="impact-h">价值对比：无守门人 vs 有守门人</h2>
      <p className="impact-sub">
        同一批由 agent 提交的订单，看看「让 agent 自动成交」与「经 CommitGuard 核验」两条路径的差别。
      </p>

      <div className="ba-grid">
        {/* Before */}
        <div className="ba-card before">
          <div className="ba-tag">无守门人 · agent 自动成交全部</div>
          <div className="ba-headline bad">{money(stats.autoCommitSpend)}</div>
          <div className="ba-headline-cap">会被直接承诺的总支出</div>
          <ul className="ba-list">
            <li>
              <span className="bad">隐藏费 {money(stats.autoHiddenFees)}</span> 在结算前才追加，你看不见
            </li>
            <li>
              踩中 <span className="bad">{stats.autoTraps} 个陷阱</span>（自动续订 / 预勾选 / drip pricing / 不可退）
            </li>
            <li>
              留下 <span className="bad">{stats.autoIrreversible} 笔</span>几乎不可逆的承诺
            </li>
            <li>其中含 1 笔越权成交（你没让它买机票）</li>
          </ul>
        </div>

        {/* After */}
        <div className="ba-card after">
          <div className="ba-tag">有守门人 · 经你核验后</div>
          <div className="ba-headline good">{money(stats.avoidedSpend)}</div>
          <div className="ba-headline-cap">避免的可疑支出（拒单全额 + 改单隐藏费）</div>
          <ul className="ba-list">
            <li>
              放行 <span className="good">{stats.approved} 笔</span>干净的单，共 {money(stats.approvedSpend)}
            </li>
            <li>
              拦下 / 退回 <span className="good">{stats.modified + stats.rejected} 笔</span>可疑单
            </li>
            <li>
              避免 <span className="good">{stats.trapsAvoided} 个陷阱</span>、
              <span className="good">{stats.irreversibleAvoided} 笔</span>不可逆承诺
            </li>
            <li>{allDecided ? '全部订单已核验完毕 ✓' : `还有 ${stats.total - stats.verified} 笔待核验`}</li>
          </ul>
        </div>
      </div>

      {/* 拦截账本 */}
      <h3 className="ledger-h">拦截账本（逐单记录你的决策与理由）</h3>
      <div className="ledger">
        <div className="ledger-row ledger-head">
          <span>订单</span>
          <span>真实总价</span>
          <span>你的决策</span>
          <span>拦下了什么</span>
        </div>
        {scenario.orders.map((o) => {
          const d: Decision = decisions[o.id] ?? 'pending';
          const caught =
            d === 'approved'
              ? '—（干净单，放行）'
              : d === 'pending'
                ? '待核验'
                : `${o.traps.length} 个陷阱 · 隐藏费 ${money(hiddenTotal(o))}${
                    isIrreversible(o) ? ' · 不可逆' : ''
                  }`;
          return (
            <div key={o.id} className="ledger-row">
              <span className="l-title">{o.title}</span>
              <span>{money(trueTotal(o))}</span>
              <span className={`l-decision d-${d}`}>{decisionLabel(d)}</span>
              <span className="l-caught">{caught}</span>
            </div>
          );
        })}
      </div>

      <div className="verdict">
        {allDecided ? (
          <>
            <strong>本次会话战报：</strong>你只花 {money(stats.approvedSpend)} 放行了 {stats.approved} 笔真正符合要求的单，
            避免了约 {money(stats.avoidedSpend)} 的可疑支出、{stats.trapsAvoided} 个套路和 {stats.irreversibleAvoided} 笔不可逆承诺。
            这就是「站在你这边、成交前的一层清醒」的价值。
          </>
        ) : (
          <>回到「守门台」把每一笔订单都做出决策，这里的战报会实时更新。</>
        )}
      </div>
    </div>
  );
}
