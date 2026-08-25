// 现成 Xiànchéng — 类型定义
// 说明：本 Demo 全部为 mock 数据 + 确定性逻辑，不接任何真实后端 / LLM / 运行时。

export type FingerprintKey = '框架' | '平台' | '语言' | '目标' | '工具';

export interface Fingerprint {
  key: FingerprintKey;
  value: string;
}

// action = 蒸馏后保留进配方的有效步骤；detour = 当时走过的弯路；retry = 失败后重试。
export type StepKind = 'action' | 'detour' | 'retry';

export interface RunStep {
  text: string;
  kind: StepKind;
  note?: string; // 弯路/重试的原因（为什么它被剪掉）
}

export interface RecipeStep {
  text: string;
  verifiedBy?: string; // 该步的验证信号
  adapt?: string; // 若你的环境与本次运行不同，这一步需要怎么改（适配警告）
}

export interface FleetRun {
  id: string;
  agent: string; // 产生这条运行的 agent
  when: string; // 相对时间，如 '3 天前'
  intent: string; // 任务意图
  keywords: string[]; // 用于意图匹配（模拟 embedding 语义检索）
  fingerprint: Fingerprint[]; // 环境指纹
  verified: boolean;
  verifiedBy: string; // 如 'build + smoke 通过'
  outcome: string; // 一句话结果
  recurPerAgentMonth: number; // mock：这类任务在舰队里每台 agent 每月大约复发几次
  rawSteps: RunStep[]; // 完整的、含弯路/重试的原始运行痕迹
  recipe: RecipeStep[]; // 蒸馏后的最短已验证路径
}

export interface IntentCard {
  id: string;
  title: string;
  intent: string;
  keywords: string[];
  fingerprint: Fingerprint[];
}

export interface MatchReason {
  kind: 'intent' | 'env';
  label: string;
}

export interface Adaptation {
  key: FingerprintKey;
  yours: string;
  recipeUses: string;
}

export interface Match {
  run: FleetRun;
  score: number; // 0-100（意图重合 + 环境指纹重合的确定性加权）
  intentScore: number; // 0-1
  envScore: number; // 0-1
  reasons: MatchReason[];
  adaptations: Adaptation[];
}
