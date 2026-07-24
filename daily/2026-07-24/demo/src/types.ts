// 榫卯 Tenon — 类型定义
// 多 agent 共享盘上「生产者→消费者工件契约」与「漂移」的数据模型。

export type AgentId = 'researcher' | 'analyst' | 'reporter';

export type FieldType = 'string' | 'number' | 'string[]' | 'enum';

/** 单个字段的契约条款 */
export interface FieldContract {
  name: string;
  type: FieldType;
  unit?: string; // 例如 '0–100' / '0–1' / '计数'
  range?: string; // 例如 '[0,100]'
  values?: string[]; // enum 取值域
  optional?: boolean;
  consumedBy?: AgentId[]; // 谁依赖这个字段（用于影响分析）
}

/** 一个被共享工件的接口契约 */
export interface ArtifactContract {
  file: string; // 'findings.json'
  producer: AgentId;
  consumers: AgentId[];
  fields: FieldContract[];
  version: number;
}

export type DriftKind = 'rename' | 'unit' | 'drop' | 'enum' | 'add';

/** 生产者对某工件发起的一次改动（可能破坏契约，也可能是安全演进） */
export interface Drift {
  id: string;
  label: string; // 人话标题
  kind: DriftKind;
  onArtifact: string; // 'findings.json'
  detail: string; // 具体改了什么
  breaking: boolean; // 是否破坏契约
  clause: string; // 违反/触及了契约的哪一条
  severity: number; // 1..3；非破坏为 0
  downstreamEffect: string; // 若不拦截，下游会怎样错
  migration: string; // 最小迁移补丁
  corrupts: string[]; // 若不拦截，会被污染的下游工件
}

/** 分析师（消费者）读入并计算后的输出 */
export interface AnalystOutput {
  scoreSeen: number | null; // 分析师「看到」的 score（null=字段缺失）
  scoreRawLabel: string; // 展示用：87 / 0.87 / 缺失
  sampleSeen: number | null;
  reliableSample: boolean;
  confidenceIndex: number;
  moodSeen: string;
}

/** 报告员（终端消费者）输出 */
export interface ReporterOutput {
  recommendation: string;
  line: string;
}

/** 一个「世界」（榫卯 关 / 开）的结局 */
export interface WorldResult {
  guard: boolean;
  analyst: AnalystOutput;
  reporter: ReporterOutput;
  correct: boolean; // 报告是否与「真实意图」一致
}

/** 引擎对一次改动组合的裁决 */
export interface Verdict {
  selected: string[];
  breakingSelected: Drift[];
  safeSelected: Drift[];
  off: WorldResult;
  on: WorldResult;
  metrics: {
    silentCorruptionsOff: number; // 静默腐坏的下游工件数
    silentCorruptionsOn: number;
    detectionLatencyOff: number; // 检测延迟（步）
    detectionLatencyOn: number;
    protectedDownstreamOff: number; // 被保护的下游工件数
    protectedDownstreamOn: number;
    debugStepsOff: number; // 排障回溯步数
    debugStepsOn: number;
    blastAgentsOff: number; // 被污染的下游 agent 数
    migrationsOffered: number; // 榫卯给出的最小迁移数
  };
}
