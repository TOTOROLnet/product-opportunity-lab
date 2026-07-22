import type { Decision, Order, Scenario } from '../types';
import {
  computeSession,
  decisionLabel,
  money,
  orderRisk,
  trueTotal,
} from '../logic/engine';
import { CommitmentSheet } from './CommitmentSheet';
import { categoryIcon } from './ui';

interface Props {
  scenario: Scenario;
  decisions: Record<string, Decision>;
  selectedId: string;
  onSelect: (id: string) => void;
  onDecide: (id: string, decision: Decision) => void;
  onAcceptAll: () => void;
}

const riskLabel: Record<ReturnType<typeof orderRisk>, string> = {
  clean: '干净',
  low: '低风险',
  medium: '需注意',
  high: '高风险',
};

function OrderCard({
  order,
  active,
  decision,
  onSelect,
}: {
  order: Order;
  active: boolean;
  decision: Decision;
  onSelect: (id: string) => void;
}) {
  const risk = orderRisk(order);
  return (
    <button className={`order-card ${active ? 'active' : ''}`} onClick={() => onSelect(order.id)}>
      <div className="oc-top">
        <span className="oc-icon">{categoryIcon[order.category]}</span>
        <span className="oc-title">{order.title}</span>
      </div>
      <div className="oc-merchant">{order.merchant}</div>
      <div className="oc-bottom">
        <span className="oc-price">{money(trueTotal(order))}</span>
        <span className={`oc-risk risk-${risk}`}>{riskLabel[risk]}</span>
      </div>
      {decision !== 'pending' && (
        <div className={`oc-decision d-${decision}`}>{decisionLabel(decision)}</div>
      )}
    </button>
  );
}

export function GuardView({
  scenario,
  decisions,
  selectedId,
  onSelect,
  onDecide,
  onAcceptAll,
}: Props) {
  const stats = computeSession(scenario.orders, decisions);
  const selected = scenario.orders.find((o) => o.id === selectedId) ?? scenario.orders[0];

  return (
    <div className="guard">
      {/* 任务卡 */}
      <div className="task-card">
        <div className="task-main">
          <div className="task-kicker">你委托给 {scenario.task.delegatedTo} 的任务</div>
          <div className="task-title">{scenario.task.title}</div>
          <div className="task-constraints">
            {scenario.task.constraints.map((c) => (
              <span key={c} className="constraint">
                {c}
              </span>
            ))}
          </div>
        </div>
        <div className="task-side">
          <div className="task-side-num">{scenario.orders.length}</div>
          <div className="task-side-cap">笔待成交订单
            <br />已在成交前拦下</div>
        </div>
      </div>

      {/* 实时结余条 */}
      <div className="tally">
        <div className="tally-item">
          <span className="tally-num">{stats.verified}/{stats.total}</span>
          <span className="tally-cap">已核验</span>
        </div>
        <div className="tally-item good">
          <span className="tally-num">{stats.approved}</span>
          <span className="tally-cap">放行</span>
        </div>
        <div className="tally-item warn">
          <span className="tally-num">{stats.modified + stats.rejected}</span>
          <span className="tally-cap">拦下 / 改单</span>
        </div>
        <div className="tally-item money">
          <span className="tally-num">{money(stats.avoidedSpend)}</span>
          <span className="tally-cap">避免可疑支出</span>
        </div>
        <div className="tally-item danger">
          <span className="tally-num">{stats.trapsAvoided}</span>
          <span className="tally-cap">拦下陷阱</span>
        </div>
        <button className="accept-all" onClick={onAcceptAll}>
          一键采用建议
        </button>
      </div>

      <div className="guard-body">
        {/* 左：待成交订单 */}
        <aside className="order-list">
          <div className="list-head">agent 提交的待成交订单</div>
          {scenario.orders.map((o) => (
            <OrderCard
              key={o.id}
              order={o}
              active={o.id === selected.id}
              decision={decisions[o.id] ?? 'pending'}
              onSelect={onSelect}
            />
          ))}
        </aside>

        {/* 右：成交核验单 */}
        <main className="sheet-wrap">
          <CommitmentSheet
            order={selected}
            decision={decisions[selected.id] ?? 'pending'}
            onDecide={onDecide}
          />
        </main>
      </div>
    </div>
  );
}
