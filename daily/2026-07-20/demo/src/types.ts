// 知时 Aptly — 类型定义
// 环境记忆的"主动召回决策层"：在同一条脚本化工作流上，对比「朴素推送」与「知时」两种策略。

export type Importance = 'high' | 'med' | 'low';
export type MemoryKind = 'fact' | 'change' | 'promise';

// 一条"环境记忆"：你今早在某个 App 里看过、但很快会忘的文本片段。
export interface MemoryItem {
  id: string;
  time: string; // 观察时刻，如 "08:20"
  minute: number; // 距零点分钟数，用于时效/预算窗口计算
  app: string; // 来源 App / 场景
  text: string; // 被抽取的文本（纯文本，不含视频）
  topics: string[]; // 主题标签
  importance: Importance;
  kind: MemoryKind;
  supersededBy?: string; // 若被更新版本取代，则记录新版本 id（该条已过时）
}

// 一个"当前正在做的事"（now）。
export interface ActivityItem {
  id: string;
  time: string;
  minute: number;
  label: string; // 你此刻在做什么
  topics: string[];
}

export type Mode = 'naive' | 'aptly';

export type Decision =
  | 'SHOW' // 主动推送到你眼前
  | 'DEDUP' // 已提示过，不重复
  | 'SUPPRESS_STALE' // 被更新版本取代，抑制过时信息
  | 'BUDGET' // 本时段打扰预算已满，延后
  | 'HOLD'; // 相关度/重要度不足，保持安静

export interface CandidateEval {
  memoryId: string;
  relevance: number; // 0..1（按当前模式计算）
  score: number; // 综合决策分（知时：相关度×重要度；朴素：仅相关度）
  decision: Decision;
  reason: string;
}

export interface ActivityDecision {
  activityId: string;
  candidates: CandidateEval[];
  surfaced: string[]; // 本 tick 实际推送的 memory id
}

export interface PushEvent {
  activityId: string;
  memoryId: string;
  useful: boolean; // 高价值命中（重要 + 当前可行动 + 首次 + 未过时）
  stale: boolean; // 过时/有害推送
  duplicate: boolean; // 重复打扰
}

export interface Metrics {
  interruptions: number; // 总打扰次数
  useful: number; // 有用命中
  precision: number; // 精确率 0..1
  criticalCovered: number; // 关键时刻覆盖数
  criticalTotal: number; // 关键时刻总数
  harmful: number; // 过时/有害推送
  correctSilence: number; // 该安静时正确保持安静的时刻数
  silenceTotal: number; // 理应安静的时刻总数
}

export interface RunResult {
  mode: Mode;
  perActivity: ActivityDecision[];
  pushes: PushEvent[];
  metrics: Metrics;
}

// 一个关键时刻（ground truth）：某条重要记忆在某个活动处变得"当下可行动"。
export interface CriticalPair {
  memoryId: string;
  activityId: string;
}
