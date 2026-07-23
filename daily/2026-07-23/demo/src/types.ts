// 上手 Knack — 类型定义
// 一切诊断都由确定性引擎在 mock 语料上计算，不接任何真实后端 / LLM / 外部 API。

/** 用法「失手签名」的 id —— 用户反复犯的 AI 使用错误类型 */
export type SignatureId =
  | 'vagueGoal' // 目标含糊
  | 'noExample' // 没给范例
  | 'contextDump' // 一股脑倒 context
  | 'noConstraints' // 不给约束
  | 'oneShotAccept' // 首稿即收
  | 'factsNoGrounding' // 要事实不给依据
  | 'movingTarget'; // 中途改需求

/** 一次 AI 协作的结果 */
export type Outcome =
  | 'satisfied' // 满意（最终采用，基本没大改）
  | 'settled' // 将就（不满意但凑合用了）
  | 'gaveup'; // 放弃（结果太差，改为手动/放弃）

/** 一条真实感的「你和 AI 的一次协作」记录（mock） */
export interface Attempt {
  id: string;
  date: string;
  task: string; // 任务标题
  domain: string; // 领域：写作 / 分析 / 规划 / 翻译 / 编码…
  prompt: string; // 当时你发出的 prompt（节选）
  rounds: number; // 来回轮数（1 = 一次过）
  outcome: Outcome;
  signatures: SignatureId[]; // 这次命中的失手签名（可多个）
  primary: SignatureId; // 主导失手（用于归因与复盘）
  // —— 复盘素材（仅针对 primary 招式）——
  fixedPrompt: string; // 应用招式后的 prompt
  beforeResult: string; // 当时的结果（人话概述）
  afterResult: string; // 改后的结果（人话概述）
}

/** 失手签名的知识条目：人话解释 + 可复用招式 */
export interface Signature {
  id: SignatureId;
  name: string;
  emoji: string;
  plain: string; // 人话解释：为什么会失手
  move: string; // 可复用招式（一句话）
  template: string; // 可复制的模板 / 清单
  severity: number; // 严重度权重 1..3
}

/** 单条签名的诊断结果（聚合到该签名下的所有 attempts） */
export interface SignatureDiagnosis {
  signature: Signature;
  frequency: number; // 作为 primary 出现的次数
  totalExtraRounds: number; // 归因于它的额外返工轮次总和
  avgExtraRounds: number; // 平均每次多花的轮次
  impact: number; // 影响力 = 严重度 × Σ(1-质量分)
  exampleIds: string[]; // 命中的会话 id（示例）
}

/** 一次全量诊断（可传入已掌握的招式集合，得到「掌握后」的指标） */
export interface DiagnosisResult {
  proficiency: number; // 上手指数 0..100
  firstPassRate: number; // 一次过率 0..1
  avgRounds: number; // 平均返工轮数
  gaveupRate: number; // 放弃率 0..1
  settledRate: number; // 将就率 0..1
  perSignature: SignatureDiagnosis[]; // 按 impact 降序
  total: number; // 语料条数
}
