// 归位 Guīwèi — 类型定义。全部为纯前端 mock 领域模型，不接任何真实系统。

export type DriftStatus = 'aligned' | 'drifted' | 'invalidated';
export type Severity = 'none' | 'low' | 'medium' | 'high';

// 复跑裁决：一致自动续 / 重规划 / 人工确认 / 跳过（他人已完成或已应用）/ 中止（目标已失效）
export type Verdict = 'auto-continue' | 'replan' | 'confirm' | 'skip' | 'abort';

export type AssumptionKind =
  | 'repo-head'
  | 'pr-state'
  | 'config-flag'
  | 'ci-status'
  | 'db-migration'
  | 'dependency'
  | 'ticket-status';

// 一条「世界假设」：Agent 在 T0（暂停前）记下、并在复跑时会依赖的关于外部世界的事实。
export interface Assumption {
  id: string;
  kind: AssumptionKind;
  title: string; // 例如「repo pay-svc 的 main HEAD」
  remembered: { value: string; label: string; at: string }; // T0：Agent 记得的
  current: { value: string; label: string; at: string }; // T1：现在真实世界（mock）
  logExcerpt: string; // 该假设从事件日志的哪一步形成
  probe: string; // 复跑前如何对活世界探测（mock 文案）
  dependentSteps: number[]; // runbook 中依赖此假设的后续步骤号
  // 当世界已漂移/失效时：
  changedStatus: Exclude<DriftStatus, 'aligned'>;
  changedSeverity: Severity;
  changedVerdict: Verdict;
  blindConsequence: string; // 朴素回放（盲目续跑）会造成什么
  gatedAction: string; // 归位安检后改为什么安全动作
}

export interface Scenario {
  taskName: string;
  taskId: string;
  runbookTotal: number;
  pausedAtStep: number;
  pausedReason: string;
  gapLabel: string;
  t0Label: string;
  t1Label: string;
  assumptions: Assumption[];
}

// 引擎对单条假设的复核结果
export interface Reconciled {
  assumption: Assumption;
  overriddenAligned: boolean; // 用户用「反事实开关」强制当作未漂移
  status: DriftStatus;
  severity: Severity;
  verdict: Verdict;
  effectiveLabel: string; // 当前生效的 T1 展示值（可能被反事实覆盖回 T0）
}

// runbook 中一个待续步骤的裁决
export interface StepPlan {
  step: number;
  worstVerdict: Verdict;
  reasons: string[]; // 关联假设标题
}

export interface Incident {
  assumptionId: string;
  title: string;
  consequence: string;
  severity: Severity;
}

export interface GatedItem {
  assumptionId: string;
  title: string;
  action: string;
  verdict: Verdict;
}

export interface ReconcileResult {
  items: Reconciled[];
  counts: { aligned: number; drifted: number; invalidated: number };
  metrics: {
    avoidedHighRisk: number; // 避免的高危事故数
    needHuman: number; // 需人工介入（重规划/确认/中止）
    skipCount: number; // 可安全跳过
    autoContinue: number; // 无需干预自动续
    attentionSteps: number; // 需关注的后续步骤数
    autoSteps: number; // 可自动续的后续步骤数
  };
  incidents: Incident[]; // 朴素回放会引发的事故清单
  gated: GatedItem[]; // 归位安检后的安全动作清单
  stepPlans: StepPlan[]; // 每个待续步骤的裁决
  verdictHeadline: string; // 顶部一句话裁决
  recommendResume: boolean; // 是否建议朴素续跑
}
