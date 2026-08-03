// 分寸 Poise — 领域类型定义（全部为纯前端 mock，无外部依赖）。

// 话题：个人 AI 代表以你名义会遇到的事务类别。
export type Topic =
  | 'schedule' // 排期改约
  | 'followup' // 客户跟进
  | 'billing' // 订阅账单/自动续费
  | 'negotiate' // 报价谈判
  | 'access' // 维修准入（放人进你家）
  | 'lend' // 人情借钱
  | 'family' // 家人事务
  | 'sales'; // 陌生销售

// 风险档：这件事一旦处理错，代价有多大。
export type Stakes = 'low' | 'mid' | 'high';

// 授权档（从最放手到最收紧）：用户愿意给代表多大自主权。
export type Autonomy = 'handle' | 'draft' | 'ask' | 'never';

// 回放结果（与授权档一一对应，用词更贴近"它到底怎么处理了"）。
export type Outcome = 'handled' | 'draft' | 'ask' | 'blocked';

// 一张彩排情境卡：代表打算怎么做 + 一句拟好的口吻样例。
export interface Situation {
  id: string;
  topic: Topic;
  stakes: Stakes;
  title: string;
  context: string; // 谁 / 什么事
  proposedAction: string; // 代表打算怎么做
  voiceSample: string; // 它拟好的、要以你名义发出的一句话
  toneFixHint: string; // 若你判"不像我"，给出的口吻调整建议
}

// 一条一周 mock 互动（用于回放）。
export interface Interaction {
  id: string;
  topic: Topic;
  stakes: Stakes;
  day: string; // 周一 …
  time: string;
  summary: string;
}

// 单个话题的授权规则：在 atStakes 这个风险档上给到 level，其余风险档按单调规则推导。
export interface TopicRule {
  level: Autonomy;
  atStakes: Stakes;
  redline: boolean; // 是否为红线（该话题在所有风险档一律"绝不可碰"）
}

// 分寸画像：每个话题一条规则。
export interface Profile {
  topics: Record<Topic, TopicRule>;
}

// 用户在某张彩排卡上的一次拍板（含口吻判定）。
export interface Decision {
  level: Autonomy;
  soundsLikeMe: boolean | null; // null = 未判定
}

// 单条互动的分类结果。
export interface Classified {
  interaction: Interaction;
  autonomy: Autonomy;
  outcome: Outcome;
  risk: number; // 出格贴近度 = 授权数值 × 风险权重
  flagged: boolean; // 是否"差一点出格"
}

// 一周回放的汇总。
export interface WeekSummary {
  items: Classified[];
  counts: Record<Outcome, number>;
  flags: Classified[];
  total: number;
}
