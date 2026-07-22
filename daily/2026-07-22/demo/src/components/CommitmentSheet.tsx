import type { Decision, Order } from '../types';
import {
  hiddenTotal,
  hiddenRatio,
  money,
  recommendationLabel,
  trueTotal,
} from '../logic/engine';
import { ReversibilityGauge, ScoreBar, severityMeta } from './ui';

interface Props {
  order: Order;
  decision: Decision;
  onDecide: (id: string, decision: Decision) => void;
}

export function CommitmentSheet({ order, decision, onDecide }: Props) {
  const total = trueTotal(order);
  const hidden = hiddenTotal(order);
  const hiddenPct = Math.round(hiddenRatio(order) * 100);
  const recTone =
    order.recommendation === 'approve' ? 'good' : order.recommendation === 'modify' ? 'warn' : 'bad';

  return (
    <div className="sheet">
      <div className="sheet-head">
        <div>
          <div className="sheet-title">{order.title}</div>
          <div className="sheet-merchant">{order.merchant}</div>
        </div>
        <div className={`rec-badge rec-${recTone}`}>{recommendationLabel(order.recommendation)}</div>
      </div>

      <div className="agent-note">
        <span className="agent-note-tag">agent 的说法</span>「{order.agentNote}」
      </div>

      {/* 1. 意图对齐 */}
      <section className="block">
        <h3 className="block-title">
          <span className="block-idx">1</span> 意图对齐：你要的 vs agent 真要成交的
        </h3>
        <div className="intent-list">
          {order.intentChecks.map((c) => (
            <div key={c.label} className={`intent-row ${c.ok ? 'ok' : 'bad'}`}>
              <span className="intent-mark">{c.ok ? '✓' : '✗'}</span>
              <span className="intent-label">{c.label}</span>
              <span className="intent-vals">
                <span className="intent-req">要求：{c.required}</span>
                <span className={`intent-act ${c.ok ? '' : 'mismatch'}`}>实际：{c.actual}</span>
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* 2. 真实总价拆解 */}
      <section className="block">
        <h3 className="block-title">
          <span className="block-idx">2</span> 真实总价拆解
        </h3>
        <div className="cost-list">
          {order.costLines.map((l) => (
            <div key={l.label} className={`cost-row ${l.hidden ? 'hidden-fee' : ''}`}>
              <span className="cost-label">
                {l.label}
                {l.hidden && <span className="hidden-tag">结算前才加</span>}
              </span>
              <span className="cost-amt">{money(l.amount)}</span>
            </div>
          ))}
          <div className="cost-row total">
            <span className="cost-label">真实总价</span>
            <span className="cost-amt">{money(total)}</span>
          </div>
        </div>
        <div className="cost-compare">
          <span>首屏标价 {money(order.listedPrice)}</span>
          <span className="arrow">→</span>
          <span className="real">真实 {money(total)}</span>
          {hidden > 0 && (
            <span className="hidden-callout">隐藏了 {money(hidden)}（{hiddenPct}%）</span>
          )}
        </div>
      </section>

      {/* 3. 陷阱雷达 */}
      <section className="block">
        <h3 className="block-title">
          <span className="block-idx">3</span> 陷阱雷达
          <span className="trap-count">{order.traps.length} 项</span>
        </h3>
        {order.traps.length === 0 ? (
          <div className="no-trap">✓ 未发现自动续订 / 预勾选 / 隐藏费 / 不可退等套路。</div>
        ) : (
          <div className="trap-list">
            {order.traps.map((t) => (
              <div key={t.title} className="trap-row">
                <span className={`sev-dot ${severityMeta[t.severity].cls}`}>
                  {severityMeta[t.severity].label}
                </span>
                <div className="trap-body">
                  <div className="trap-title">
                    <span className="trap-type">{t.type}</span>
                    {t.title}
                  </div>
                  <div className="trap-detail">{t.detail}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 4. 可逆性 + 商户可信 */}
      <section className="block two-col">
        <div>
          <h3 className="block-title">
            <span className="block-idx">4</span> 可逆性
          </h3>
          <ReversibilityGauge score={order.reversibility.score} />
          <ul className="rev-list">
            <li>退款窗口：{order.reversibility.refundWindow}</li>
            <li>退款难度：{order.reversibility.refundDifficulty}</li>
            <li>取消路径：{order.reversibility.cancelPath}</li>
          </ul>
          <div className="rev-summary">买错了怎么办：{order.reversibility.summary}</div>
        </div>
        <div>
          <h3 className="block-title">商户可信度</h3>
          <ScoreBar score={order.merchantTrust.score} />
          <div className="merchant-note">{order.merchantTrust.note}</div>
        </div>
      </section>

      {/* 修改指令（仅当选了「让 agent 改」） */}
      {decision === 'modified' && order.modifyInstruction && (
        <div className="modify-box">
          <div className="modify-head">↩︎ 已把这条指令发回给 agent 重做：</div>
          <div className="modify-text">「{order.modifyInstruction}」</div>
        </div>
      )}

      {/* 决策区 */}
      <div className="decisions">
        <button
          className={`btn btn-approve ${decision === 'approved' ? 'active' : ''}`}
          onClick={() => onDecide(order.id, 'approved')}
        >
          批准成交
        </button>
        <button
          className={`btn btn-modify ${decision === 'modified' ? 'active' : ''}`}
          onClick={() => onDecide(order.id, 'modified')}
        >
          让 agent 改
        </button>
        <button
          className={`btn btn-reject ${decision === 'rejected' ? 'active' : ''}`}
          onClick={() => onDecide(order.id, 'rejected')}
        >
          拒绝
        </button>
      </div>
      <div className="decision-hint">
        CommitGuard 只拦截、只呈现，最终按不按下确认，永远由你决定。
      </div>
    </div>
  );
}
