export type MetricType = 'objective' | 'subjective';
export type Direction = 'lower-better' | 'higher-better';
export type DesignType = 'AB' | 'ABAB';

// off = 不做干预（基线/回撤段）；on = 做干预段
export type Phase = 'off' | 'on';

export interface DailyPoint {
  /** 全实验从第 1 天起的连续序号 */
  day: number;
  value: number;
  phase: Phase;
  /** ABAB 设计的分段标签：A1 / B1 / A2 / B2 */
  block?: 'A1' | 'B1' | 'A2' | 'B2';
}

export interface Experiment {
  id: string;
  /** 来自健康助手的原始主动建议（à la Illume） */
  suggestion: string;
  source: string;
  /** 一句话：你具体改变什么 */
  intervention: string;
  metricName: string;
  metricUnit: string;
  metricType: MetricType;
  direction: Direction;
  design: DesignType;
  /** 用户认为有意义的最小效应（成败线的一部分） */
  minDetectable: number;
  confounders: string[];
  hold: string[];
  series: DailyPoint[];
}

export type Verdict = 'effective' | 'insufficient' | 'placebo';

export interface ReadoutResult {
  baselineMean: number;
  baselineSD: number;
  interventionMean: number;
  /** 朝“改善”方向为正的效应（bpm/min/分等原单位） */
  improvement: number;
  /** |均值差| / 基线波动 */
  effectRatio: number;
  /** ABAB 两轮干预是否都相对相邻回撤段改善（AB 设计为 null） */
  reversalConsistent: boolean | null;
  regressionToMean: boolean;
  noveltyDecay: boolean;
  verdict: Verdict;
  /** 0–100：这条干预对“你一个人”真有效的证据强度 */
  evidenceStrength: number;
  reasons: string[];
  /** 朴素解读（只看均值方向的乐观结论） */
  naiveReading: string;
  /** 验己的诚实读数 */
  honestReading: string;
  recommendation: string;
}
