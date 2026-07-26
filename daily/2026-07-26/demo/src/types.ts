// 岔口 Forkpoint — 类型定义
// 全部为演示用 mock 模型：一次 agent 会话 = 有序的步骤序列，每步读/写状态并可被目标不变量校验。

export type Health = 'ok' | 'anomaly' | 'pivotal' | 'tainted';

export type MetricColumn = 'retained' | 'retained_d7';
export type DropRule = 'strict' | 'lenient';
export type Recommend = 'rollout' | 'hold';

/** 会话中可被纠偏的决策集合（Demo 里只有两个：选哪列指标、脏数据规则）。 */
export interface Decisions {
  metricColumn: MetricColumn;
  dropRule: DropRule;
}

export interface MetricStat {
  control: number; // 0..1
  redesign: number; // 0..1
  p: number;
}

/** 单条目标不变量的校验结果。 */
export interface InvariantResult {
  id: string;
  label: string;
  expected: string;
  actual: string;
  violated: boolean;
  /** 该违反是否传导到最终结论（＝单独修正它是否会让结论变正确）。 */
  outcomeRelevant: boolean;
}

/** 引擎按当前 decisions 复算出的单步结果。 */
export interface StepResult {
  seq: number;
  action: string;
  summary: string;
  reads: string[];
  writes: Record<string, string>;
  invariant: InvariantResult;
  health: Health;
  hasFix: boolean;
}

export interface Conclusion {
  metricColumn: MetricColumn;
  controlRate: number;
  redesignRate: number;
  lift: number; // redesign - control
  p: number;
  significant: boolean;
  recommend: Recommend;
  text: string;
  /** 是否等于「用目标指标算出的正确结论」。 */
  correct: boolean;
}

export interface RunResult {
  decisions: Decisions;
  steps: StepResult[];
  conclusion: Conclusion;
  /** 折返步序号：最早「被违反且传导到结论」的步；无则为 null。 */
  pivotalSeq: number | null;
}

export interface ForkOption {
  seq: number;
  decisionKey: keyof Decisions;
  label: string; // 纠偏动作描述
  fromLabel: string; // 当前（错误）值
  toLabel: string; // 纠偏后值
}

export interface ForkResult {
  seq: number;
  before: RunResult;
  after: RunResult;
  flipped: boolean; // 结论建议是否改变
  hitPivotal: boolean; // 是否命中折返步
  correctedNow: boolean; // 纠偏后结论是否变正确
}

export interface CompareRow {
  label: string;
  before: string;
  after: string;
  changed: boolean;
}

export interface ValueMetrics {
  foldSeq: number | null;
  totalSteps: number;
  taintedCount: number;
  stepsSaved: number;
  avoidedBadRollout: number;
}
