// 明约 Mandate — 类型定义（全部为演示用结构，无真实后端）

// 对账三态：守约 / 计划内微调 / 越界
export type Verdict = 'honored' | 'adapted' | 'deviated';

// 越界 / 微调的类别，用于给出更具体的解释与配色
export type DeviationKind =
  | 'scope' // 范围扩张：做了超出批准边界的量
  | 'external' // 未授权对外动作：真发邮件 / 改记录等
  | 'source' // 使用了未批准 / 不可追溯的数据源
  | 'budget' // 超出批准预算上限
  | 'adapt'; // 计划内等价替换（微调，非越界）

// 交付口整体裁定
export type DeliveryVerdict = 'blocked' | 'review' | 'safe';

// 数据源引用（是否为批准源）
export interface SourceRef {
  label: string;
  approved: boolean;
}

// 一条「计划步 ↔ 实际执行」对账记录（计划与执行 1:1；planIntent 为 null 表示该步不在批准计划内）
export interface ReconStep {
  id: string;
  title: string;
  planIntent: string | null; // 你批准了什么（null = 未在批准计划中，属计划外新增）
  guardrail?: string; // 你设定的约束 / 边界
  actualAction: string; // agent 实际做了什么
  usedSources: SourceRef[];
  isExternalAction: boolean; // 是否触及外部（发邮件 / 改 CRM / 发布等）
  verdict: Verdict;
  deviationKind?: DeviationKind;
  reason: string; // 一句话说明该裁定的依据
}

// 成品中的一个可点击元素（数字 / 论断 / 已执行动作）
export interface DeliverableElement {
  id: string;
  group: string; // 归属分组 / 区块
  label: string;
  value: string;
  sourceStepId: string; // 由哪一条对账步产生
  isAction?: boolean; // 是否是「已执行的对外动作」（高危）
}

export type DeliverableType = 'brief' | 'spreadsheet' | 'doc';

export interface Deliverable {
  type: DeliverableType;
  title: string;
  subtitle: string;
  elements: DeliverableElement[];
}

export interface Scenario {
  id: string;
  name: string;
  agentContext: string; // 哪个 agent、什么任务
  approvedPlanSummary: string; // 你当初批准计划的一句话概述
  ranFor: string; // 自主执行时长
  deliverable: Deliverable;
  steps: ReconStep[];
}

// 用户对越界项的处置状态
export type ItemDecision = 'signed' | 'rejected';

export interface ReconSummary {
  honored: number;
  adapted: number;
  deviated: number;
  openDeviations: number; // 未签署且未驳回的越界项
  signedDeviations: number;
  rejected: number;
  verdict: DeliveryVerdict;
  headline: string;
}
