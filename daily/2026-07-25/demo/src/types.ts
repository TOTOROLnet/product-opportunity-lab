// 火候 Huohou —— 数据类型定义
// 全部为纯前端 mock + 确定性计算，无后端 / 无真实训练 / 无外部 API。

/** 失败信号种类：决定「该用哪种杠杆」的核心归因 */
export type FailureKind =
  | 'missingKnowledge' // 缺知识（答案需要外部/新鲜事实）-> RAG
  | 'ambiguous' // 指令歧义（用户意图不清）-> PROMPT 修正
  | 'formatDrift' // 格式/风格/品牌语气漂移 -> 微调 LoRA
  | 'reasoning' // 硬推理错误（高阶判断）-> 保持前沿
  | 'expensiveSlow'; // 输出正确但太贵/太慢 -> 蒸馏 或 路由

/** 训练前可选的五类杠杆 + 「保持前沿」 */
export type Lever = 'PROMPT' | 'RAG' | 'ROUTING' | 'FINETUNE' | 'DISTILL' | 'KEEP_FRONTIER';

/** 单片任务的裁决结论 */
export type Verdict = 'GO' | 'NEED_DATA' | 'NOT_WORTH' | 'NO_TRAIN';

/** 组合模拟的三种基准 */
export type PortfolioMode = 'frontier' | 'recommended' | 'trainAll';

export interface Hygiene {
  dupRate: number; // 0..1 重复样本比例
  piiRate: number; // 0..1 含 PII 需剔除比例
  leakRate: number; // 0..1 疑似泄漏（含评测集/未来信息）比例
}

export interface TraceSlice {
  id: string;
  name: string;
  desc: string;
  monthlyCalls: number;
  avgInTok: number;
  avgOutTok: number;
  frontierCostPer1M: number; // 前沿模型混合单价（$ / 1M tokens）
  frontierLatencyMs: number;
  correctionRate: number; // 0..1 返工 / 重跑率
  stability: number; // 0..1 模板化 / 可复现程度
  goldExamples: number; // 可用于训练的已接受样本数
  hygiene: Hygiene;
  failureMix: Record<FailureKind, number>; // 各失败信号占比，和 ≈ 1
}

export interface DatasetPreflight {
  gold: number;
  usable: number; // 去重 / 去 PII / 去泄漏后可用样本
  required: number; // 该杠杆所需最少样本
  enough: boolean;
  gap: number; // 还差多少条
  removedDup: number;
  removedPii: number;
  removedLeak: number;
}

export interface ROI {
  frontierMonthlyUSD: number; // 全前沿（含返工浪费）月成本
  newMonthlyUSD: number; // 采用杠杆后的月成本
  monthlySavingsUSD: number;
  savingsPct: number; // 0..1
  frontierLatencyMs: number;
  newLatencyMs: number;
  latencyDropPct: number; // 0..1
  qualityRetention: number; // 0..1
  trainingCostUSD: number; // 一次性
  breakEvenDays: number; // Infinity 用 -1 表示
}

export interface TrainabilityBreakdown {
  volume: number; // 0..1
  saving: number; // 0..1
  stability: number; // 0..1
  data: number; // 0..1
  score: number; // 0..100
}

export interface SliceAnalysis {
  slice: TraceSlice;
  dominant: FailureKind;
  lever: Lever;
  reason: string;
  isTraining: boolean;
  dataset: DatasetPreflight;
  trainability: TrainabilityBreakdown;
  roi: ROI | null; // 仅训练类杠杆有
  verdict: Verdict;
  verdictNote: string;
}

export interface PortfolioSliceResult {
  id: string;
  name: string;
  monthlyUSD: number;
  latencyMs: number;
  correctionRate: number;
}

export interface PortfolioResult {
  mode: PortfolioMode;
  perSlice: PortfolioSliceResult[];
  totalMonthlyUSD: number;
  weightedLatencyMs: number;
  overallCorrectionRate: number;
  oneTimeTrainingUSD: number; // 该模式下累计一次性训练花费
}
