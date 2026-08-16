// ---- 领域类型：agent 动作 / 护栏策略 / 判决 / 计分卡 ----

export type ToolCategory =
  | 'shell'
  | 'git'
  | 'fs'
  | 'cloud'
  | 'db'
  | 'net'
  | 'comms'
  | 'payment';

export type Scope = 'local' | 'staging' | 'prod' | 'external';
export type DataClass = 'none' | 'internal' | 'pii' | 'secret';
export type Decision = 'allow' | 'review' | 'deny';

/** 一条 agent 拟执行的动作（全部为 mock，属性人工标注，不接真实 trace）。 */
export interface Action {
  id: string;
  agent: string;
  title: string; // 简短命令 / 动作标题
  category: ToolCategory;
  scope: Scope;
  reversible: boolean;
  dataClass: DataClass;
  intent: string; // 自然语言意图
  riskBase: number; // 1–5 基础严重度
  emoji: string;
}

/** 分类规则：对某类工具的显式态度；inherit = 不显式表态，走全局逻辑/默认路径。 */
export type RulePref = 'inherit' | 'allow' | 'review' | 'deny';

/** 护栏策略（厂商中立）。 */
export interface Policy {
  preset: 'loose' | 'balanced' | 'strict' | 'custom';
  /** 无任何规则/守卫命中时的默认路径。 */
  defaultForUnmatched: Decision;
  /** 不可逆动作强制人审。 */
  requireHumanForIrreversible: boolean;
  /** prod 范围动作强制人审。 */
  requireHumanForProd: boolean;
  /** secret 数据外发 → fail-closed 一票否决。 */
  blockSecretExfil: boolean;
  /** 基础风险 > 该阈值 → 至少人审。 */
  maxAutoRisk: number;
  /** 人审预算（每批可承受的人审条数）。 */
  reviewBudget: number;
  /** 各工具分类的显式规则。 */
  categoryRules: Record<ToolCategory, RulePref>;
}

/** 引擎对单条动作的判决（可解释）。 */
export interface Verdict {
  action: Action;
  decision: Decision;
  reasons: string[];
  /** 是否被显式规则/守卫命中；false = 走默认路径（策略盲区）。 */
  matchedByRule: boolean;
  /** 危险漏网：被自动放行、却是不可逆或涉敏感数据的动作。 */
  leaked: boolean;
  /** 若自动放行，这条动作贡献的爆炸半径分（非放行则为 0）。 */
  radius: number;
}

/** 一次回放的聚合计分卡。 */
export interface Scorecard {
  total: number;
  allow: number;
  review: number;
  deny: number;
  leakedCount: number;
  blastRadius: number;
  reviewLoad: number;
  reviewBudget: number;
  gaps: number;
}
