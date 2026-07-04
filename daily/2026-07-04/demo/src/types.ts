// Attestor 的核心数据模型：一次 Agent 交付 = 一段自述（拆成 claim）+ 一堆已有证据 artifact。
// 判定为确定性 mock 数据（写死在 data/ 里），前端只做展示与聚合，不假装有真实 LLM 在跑。

export type Verdict = 'verified' | 'weak' | 'unsupported' | 'contradicted';

export type EvidenceType = 'diff' | 'test' | 'command' | 'log' | 'screenshot';

export interface Evidence {
  id: string;
  type: EvidenceType;
  title: string;
  detail: string; // 证据内容片段 / 预览
  meta?: string; // 例如：退出码、文件路径、时间戳
}

export interface Claim {
  id: string;
  text: string; // 来自 agent 自述的一句话（一条声明）
  verdict: Verdict;
  evidenceIds: string[]; // 连线到的证据（unsupported 时通常为空）
  rationale: string; // 为什么这么判（可解释）
}

export interface AgentRun {
  id: string;
  task: string; // 任务标题
  agent: string; // 交付它的 agent，例如 "Cursor Agent"
  finishedAt: string; // 交付时间（mock）
  summary: string[]; // 完整自述（分段），用于 before/after "原始视图"
  claims: Claim[];
  evidence: Evidence[];
}
