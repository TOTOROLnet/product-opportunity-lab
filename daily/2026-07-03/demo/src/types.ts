// Fusebox 领域模型 —— 全部为演示用 mock，不接真实后端/MCP/API。

export type Sensitivity = 'pii' | 'financial' | 'internal' | 'public';

// 工具的权限策略（对应报告里 Basedash 的 Always allow / Needs approval / Blocked 三态）。
export type Policy = 'always' | 'approval' | 'blocked';

export type NodeKind = 'source' | 'tool' | 'sink';

// 工具能力：从数据源读取 / 写回系统 / 把数据送往外部。
export type ToolCapability = 'read' | 'write' | 'egress';

// 动作的可逆性。
export type Reversibility = 'yes' | 'partial' | 'no';

export type RiskCategory =
  | 'exfiltration' // 敏感数据外泄到外部
  | 'destructive' // 破坏性、不可逆写入
  | 'financial' // 无上限的财务动作
  | 'internal-spread'; // 敏感数据越过 need-to-know 边界扩散

export type Severity = 'high' | 'medium' | 'low';

export interface GraphNode {
  id: string;
  label: string;
  kind: NodeKind;
  desc: string;
  // 布局坐标（SVG 视口内）
  x: number;
  y: number;
  // source 专用
  sensitivity?: Sensitivity;
  external?: boolean; // sink 是否位于组织外部（公网 / 客户收件箱）
  // tool 专用
  capability?: ToolCapability;
  reversibility?: Reversibility;
  guardMissing?: string | null; // 缺失的护栏描述，如 "无 WHERE 条件护栏"
}

export interface GraphEdge {
  from: string;
  to: string;
}

// 候选高危链路：一串节点 id + 类别。是否"生效"与最终评分由 scoring 依据当前策略动态计算。
export interface CandidatePath {
  id: string;
  nodeIds: string[];
  category: RiskCategory;
}

export interface FirewallRule {
  id: string;
  label: string;
  desc: string;
}

export interface Scenario {
  agentName: string;
  agentDesc: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  candidatePaths: CandidatePath[];
  firewalls: FirewallRule[];
  defaultPolicies: Record<string, Policy>;
  defaultFirewalls: Record<string, boolean>;
}

// —— scoring 输出类型 ——

export interface ScoredPath {
  id: string;
  category: RiskCategory;
  nodeIds: string[];
  label: string; // 人类可读的链路标题
  active: boolean; // 当前策略下是否仍然可达
  inactiveReason?: string; // 被哪条策略/防火墙切断
  score: number; // 0–50 的单链路残余风险
  severity: Severity;
  sourceSensitivity: Sensitivity;
  worstReversibility: Reversibility;
  gated: boolean; // 链路上存在 Needs approval（有人类在环）
  reasons: string[]; // 评分构成的可读解释
  fix: string; // 建议修复
}

export interface RiskResult {
  paths: ScoredPath[];
  activePaths: ScoredPath[];
  totalRisk: number; // 0–100
  highCount: number;
  mediumCount: number;
}
