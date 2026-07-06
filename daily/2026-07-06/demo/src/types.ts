export type EvidenceType = 'screenshot' | 'http' | 'log' | 'test';
export type CriterionStatus = 'pass' | 'fail';

/** 伪截图：不引用外部图片，全部用 SVG/CSS 画出，variant 决定画面内容。 */
export interface ScreenshotEvidence {
  kind: 'screenshot';
  urlBar: string;
  variant: 'success' | 'error' | 'notfound' | 'form' | 'dashboard';
  caption: string;
}

export interface HttpEvidence {
  kind: 'http';
  method: string;
  path: string;
  status: number;
  latencyMs: number;
  note?: string;
}

export interface LogEvidence {
  kind: 'log';
  lines: LogLine[];
}

export interface LogLine {
  level: 'info' | 'warn' | 'error';
  text: string;
}

export interface TestEvidence {
  kind: 'test';
  passed: number;
  failed: number;
  failing: string[];
}

export type EvidencePayload =
  | ScreenshotEvidence
  | HttpEvidence
  | LogEvidence
  | TestEvidence;

export interface Criterion {
  id: string;
  text: string;
  evidenceType: EvidenceType;
  baselineStatus: CriterionStatus;
  currentStatus: CriterionStatus;
  baseline: EvidencePayload;
  current: EvidencePayload;
  /** 判定说明：为什么算/不算回归，含阈值/容差解释。 */
  rationale: string;
  /** 原始证据是否变化（即使状态没翻转）。用于演示"看似变了但在容差内"。 */
  evidenceChanged: boolean;
}

export interface RunMeta {
  id: string;
  label: string;
  agent: string;
  timestamp: string;
}

export interface Scenario {
  id: string;
  task: string;
  tagline: string;
  sourceDiff: { added: number; removed: number; note: string };
  baselineRun: RunMeta;
  currentRun: RunMeta;
  criteria: Criterion[];
}
