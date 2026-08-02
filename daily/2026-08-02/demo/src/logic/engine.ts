// 换挡 Downshift — 确定性成本/裁决引擎（纯函数，无副作用、无网络）。
// 核心命题：单位 token 便宜 ≠ 单位任务便宜。真正决定成败的是
//   每成功任务成本 = 每任务成本 ÷ 成功率
// 它把「成本」和「能力（成功率/步数）」耦合进同一个数。
//
// 所有数值均为 mock，用于演示方法论，非真实跑分。引擎数值已用一次性脚本预校验。

import type {
  Analysis,
  CostBreakdown,
  ModelProfile,
  PriceCard,
  ReasonKey,
  Verdict,
  Workload,
} from '../types';

/** 有效输入单价：命中/未命中按缓存命中率加权（$/百万 token）。 */
export function effInput(price: PriceCard, cacheHit: number): number {
  const h = clamp01(cacheHit);
  return price.inputHit * h + price.inputMiss * (1 - h);
}

/** 单个模型在某工作负载上的每任务成本拆解。 */
export function costPerTask(m: ModelProfile): CostBreakdown {
  const inTok = m.baseInTok * m.stepMult;
  const outTok = m.baseOutTok * m.stepMult * m.verbosity;
  const ei = effInput(m.price, m.cacheHit);
  const costIn = (inTok / 1e6) * ei;
  const costOut = (outTok / 1e6) * m.price.output;
  return {
    effInput: ei,
    inTok,
    outTok,
    costIn,
    costOut,
    costPerTask: costIn + costOut,
  };
}

/**
 * 裁决分档（优先级从上到下）：
 *  - 成功率明显低于底线（floor-0.05 以下）：既更贵→别换；否则→先修再换
 *  - 诚实成本比 > 1.15（每成功任务反而更贵）：别换
 *  - 成功率略低于底线：有条件换（微调后可换）
 *  - 更便宜(r<=0.9)且成功率守住(Δ>=-0.05)：值得换
 *  - 其余（成本大致持平、成功率达标）：有条件换
 */
export function classifyVerdict(params: {
  costRatio: number;
  successB: number;
  successDelta: number;
  floor: number;
}): { verdict: Verdict; reasonKey: ReasonKey } {
  const { costRatio, successB, successDelta, floor } = params;
  if (successB < floor - 0.05) {
    if (costRatio > 1.2) return { verdict: 'KEEP', reasonKey: 'both-bad' };
    return { verdict: 'FIX_FIRST', reasonKey: 'quality-gap-material' };
  }
  if (costRatio > 1.15) {
    return { verdict: 'KEEP', reasonKey: 'cost-flip' };
  }
  if (successB < floor) {
    return { verdict: 'SWAP_WITH_FIXES', reasonKey: 'minor-quality-gap' };
  }
  if (costRatio <= 0.9 && successDelta >= -0.05) {
    return { verdict: 'SWAP', reasonKey: 'cheaper-success-held' };
  }
  return { verdict: 'SWAP_WITH_FIXES', reasonKey: 'marginal-ok' };
}

/**
 * 盈亏平衡成功率：在候选模型 B 当前的步数膨胀/啰嗦度下，
 * 使「每成功任务成本」与 A 打平所需的 B 成功率。
 * 由 cpsB = cptB / sB == cpsA 解得 sB = cptB / cpsA。
 * 返回值可能 > 1，表示「即使 100% 成功也仍比 A 贵」（结构性更贵）。
 */
export function breakEvenSuccess(cptB: number, cpsA: number): number {
  if (cpsA <= 0) return Infinity;
  return cptB / cpsA;
}

/** 对一个工作负载做完整迁移分析。 */
export function analyze(w: Workload): Analysis {
  return analyzeWith(w, w.B.success, w.B.stepMult);
}

/**
 * 带覆盖参数的分析（供盈亏平衡页的滑杆实时重算）：
 * 覆盖 B 的成功率与步数膨胀，其余保持工作负载定义。
 */
export function analyzeWith(
  w: Workload,
  successB: number,
  stepMultB: number,
): Analysis {
  const A = costPerTask(w.A);
  const bProfile: ModelProfile = { ...w.B, success: successB, stepMult: stepMultB };
  const B = costPerTask(bProfile);

  const cpsA = A.costPerTask / w.A.success;
  const cpsB = B.costPerTask / clampPos(successB);
  const costRatio = cpsB / cpsA;
  const vanityRatio = w.B.price.output / w.A.price.output;
  const successDelta = successB - w.A.success;
  const be = breakEvenSuccess(B.costPerTask, cpsA);
  const { verdict, reasonKey } = classifyVerdict({
    costRatio,
    successB,
    successDelta,
    floor: w.floor,
  });

  return {
    A,
    B,
    cpsA,
    cpsB,
    costRatio,
    vanityRatio,
    successDelta,
    breakEvenSuccess: be,
    verdict,
    reasonKey,
  };
}

// ---- 格式化助手（只在展示层四舍五入，引擎内部保持原始精度） ----

/** 把比值格式化成「−75%」/「+35%」形式（相对 1 的变化）。 */
export function fmtDelta(ratio: number): string {
  const pct = (ratio - 1) * 100;
  const sign = pct > 0 ? '+' : pct < 0 ? '−' : '';
  return `${sign}${Math.abs(pct).toFixed(0)}%`;
}

/** 成本比值本身（如 0.25×） */
export function fmtRatio(ratio: number): string {
  return `${ratio.toFixed(2)}×`;
}

export function fmtPct(x: number, digits = 0): string {
  return `${(x * 100).toFixed(digits)}%`;
}

/** 单任务美元成本（很小），用 4 位有效展示。 */
export function fmtUSD(x: number): string {
  if (x >= 1) return `$${x.toFixed(3)}`;
  if (x >= 0.001) return `$${x.toFixed(4)}`;
  return `$${x.toFixed(5)}`;
}

/** 月度体量成本（tasksPerMonth × 每成功任务成本），用于把抽象单价放大成钱。 */
export function monthlyCost(cps: number, tasksPerMonth: number): number {
  return cps * tasksPerMonth;
}

export function fmtMoney(x: number): string {
  if (x >= 1000) return `$${(x / 1000).toFixed(1)}k`;
  return `$${x.toFixed(0)}`;
}

export function fmtTok(x: number): string {
  if (x >= 1000) return `${(x / 1000).toFixed(x >= 10000 ? 0 : 1)}k`;
  return `${Math.round(x)}`;
}

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}
function clampPos(x: number): number {
  return Math.max(0.01, x);
}
