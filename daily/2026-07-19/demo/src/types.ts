// 并笔 CoBaton — 类型定义
// 全部为 mock 模拟；这里定义"人机共写会话"的文档、事件、所有权与指标。

export type SectionId = string;

/** 文档的一个小节（标题 + 正文）。 */
export interface Section {
  id: SectionId;
  title: string;
  /** 简短代号（<=5 字，用于地图/标签，避免拥挤）。 */
  short: string;
  body: string;
  /** 被人删除后置 true（保留占位以展示"被删"）。 */
  deleted?: boolean;
}

export type Doc = Section[];

/** 两种协调模式：朴素（last-write-wins，无协调）与并笔（CoBaton）。 */
export type Mode = 'naive' | 'cobaton';

/** 某小节当前的"执笔权"归属。 */
export type Owner = 'free' | 'human' | 'agent';

export type EventType =
  | 'agent_task' // agent 领取任务
  | 'human_focus' // 人聚焦某小节（光标在此）
  | 'human_edit' // 人在某小节补充/修改文本
  | 'human_blur' // 人离开某小节
  | 'agent_claim' // agent 声明想改某小节（意图）
  | 'agent_edit' // agent 实际落改某小节
  | 'human_delete'; // 人删除某小节

/** 脚本化时间轴上的一个事件。 */
export interface TimelineEvent {
  t: number; // 步序号（从 0 起）
  type: EventType;
  section?: SectionId;
  /** human_edit：人补充的那句话。 */
  humanText?: string;
  /** agent_claim / agent_edit：agent 打算把该小节改写成的正文（v2）。 */
  agentBody?: string;
  /** agent_task 的任务描述；或事件的人读标签。 */
  desc?: string;
}

/** 累计指标（越低越好，除保留率）。 */
export interface Metrics {
  lostHumanEdits: number; // 被静默覆盖丢失的"你的编辑"数
  interruptions: number; // 你被打断的次数（活跃区被 agent 强行覆盖）
  wastedAgentEdits: number; // agent 白做的编辑数（改完随即被删/作废）
  humanEditsTotal: number; // 有争用的"你的编辑"总数
  humanEditsPreserved: number; // 其中最终被保留的数
}

/** UI 着色/解说用的高亮标记。 */
export interface Highlight {
  humanActive?: SectionId | null;
  agentEdited?: SectionId | null;
  lostAt?: SectionId | null;
  interruptedAt?: SectionId | null;
  deferredAt?: SectionId | null;
  revalidatedAt?: SectionId | null;
  wastedAt?: SectionId | null;
  parallelAt?: SectionId | null;
  deletedAt?: SectionId | null;
}

/** 单步回放快照。 */
export interface TraceStep {
  event: TimelineEvent;
  doc: Doc; // 处理完该事件后的文档快照
  ownership: Record<SectionId, Owner>;
  pending: SectionId[]; // 存在延后 agent 意图的小节（仅 CoBaton）
  note: string; // "刚发生了什么"（分模式）
  highlight: Highlight;
  metrics: Metrics; // 处理完该事件后的累计指标
}

export interface RunResult {
  mode: Mode;
  steps: TraceStep[];
  final: Metrics;
  finalDoc: Doc;
  consistent: boolean; // 最终文档是否同时保留"你的改动"+"agent 的 v2 更新"
}
