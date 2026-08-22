// 绕行 Ràoxíng — 确定性诊断引擎（纯函数，无副作用，不接任何真实模型/网关）。
// 所有对外声称的数字都由这里推导，并在 _verify.ts 中核对过。

import { TRAFFIC, COST, SCALE_TO_DAILY, TrafficCategory } from './data/traffic';

/** 失败率达到此阈值的类别，才建议「改道到大模型」——避免对健康类别矫枉过正。 */
export const REROUTE_FAILRATE_THRESHOLD = 0.4;

export type RerouteState = Record<string, boolean>;

export function failRate(c: TrafficCategory): number {
  return (c.fallback + c.degrade) / c.volume;
}

export function recommendReroute(c: TrafficCategory): boolean {
  return failRate(c) >= REROUTE_FAILRATE_THRESHOLD;
}

// —— 单类别在两种路由下的成本 / 延迟 ——

/** 便宜优先（现状）：ok 与 degrade 走便宜；fallback = 便宜(失败) + 大模型。 */
export function categoryCostCheapFirst(c: TrafficCategory): number {
  return (c.ok + c.degrade) * COST.cheapUsd + c.fallback * (COST.cheapUsd + COST.bigUsd);
}
export function categoryLatencyCheapFirst(c: TrafficCategory): number {
  return (c.ok + c.degrade) * COST.cheapLatS + c.fallback * (COST.cheapLatS + COST.bigLatS);
}

/** 改道：整类直接走大模型，无回退、无静默降级。 */
export function categoryCostAllBig(c: TrafficCategory): number {
  return c.volume * COST.bigUsd;
}
export function categoryLatencyAllBig(c: TrafficCategory): number {
  return c.volume * COST.bigLatS;
}

export interface CategoryResult {
  cost: number;
  latency: number;
  fallbacks: number;
  degrades: number;
}

export function categoryResult(c: TrafficCategory, rerouted: boolean): CategoryResult {
  if (rerouted) {
    return { cost: categoryCostAllBig(c), latency: categoryLatencyAllBig(c), fallbacks: 0, degrades: 0 };
  }
  return {
    cost: categoryCostCheapFirst(c),
    latency: categoryLatencyCheapFirst(c),
    fallbacks: c.fallback,
    degrades: c.degrade,
  };
}

/** 改道一类的边际：多花的钱 与 消除的失败数（回退+静默降级）。 */
export function rerouteDelta(c: TrafficCategory): { extraCost: number; reliabilityGain: number } {
  return {
    extraCost: categoryCostAllBig(c) - categoryCostCheapFirst(c),
    reliabilityGain: c.fallback + c.degrade,
  };
}

// —— 全局基线（与开关状态无关）——

export const ALL_BIG_COST = TRAFFIC.reduce((s, c) => s + categoryCostAllBig(c), 0);
export const ALL_BIG_LATENCY = TRAFFIC.reduce((s, c) => s + categoryLatencyAllBig(c), 0);

/** 只有「便宜模型真正干成了活」的 OK 请求，才算可信的省钱。 */
export const TRUSTWORTHY_SAVINGS = TRAFFIC.reduce(
  (s, c) => s + c.ok * (COST.bigUsd - COST.cheapUsd),
  0,
);

export const TOTAL_VOLUME = TRAFFIC.reduce((s, c) => s + c.volume, 0);
export const TOTAL_OK = TRAFFIC.reduce((s, c) => s + c.ok, 0);
export const TOTAL_FALLBACK = TRAFFIC.reduce((s, c) => s + c.fallback, 0);
export const TOTAL_DEGRADE = TRAFFIC.reduce((s, c) => s + c.degrade, 0);

// —— 聚合 ——

export interface Aggregate {
  cost: number;
  latency: number;
  fallbacks: number;
  degrades: number;
  naiveSavings: number; // vs 全走大模型
  savingsPct: number;
}

export function aggregate(state: RerouteState): Aggregate {
  let cost = 0;
  let latency = 0;
  let fallbacks = 0;
  let degrades = 0;
  for (const c of TRAFFIC) {
    const r = categoryResult(c, !!state[c.id]);
    cost += r.cost;
    latency += r.latency;
    fallbacks += r.fallbacks;
    degrades += r.degrades;
  }
  const naiveSavings = ALL_BIG_COST - cost;
  return { cost, latency, fallbacks, degrades, naiveSavings, savingsPct: naiveSavings / ALL_BIG_COST };
}

// —— 现状（全便宜优先）下的「账面 vs 真实」诚实记账 ——

export interface HonestAccounting {
  currentCost: number;
  allBigCost: number;
  naiveSavings: number; // 账面节省
  naiveSavingsPct: number;
  trustworthySavings: number; // 只算 OK 部分
  phantom: number; // 幻觉 = 账面 - 可信
  phantomPct: number; // 幻觉占账面节省的比例
  fallbackTax: number; // 回退请求相对「直接走大模型」多花的钱
  extraTailLatency: number; // 回退带来的、相对「直接走大模型」多出的等待秒数
}

export function honestAccounting(): HonestAccounting {
  const cur = aggregate({}); // 全 false = 现状
  const naiveSavings = cur.naiveSavings;
  const phantom = naiveSavings - TRUSTWORTHY_SAVINGS;
  // 回退请求：实际成本 (cheap+big) 相对 直接走大模型 (big) 多花的 = cheap 那一笔。
  const fallbackTax = TOTAL_FALLBACK * COST.cheapUsd;
  // 回退请求相对「直接走大模型」多出的尾延迟 = 白跑一趟便宜模型的时间。
  const extraTailLatency = TOTAL_FALLBACK * COST.cheapLatS;
  return {
    currentCost: cur.cost,
    allBigCost: ALL_BIG_COST,
    naiveSavings,
    naiveSavingsPct: naiveSavings / ALL_BIG_COST,
    trustworthySavings: TRUSTWORTHY_SAVINGS,
    phantom,
    phantomPct: phantom / naiveSavings,
    fallbackTax,
    extraTailLatency,
  };
}

// —— 预设 ——

export type PresetId = 'current' | 'recommended' | 'all';

export function presetState(preset: PresetId): RerouteState {
  const s: RerouteState = {};
  for (const c of TRAFFIC) {
    if (preset === 'current') s[c.id] = false;
    else if (preset === 'all') s[c.id] = true;
    else s[c.id] = recommendReroute(c); // recommended
  }
  return s;
}

export function statesEqual(a: RerouteState, b: RerouteState): boolean {
  return TRAFFIC.every((c) => !!a[c.id] === !!b[c.id]);
}

export function whichPreset(state: RerouteState): PresetId | null {
  const ids: PresetId[] = ['current', 'recommended', 'all'];
  for (const p of ids) if (statesEqual(state, presetState(p))) return p;
  return null;
}

// —— 显示辅助 ——

export function usd(n: number): string {
  return '$' + n.toFixed(3);
}

/** 按抽样比例外推到「约 100 万请求/天」的美元/天。 */
export function scaledUsdPerDay(n: number): string {
  const v = n * SCALE_TO_DAILY;
  if (v >= 1000) return '$' + (v / 1000).toFixed(1) + 'k';
  return '$' + Math.round(v);
}

export function pct(n: number): string {
  return (n * 100).toFixed(0) + '%';
}

export function pct1(n: number): string {
  return (n * 100).toFixed(1) + '%';
}
