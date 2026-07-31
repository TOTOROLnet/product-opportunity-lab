// 忆证 Yìzhèng — 类型定义。全部为纯前端 mock 模型，不接任何真实后端 / 记忆库。

export type SourceType = 'chat' | 'tool' | 'doc';

// 易变（volatile）：偏好、情绪、临时状态，衰减快。
// 耐久（durable）：ID、政策、合同事实，几乎不衰减。
export type Category = 'volatile' | 'durable';

export interface MemorySource {
  type: SourceType;
  label: string; // 例如 "客服对话 #4821" / "维修工单 T-0912" / "政策文档 v2026.07"
  excerpt: string; // mock 片段
  at: string; // ISO 日期
  authority: number; // 0..1 来源权威度：随口 chat 低，政策 doc 高
}

export interface Memory {
  id: string;
  statement: string;
  category: Category;
  sources: MemorySource[];
  confirmations: number; // 被独立确认的次数
  lastConfirmedAt: string; // ISO
  conflictsWith: string[]; // 与之矛盾的记忆 id（数据里成对出现）
  pinned: boolean; // 用户 pin：耐久化、停止衰减
  retired: boolean; // 已退役：不再参与召回与 gate
  actionRelevant?: boolean; // 是否是本次动作直接依据/相关
}

export interface TrustBreakdown {
  freshness: number; // 0..1
  confirmation: number; // 0..1
  authority: number; // 0..1
  conflictPenalty: number; // 0..1（越大越糟）
  ageDays: number;
  score: number; // 0..1 最终 trust
  activeConflictIds: string[]; // 当前仍生效（双方都未退役）的矛盾对手
  losesConflict: boolean; // 在矛盾中处于劣势（被更新/更权威的记忆推翻）
}

export type GateVerdict = 'PROCEED' | 'HOLD' | 'BLOCK';

export interface Scenario {
  id: string;
  actionTitle: string; // agent 准备执行的动作
  actionDetail: string;
  amount: number;
  reliesOn: string; // 动作主要依据的记忆 id
  recalledIds: string[]; // 朴素检索召回的记忆 id
  policyThreshold: number; // 触发人工审批的金额阈值（来自政策记忆）
}
