// 随读 Suídú — 数据模型。全部为 mock 的一段自治 agent 运行轨迹，供确定性叙事引擎消费。

export type Phase = '确认目标' | '首次尝试' | '遇阻转向' | '收敛' | '自我修订' | '收尾';

export type ToolCall = {
  tool: string; // read_file / grep / edit / run_tests / write ...
  arg: string;  // 简短的人类可读参数
};

export type DiffLine = {
  kind: 'hunk' | 'add' | 'del' | 'ctx';
  text: string;
};

// 「它替我做的假设」——你可能不同意的判断。divergence = 你可能不同意的程度。
export type Assumption = {
  id: string;
  text: string;       // 它假设了什么
  divergence: 0 | 1 | 2 | 3;
  rationale: string;  // 它为什么这么假设
  evidenceStep: number; // 触发它的原始日志步号（rawLog 中的 step）
  chapterId: string;
};

// 「悬而未决」——未完成 / 待你确认。
export type LooseEnd = {
  id: string;
  text: string;
  severity: 1 | 2 | 3;
  chapterId: string;
};

// 「它给自己改了什么」——Continual Harness 式自我修订（skill/memory/subagent 的 add/update）。
export type SelfEdit = {
  id: string;
  kind: 'skill' | 'memory' | 'subagent';
  op: 'add' | 'update';
  name: string;
  before?: string;   // update 时的原值
  after: string;     // 新值
  evidence: string;  // 触发这次自我修订的轨迹时刻
  futureImpact: string; // 这会如何改变它下次的行为
  chapterId: string;
};

export type Chapter = {
  id: string;
  phase: Phase;
  title: string;
  oneLiner: string; // 一句话：发生了什么 & 为什么
  why: string;      // 展开：更细的缘由
  tools: ToolCall[];
  touchedFiles: string[];
  durationMin: number;
  diff: DiffLine[]; // mock diff（可为空数组，如只读章节）
  relatedAssumptionIds: string[];
  relatedLooseEndIds: string[];
  relatedSelfEditIds: string[];
};

export type RawLogLine = {
  step: number;
  t: string;    // 时间戳（mock）
  tool: string; // 工具名
  text: string; // 原始一行
};

export type AgentRun = {
  goal: string;   // 一句话目标
  task: string;   // 完整委派任务
  agent: string;  // agent 名/型号（mock）
  startedAt: string;
  chapters: Chapter[];
  assumptions: Assumption[];
  looseEnds: LooseEnd[];
  selfEdits: SelfEdit[];
  rawLog: RawLogLine[];
};

// 「只盯这些」统一条目（叙事之上的注意力清单）。
export type AttentionKind = 'assumption' | 'looseEnd' | 'selfEdit';

export type AttentionItem = {
  key: string;
  kind: AttentionKind;
  title: string;
  detail: string;
  weight: number;     // 需要你拿主意的权重（仅用于排序，不是"对错分"）
  chapterId: string;
  refId: string;      // 指向 assumption/looseEnd/selfEdit 的 id
};
