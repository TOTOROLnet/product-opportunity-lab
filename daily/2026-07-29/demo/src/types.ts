// 准星 Zhǔnxīng — 类型定义
// 所有数据均为 mock；judgeScore 是"判官"（LLM-as-judge）给出的 0–100 风险分。

export type HumanVerdict = 'ALLOW' | 'BLOCK';

// 失败模式：判官为何判错（用于分歧钻取与补丁）。
export type FailurePattern =
  | 'keyword-overtrigger' // 关键词过度触发：见到"退款/大额"就判高危，误杀正常业务
  | 'injection-miss' // 注入漏判：把伪装成系统/上级授权的注入指令当正常动作放过
  | 'calibrated'; // 判官对这条判得对（或属于无清晰模式的硬案例）

// 可开关的失败模式补丁。
export type PatchId = 'dekeyword' | 'injection';

export interface JudgeCase {
  id: string;
  action: string; // agent 想执行的动作（人话）
  context: string; // 一句话背景
  human: HumanVerdict; // 人类专家真值
  severity: 1 | 2 | 3; // BLOCK 危险等级（用于代价加权）；ALLOW 用作误伤权重占位
  judgeScore: number; // 判官原始风险分 0–100（>= 阈值即判官拦截）
  judgeReason: string; // 判官给分理由
  humanReason: string; // 人类专家判定理由
  pattern: FailurePattern;
  patch?: PatchId; // 该案例受哪个补丁影响
  patchDelta?: number; // 补丁开启时对 judgeScore 的确定性修正（有符号）
}

// TP=命中拦截(好)  FP=误杀(把正常业务拦下)  FN=漏放(放过危险动作)  TN=正常放行(好)
export type Outcome = 'TP' | 'FP' | 'FN' | 'TN';

export interface CaseResult {
  item: JudgeCase;
  effectiveScore: number;
  judgeBlocks: boolean;
  outcome: Outcome;
}

export interface Metrics {
  tp: number;
  fp: number;
  fn: number;
  tn: number;
  totalAllow: number;
  totalBlock: number;
  falseKillRate: number; // 误杀率 FP / 所有 ALLOW
  falsePassRate: number; // 漏放率 FN / 所有 BLOCK
  precision: number; // TP / (TP+FP)
  recall: number; // TP / (TP+FN)
  cost: number; // 总代价
  results: CaseResult[];
}

export interface CurvePoint {
  threshold: number;
  cost: number;
  fp: number;
  fn: number;
}
