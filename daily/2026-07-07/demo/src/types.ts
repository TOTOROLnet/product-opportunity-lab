export type Role = 'planner' | 'coder' | 'reviewer' | 'observer' | 'tool';

export interface Participant {
  id: string;
  name: string;
  role: Role;
  hue: number;
}

export type EventType =
  | 'message'
  | 'function_call'
  | 'error'
  | 'state'
  | 'handoff'
  | 'assign';

export interface RunEvent {
  id: string;
  t: number; // 距 run 开始的毫秒数
  type: EventType;
  from: string; // participant id
  to?: string; // participant id（handoff / assign 的接收方）
  resource?: string; // 例如 file:checkout.tsx 或 tool:pay_api
  task?: string; // 任务 id
  write?: boolean; // function_call 是否为写操作
  progress?: boolean; // state 事件是否代表目标前进
  tokens: number;
  summary: string;
}

export interface Scenario {
  id: string;
  name: string;
  blurb: string;
  participants: Participant[];
  events: RunEvent[];
  expectedNote: string;
}

export type DetectionKind =
  | 'retry-storm'
  | 'livelock'
  | 'orphaned-task'
  | 'write-collision'
  | 'progress-stall';

export type Severity = 'critical' | 'warning';

export interface Detection {
  kind: DetectionKind;
  title: string;
  severity: Severity;
  agents: string[]; // 涉及的 participant id
  eventIds: string[]; // 因果事件链
  wastedTokens: number;
  wastedMs: number;
  cause: string; // 一句话病因
  fix: string; // 修复处方
}

export type Verdict = 'HEALTHY' | 'DEGRADED' | 'STUCK';

export interface DiagnosisResult {
  detections: Detection[];
  verdict: Verdict;
  totalWastedTokens: number;
  totalWastedMs: number;
}
