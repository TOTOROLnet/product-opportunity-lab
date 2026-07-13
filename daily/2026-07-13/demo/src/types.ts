// Mneme (记衡) — 类型定义
// 核心对象：一份"自持"的跨工具记忆，以及一个正在接入并 recall 的工具。
// 治理发生在 recall -> 注入进工具上下文 之间。

// 记忆的作用域（least-privilege 的基本单位）
export type Scope =
  | 'travel' // 出行
  | 'personal' // 个人基础信息
  | 'work' // 工作/项目
  | 'health' // 健康
  | 'finance' // 财务
  | 'secret'; // 密钥/凭据（最敏感）

// 记忆的来源方式：用户亲口陈述 vs 某个 agent 推断写入
export type Origin = 'user-stated' | 'agent-inferred';

// 记忆的原始状态（存储层给出的元数据，尚未经治理裁决）
export type MemoryStatus = 'fresh' | 'stale' | 'unconfirmed';

export interface MemorySource {
  tool: string; // 写入这条记忆的工具（如 Cursor / ChatGPT / 健康 App）
  writtenAt: string; // 写入时间（展示用）
  agent?: string; // 若由某 agent 自动写入，标注 agent 名
}

export interface MemoryItem {
  id: string;
  subject: string; // 主题标签，用于矛盾归组（如 "座位偏好"）
  content: string; // 记忆内容
  scope: Scope;
  origin: Origin;
  status: MemoryStatus;
  source: MemorySource;
  contradictsId?: string; // 与哪条记忆相互矛盾（成对出现）
  note?: string; // 附加说明（如"已搬家"）
}

// 一个正在接入并 recall 的工具
export interface ConnectingTool {
  id: string;
  name: string;
  purpose: string;
  allowedScopes: Scope[]; // 该工具被授权可读的作用域（最小权限）
  isControl?: boolean; // CONTROL 场景：预期治理层"全部放行·无需干预"
}

export interface Scenario {
  id: string;
  tool: ConnectingTool;
  // recall 语义检索命中的候选记忆集合（治理前）
  recalled: MemoryItem[];
  narrative: string; // 场景一句话叙事
}

// ————— 治理结果（logic 产出）—————

// 每条记忆经治理后的裁决
export type Verdict =
  | 'inject' // 放行注入
  | 'blocked-scope' // 越界，拦截（泄漏防护）
  | 'held-poison' // 疑似投毒/未确认，扣留待确认
  | 'held-stale' // 过期，扣留/降权待处理
  | 'held-conflict'; // 存在未裁决的矛盾，扣留

export interface GovernedItem {
  memory: MemoryItem;
  verdict: Verdict;
  reason: string; // 人话解释
  // 交互裁决可改变的用户决定（覆盖默认治理）：
  resolved?: boolean; // 矛盾已裁决 / 未确认已确认 / 过期已处理
}

export interface RecallSummary {
  injected: number; // 实际放行注入
  blocked: number; // 因越界拦截
  held: number; // 因投毒/过期/矛盾扣留（未裁决）
  total: number; // recall 命中总数
  leakPrevented: number; // 拦截的越界敏感项数
  bannerTone: 'safe' | 'review' | 'risk';
  bannerText: string;
}
