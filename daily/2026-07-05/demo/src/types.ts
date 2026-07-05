export type Severity = 'critical' | 'warn' | 'info';
export type ChangeKind = 'added' | 'removed' | 'modified' | 'unchanged';
export type Recommendation = 'SAFE' | 'REVIEW' | 'BLOCK';

/** 行级 diff 的一行（用于展示"语义盲"的传统评审视角）。 */
export interface DiffLine {
  type: 'hunk' | 'ctx' | 'add' | 'del';
  text: string;
}

/** 语义模型中的一个实体节点（实体 / 关系 / 属性 / 约束）。 */
export interface SemanticNode {
  id: string;
  /** 实体类型标签，如 "Security Group" / "Column" / "Feature"。 */
  kind: string;
  /** 实体名，如 "ingress.ssh" / "orders.customer_id" / "Fillet-3"。 */
  label: string;
  change: ChangeKind;
  /** 该节点语义层面发生了什么（人类可读）。 */
  detail?: string;
  before?: string;
  after?: string;
  children?: SemanticNode[];
}

/** 一条意图 / 不变量核验结论。 */
export interface Finding {
  id: string;
  severity: Severity;
  title: string;
  detail: string;
  /** 判定依据：被违反的不变量 / 规则。 */
  rationale: string;
  /** 这条风险在行级 diff 里是否看不出来（核心价值主张）。 */
  invisibleInLineDiff: boolean;
  /** 关联到语义树上的节点，用于点击定位。 */
  nodeId: string;
  tags: string[];
}

export interface Scenario {
  id: string;
  domain: string;
  artifact: string;
  title: string;
  /** Agent 交付时的一句话自述（乐观）。 */
  agentSummary: string;
  /** Agent 给自己贴的改动标签，如 "小幅修复"。 */
  agentClaimTag: string;
  lineAdded: number;
  lineRemoved: number;
  lineDiff: DiffLine[];
  tree: SemanticNode[];
  findings: Finding[];
}
