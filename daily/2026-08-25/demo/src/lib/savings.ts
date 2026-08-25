import type { FleetRun } from '../types';

// 价值估算：确定性 mock，所有单价均为带标注的假设，非营销数字。
// 复用一条现成配方 = 直接跑蒸馏后的 recipe 步骤，而不必把当时的弯路/重试重走一遍。

// mock 假设（在「来源与信任」页有说明）：
export const MIN_PER_STEP = 1.6; // 每步（tool-call/命令，含试错开销）平均耗时 ~1.6 分钟
export const USD_PER_STEP = 0.12; // 每步平均 token + sandbox 机时成本 ~$0.12

export interface Savings {
  rawSteps: number;
  recipeSteps: number;
  stepsSaved: number; // 复用一次省下的步数
  minutesSaved: number;
  dollarsSaved: number; // 复用一次省下的钱
}

export function savingsForRun(run: FleetRun): Savings {
  const rawSteps = run.rawSteps.length;
  const recipeSteps = run.recipe.length;
  const stepsSaved = Math.max(0, rawSteps - recipeSteps);
  return {
    rawSteps,
    recipeSteps,
    stepsSaved,
    minutesSaved: Math.round(stepsSaved * MIN_PER_STEP),
    dollarsSaved: Math.round(stepsSaved * USD_PER_STEP * 100) / 100,
  };
}

// 舰队每月潜在节省（针对某一条配方）：
// = 单次复用省下的钱 × 该类任务每台 agent 每月复发次数 × 舰队规模。
// 诚实说明：这假设复用命中率为 100% 且每台 agent 都会遇到这类任务，是「上限型」估算。
export function fleetMonthlyForRun(run: FleetRun, fleetSize: number): number {
  const s = savingsForRun(run);
  return Math.round(s.dollarsSaved * run.recurPerAgentMonth * fleetSize);
}

// 全舰队跨所有 corpus 配方的每月潜在节省上限（用于总览）。
export function fleetMonthlyTotal(runs: FleetRun[], fleetSize: number): number {
  return runs
    .filter((r) => r.verified)
    .reduce((sum, r) => sum + fleetMonthlyForRun(r, fleetSize), 0);
}
