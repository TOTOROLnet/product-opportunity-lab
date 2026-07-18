// 明镜 GlassTutor — 类型定义
// 说明：全部为纯前端 mock 类型，不接任何后端 / LLM / 外部 API。

export interface Skill {
  id: string;
  name: string; // 完整名称，如 "JOIN 连接"
  short: string; // 图谱节点短名，如 "JOIN"
  desc: string; // 一句话说明
  prereqs: string[]; // 前置技能 id
  // trueMastery 仅用于「对比」页的确定性模拟：代表"学习者其实会多少"。
  // 学习舱里的实时模型不会读它——它模拟的是 AI 要去估计的、隐藏的真实水平。
  trueMastery: number; // 0..1
}

export interface Question {
  id: string;
  skillId: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  difficulty: number; // 0..1，越大越难
  explain: string; // 作答后的简短解析
}

export interface EvidenceEntry {
  turn: number;
  text: string;
  delta: number; // 本次对掌握度的改变量（正/负）
  kind: 'answer' | 'correction' | 'decay' | 'init';
}

// AI 对学习者在某个技能上的「认知模型」——这就是被摊开的玻璃盒。
export interface SkillState {
  skillId: string;
  mastery: number; // 0..1 AI 估计的掌握度
  confidence: number; // 0..1 该估计的置信度（观测越多越高）
  interest: number; // 兴趣权重（默认 1；学习者可上调/下调）
  lastPracticedTurn: number; // -1 表示从未练习
  evidence: EvidenceEntry[]; // 证据日志：AI 凭什么这么判
}

export type ModelState = Record<string, SkillState>;

// 「为什么现在考它」面板用的选题打分明细
export interface SelectionScore {
  skillId: string;
  gap: number; // 1 - mastery
  uncertainty: number; // 1 - confidence
  readiness: number; // 前置就绪度 0..1
  interest: number;
  recency: number; // 近期已练则降权（避免连续重复同一技能）0..1
  score: number; // 最终分
  chosen: boolean;
}

// 对比页：单步重放结果
export interface ReplayStep {
  index: number;
  skillId: string;
  skillShort: string;
  redundant: boolean; // 是否是对"其实已掌握技能"的无效操练
  note?: string;
}

export interface ComparisonResult {
  blackBox: ReplayStep[];
  glassBox: ReplayStep[];
  blackBoxRedundant: number;
  glassBoxRedundant: number;
  saved: number;
  slipSkillShort: string;
}
