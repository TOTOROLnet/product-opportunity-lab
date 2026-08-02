// 换挡 Downshift — 类型定义（全部 mock，无真实后端）

/** 模型价目：单位为 $ / 百万 token。 */
export interface PriceCard {
  /** 未命中缓存的输入单价 */
  inputMiss: number;
  /** 命中缓存的输入单价 */
  inputHit: number;
  /** 输出单价 */
  output: number;
}

/** 某模型在某工作负载上的（重放观测到的）行为画像。 */
export interface ModelProfile {
  /** 模型显示名 */
  name: string;
  price: PriceCard;
  /** 每任务基线输入 token（A 为实测；B 为重放观测） */
  baseInTok: number;
  /** 每任务基线输出 token */
  baseOutTok: number;
  /** 缓存命中率 0–1 */
  cacheHit: number;
  /** 重放成功率 0–1 */
  success: number;
  /** 步数相对 A 的倍率（A=1） */
  stepMult: number;
  /** 输出啰嗦度相对 A 的倍率（A=1） */
  verbosity: number;
}

/** 一个工作负载 = 一批历史 trace 的汇总 + 现有模型 A + 候选模型 B。 */
export interface Workload {
  id: string;
  name: string;
  /** 一句话场景 */
  scene: string;
  /** 可上线的成功率底线（产品定义，低于它就算便宜也不能上） */
  floor: number;
  /** 这批 trace 的规模（用于把单任务成本换算成月度体量，纯展示） */
  tasksPerMonth: number;
  A: ModelProfile;
  B: ModelProfile;
}

export type Verdict = 'SWAP' | 'SWAP_WITH_FIXES' | 'FIX_FIRST' | 'KEEP';

/** 单个模型的成本拆解（每任务）。 */
export interface CostBreakdown {
  effInput: number; // 有效输入单价（计入缓存命中）
  inTok: number; // 每任务输入 token
  outTok: number; // 每任务输出 token
  costIn: number; // 每任务输入成本
  costOut: number; // 每任务输出成本
  costPerTask: number; // 每任务总成本
}

/** 一次迁移分析结果。 */
export interface Analysis {
  A: CostBreakdown;
  B: CostBreakdown;
  cpsA: number; // 每成功任务成本 A
  cpsB: number; // 每成功任务成本 B
  costRatio: number; // 诚实成本比 r = cpsB / cpsA
  vanityRatio: number; // 厂商话术：表面输出单价比 B/A
  successDelta: number; // 成功率变化 sB - sA
  breakEvenSuccess: number; // 当前步数膨胀下，B 的盈亏平衡成功率
  verdict: Verdict;
  reasonKey: ReasonKey;
}

export type ReasonKey =
  | 'cheaper-success-held'
  | 'minor-quality-gap'
  | 'quality-gap-material'
  | 'cost-flip'
  | 'both-bad'
  | 'marginal-ok';
