// 留痕 Liúhén — 数据模型（全部为 mock，用于演示压缩审计机制）

export type ItemType =
  | 'user_constraint' // 用户硬约束（最贵，丢了会违约）
  | 'decision' // 已定方案 / 决策
  | 'file_ref' // 文件引用 / 工作面
  | 'error_learned' // 踩坑经验 / 已学到的教训
  | 'todo' // 待办
  | 'chatter'; // 闲聊 / 过程噪声（丢了通常安全）

// 一条上下文条目在某次压缩里的三种归宿
export type FoldState = 'kept' | 'lossy' | 'dropped';

// 丢弃某条目会引发的事故严重度
export type Severity = 'fatal' | 'rework';

export interface ContextItem {
  id: string;
  type: ItemType;
  label: string; // 短标题
  content: string; // 条目在窗口里的原文（mock）
  tokens: number; // 该条目占用的估算 token
  riskWeight: number; // 0..100，静默丢弃它的代价权重
  pinnable: boolean; // 是否允许钉入保命清单
  // 若被「完全丢弃」，会在这一步引发事故（undefined = 丢了也安全）
  causesDriftAtStep?: number;
  severity?: Severity;
  driftNote?: string; // 事故说明
  wastedTokens?: number; // 事故造成的返工 token（mock）
}

export interface StepEvent {
  step: number;
  kind: 'goal' | 'tool' | 'note' | 'compaction';
  title: string;
  detail?: string;
  compactionId?: string; // kind==='compaction' 时关联的压缩事件
}

export interface CompactionEvent {
  id: string;
  atStep: number;
  title: string;
  reason: string; // 触发压缩的原因（mock）
  windowItemIds: string[]; // 压缩前窗口里出现的条目
  defaultFold: Record<string, FoldState>; // 厂商默认压缩策略对每个条目的处置
}

export interface Trajectory {
  id: string;
  title: string;
  goal: string;
  goalDetail: string;
  totalSteps: number;
  items: ContextItem[];
  steps: StepEvent[];
  compactions: CompactionEvent[];
}

// —— 引擎输出 ——

export interface FoldRow {
  item: ContextItem;
  defaultState: FoldState; // 厂商默认会怎么处置
  effectiveState: FoldState; // 叠加保命清单后的实际处置
  pinned: boolean;
  protected: boolean; // 实际是否被保住（kept/lossy 视为保住，dropped 视为丢弃）
  triggersIncident: boolean; // 在本次配置下，这条是否会引爆事故
}

export interface CompactionResult {
  event: CompactionEvent;
  rows: FoldRow[];
  tokensSaved: number; // 本次压缩省下的 token
  riskScore: number; // 本次压缩的风险分（越高越危险）
}

export interface Incident {
  atStep: number;
  itemId: string;
  itemLabel: string;
  severity: Severity;
  note: string;
  wastedTokens: number;
}

export interface RunStep {
  step: number;
  kind: 'goal' | 'tool' | 'note' | 'compaction' | 'incident' | 'result';
  title: string;
  detail?: string;
  tone: 'normal' | 'info' | 'warn' | 'danger' | 'good';
}

export interface RunResult {
  pinned: string[];
  compactions: CompactionResult[];
  incidents: Incident[];
  timeline: RunStep[];
  tokensSaved: number; // 压缩净省的 token
  tokensWasted: number; // 事故返工吃掉的 token
  netTokens: number; // 净收益（正=真省，负=倒亏）
  totalRisk: number;
  fatalCount: number;
  reworkCount: number;
  outcome: 'PASS' | 'FAIL';
}
