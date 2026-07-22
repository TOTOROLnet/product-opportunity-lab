import type { Decision, Order, Recommendation, Severity } from '../types';

// ── 确定性核验引擎（纯函数）──
// 真实产品中这里是 AI 对结账页的解析 + 风险模型；本 Demo 用确定性计算代理，
// 只为证明「机制成立与价值形态」，不代表真实识别质量。

export const money = (n: number): string => `¥${Math.round(n).toLocaleString('zh-CN')}`;

/** 真实总价 = 所有费用拆解项求和（含隐藏费）。 */
export const trueTotal = (order: Order): number =>
  order.costLines.reduce((sum, l) => sum + l.amount, 0);

/** 隐藏费 = 首屏标价之外、结算前才追加的部分。 */
export const hiddenTotal = (order: Order): number =>
  order.costLines.filter((l) => l.hidden).reduce((sum, l) => sum + l.amount, 0);

/** 隐藏费占真实总价的比例（0–1）。 */
export const hiddenRatio = (order: Order): number => {
  const total = trueTotal(order);
  return total > 0 ? hiddenTotal(order) / total : 0;
};

/** 未满足的意图约束条数。 */
export const failedIntents = (order: Order): number =>
  order.intentChecks.filter((c) => !c.ok).length;

const severityRank: Record<Severity, number> = { low: 1, medium: 2, high: 3 };

/** 订单整体风险等级：由陷阱严重度与意图冲突综合得出。 */
export const orderRisk = (order: Order): 'clean' | 'low' | 'medium' | 'high' => {
  const maxTrap = order.traps.reduce<number>((m, t) => Math.max(m, severityRank[t.severity]), 0);
  const level = Math.max(maxTrap, failedIntents(order) > 0 ? 2 : 0);
  if (order.traps.length === 0 && failedIntents(order) === 0) return 'clean';
  if (level >= 3) return 'high';
  if (level === 2) return 'medium';
  return 'low';
};

export const IRREVERSIBLE_THRESHOLD = 40;

export const isIrreversible = (order: Order): boolean =>
  order.reversibility.score < IRREVERSIBLE_THRESHOLD;

export const recommendationLabel = (r: Recommendation): string =>
  ({ approve: '可放心批准', modify: '建议让 agent 改', reject: '建议拒绝' }[r]);

export const decisionLabel = (d: Decision): string =>
  ({ pending: '待核验', approved: '已批准成交', modified: '已退回改单', rejected: '已拒绝' }[d]);

export interface SessionStats {
  total: number;
  verified: number; // 已做决策数
  approved: number;
  modified: number;
  rejected: number;
  // 「无守门人」= agent 自动成交全部：
  autoCommitSpend: number; // 会承诺的总支出
  autoHiddenFees: number; // 其中隐藏费
  autoTraps: number; // 会踩中的陷阱数
  autoIrreversible: number; // 会留下的几乎不可逆承诺数
  // 「有守门人」= 按你的决策：
  approvedSpend: number; // 你实际放行的支出
  avoidedSpend: number; // 避免的可疑支出（拒单全额 + 改单隐藏费）
  trapsAvoided: number; // 拦下的陷阱数（拒单 + 改单）
  irreversibleAvoided: number; // 避免的不可逆承诺数
}

export function computeSession(orders: Order[], decisions: Record<string, Decision>): SessionStats {
  const stats: SessionStats = {
    total: orders.length,
    verified: 0,
    approved: 0,
    modified: 0,
    rejected: 0,
    autoCommitSpend: 0,
    autoHiddenFees: 0,
    autoTraps: 0,
    autoIrreversible: 0,
    approvedSpend: 0,
    avoidedSpend: 0,
    trapsAvoided: 0,
    irreversibleAvoided: 0,
  };

  for (const order of orders) {
    const total = trueTotal(order);
    // 无守门人：全部自动成交
    stats.autoCommitSpend += total;
    stats.autoHiddenFees += hiddenTotal(order);
    stats.autoTraps += order.traps.length;
    if (isIrreversible(order)) stats.autoIrreversible += 1;

    // 有守门人：按决策
    const d = decisions[order.id] ?? 'pending';
    if (d !== 'pending') stats.verified += 1;
    if (d === 'approved') {
      stats.approved += 1;
      stats.approvedSpend += total;
    } else if (d === 'modified') {
      stats.modified += 1;
      stats.avoidedSpend += hiddenTotal(order); // 改单后重买干净版本，至少省下隐藏费
      stats.trapsAvoided += order.traps.length;
      if (isIrreversible(order)) stats.irreversibleAvoided += 1;
    } else if (d === 'rejected') {
      stats.rejected += 1;
      stats.avoidedSpend += total; // 整单不买，避免全部可疑支出
      stats.trapsAvoided += order.traps.length;
      if (isIrreversible(order)) stats.irreversibleAvoided += 1;
    }
  }

  return stats;
}
