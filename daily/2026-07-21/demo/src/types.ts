// 全部为纯前端 mock 类型定义。无任何真实 agent / 后端 / 外部 API。

export type AgentKind = '应收 Agent' | '运营 Agent' | '工程 Agent';

// 可逆性：high = 易撤销；medium = 有代价但可补救；low = 近乎不可逆。
export type Reversibility = 'high' | 'medium' | 'low';

export interface Category {
  id: string;
  label: string;
  agent: AgentKind;
  reversibility: Reversibility;
  /** 是否**允许**被提升为自动放行。高风险/不可逆类目永远为 false（安全红线）。 */
  autoEligible: boolean;
  /** 连续一致批准多少次后，出现「提升为自动放行」的建议。 */
  promoteThreshold: number;
  /** 每条动作的人话代价说明（用于「看清代价再批准」）。 */
  stakeHint: string;
}

export interface Proposal {
  id: string;
  tick: number;
  agent: AgentKind;
  categoryId: string;
  /** 人话摘要：这条动作要改什么。 */
  summary: string;
  /** 金额或影响量级（¥）。0 表示无直接金额。 */
  amount: number;
  /**
   * 事后真相：该动作若被执行，是否会出问题（客户投诉 / 被反转）。
   * 仅用于「反转事件」的模拟——一个尽责的人在审阅时能从 redFlag 看出端倪，
   * 但按类目规则的自动放行会盲放。
   */
  groundTruthBad?: boolean;
  /** 人可察觉的红旗（自动放行看不到）。 */
  redFlag?: string;
}

export type Outcome =
  | 'approved-manual'
  | 'edited-approved'
  | 'rejected'
  | 'escalated'
  | 'auto-approved'
  | 'reversed';

export interface AuditEntry {
  proposalId: string;
  tick: number;
  agent: AgentKind;
  categoryId: string;
  summary: string;
  outcome: Outcome;
  note: string;
  rungAfter: number;
}

export type Strategy = 'manual' | 'trustladder';

export interface Metrics {
  strategy: Strategy;
  total: number;
  humanReviews: number;
  autoHandled: number;
  escalated: number;
  reversed: number;
  /** 高风险/不可逆动作被「无人工」放行的次数——安全红线，必须为 0。 */
  highStakesAutoApproved: number;
  /** 可逆错误被自动放行漏过的次数（会被反转自愈）。 */
  reversibleSlipped: number;
  /** 自动放行覆盖率（占「可自动化的良性动作」的比例）。 */
  autoCoveragePct: number;
  /** 模拟清空队列所需人工时长（分钟）。 */
  humanMinutes: number;
}
