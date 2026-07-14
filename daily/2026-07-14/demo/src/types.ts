// 值当 Worthwhile — 领域模型
//
// 诚实声明：每个付费源的价格 / 覆盖的信息需求 / 覆盖质量 / 可靠度是"手工 mock 标注"的；
// 但 planner.ts 里"按边际价值/成本择优 → 去重 → 够用即止 / 预算封顶"的规划算法是真实运行的。
// 拖动预算 / 够用标准会真实改变计划与账单——这是 "mock 数据 + 真实优化逻辑"。

export interface SubNeed {
  id: string;
  label: string;
  /** 该信息需求对整体任务的权重（越大越重要）。 */
  weight: number;
}

export interface Source {
  id: string;
  name: string;
  category: string;
  /** 单次调用价格（美元），对应 AgentKey/Loomal 的"调用前成本可见"。 */
  priceUSD: number;
  /** 数据可靠度 0..1，会折损有效覆盖质量。 */
  reliability: number;
  /** 该源对各信息需求的原始覆盖质量 0..1（subNeedId -> quality）。 */
  covers: Record<string, number>;
  /** 简短说明（用于市场卡片）。 */
  note?: string;
}

export interface Scenario {
  id: string;
  title: string;
  brief: string;
  /** agent 的任务目标一句话。 */
  goal: string;
  subNeeds: SubNeed[];
  sources: Source[];
  /** 默认预算（美元）。 */
  defaultBudget: number;
  /** 默认够用标准 0..1（每个信息需求达到该覆盖质量即"够用"）。 */
  defaultQualityBar: number;
  /** 是否为 CONTROL 场景（本就接近最优，用于验证"不逢事就喊省"）。 */
  isControl?: boolean;
}

export type Verdict = 'worth' | 'redundant' | 'wasted' | 'skipped-budget';

export interface CallRecord {
  source: Source;
  /** 在价值排序中的调用序号（0-based），仅对真正进入排序的源有意义。 */
  order: number;
  /** 本次调用相对"此前已调用集合"的边际价值（权重单位）。 */
  marginalGain: number;
  /** 若它是被调用的第一个源时的独立价值（权重单位）。 */
  standaloneGain: number;
  verdict: Verdict;
  /** 该源覆盖到"可用下限"以上的信息需求标签。 */
  coveredNeeds: string[];
  /** 人类可读的裁决理由。 */
  reason: string;
}

export interface PlanResult {
  /** 贪婪基线：一把梭调用所有源。 */
  greedyCalls: CallRecord[];
  greedyTotalUSD: number;
  greedyProgress: number; // 0..1
  /** 值当计划：只调用"值"的源，够用即止、预算封顶。 */
  worthwhileCalls: CallRecord[];
  worthwhileTotalUSD: number;
  worthwhileProgress: number; // 0..1
  /** 省下的金额与比例。 */
  savedUSD: number;
  savedPct: number; // 0..1
  /** 每个信息需求在两种策略下的最终覆盖（用于对比条）。 */
  coverageByNeed: {
    need: SubNeed;
    greedyCoverage: number;
    worthwhileCoverage: number;
  }[];
  /** 值当停手的原因（用于叙事）。 */
  stopReason: string;
  /** 是否接近最优（省额比例很小）——用于 CONTROL 提示。 */
  nearOptimal: boolean;
}
