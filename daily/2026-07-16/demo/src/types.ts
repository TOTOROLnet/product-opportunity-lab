// 判定：通过 / 待定 / 拒
export type Verdict = 'advance' | 'maybe' | 'reject';

// 候选人（示例域：高级后端工程师初筛）的结构化特征。
// 真实产品里这些由 agent 从简历/JD 中抽取；Demo 中为 mock。
export interface Features {
  /** 有生产级后端经历（真的扛过线上后端） */
  prodBackend: boolean;
  /** 自述"全栈 / 全能" */
  claimsFullstack: boolean;
  /** 相关领域（支付 / 高并发 / 金融）有真实开源贡献 */
  oss: boolean;
  /** 相关领域匹配（做过支付 / 高并发 / 金融后端） */
  domainMatch: boolean;
  /** 频繁跳槽（平均任期短） */
  jobHopping: boolean;
  /** 自述与实际职责明显不符（夸大 / 造假） */
  overclaim: boolean;
}

export interface Candidate {
  id: string;
  handle: string; // 化名，保护隐私
  headline: string; // 一句话自述
  years: number;
  blurb: string; // 简述段落
  features: Features;
  /** agent 未经带教时的"天真"判定 */
  baseVerdict: Verdict;
  /** agent 给出的一句理由（体现它的天真偏见） */
  baseReason: string;
  /** 专家真实判断（ground truth，训练时对专家隐藏其"应教规则"） */
  expertVerdict: Verdict;
}

export interface TrainingCase extends Candidate {
  /** 该 case 若被专家纠正，应蒸馏出的规则 id；null 表示 agent 判对、专家会「认同」 */
  teachesRuleId: string | null;
}

// 技能卡里的一条规则：人类可读、带来源、可开关、可编辑。
export interface Rule {
  id: string;
  /** 人类可读描述（专家可编辑） */
  text: string;
  /** 触发条件的自然语言说明 */
  when: string;
  /** 命中后把判定改为 */
  setTo: Verdict;
  /** 来源：从哪个训练 case 的批改中学到 */
  learnedFromCaseId: string;
  weight: 'high' | 'med';
  /** 特征谓词：决定该规则是否命中某个 case（真实的、确定性的） */
  match: (f: Features) => boolean;
}

// 规则应用到某个 case 的结果（用于验收页归因）。
export interface Applied {
  verdict: Verdict;
  /** 决定最终判定的规则 id（若无规则命中则为 null，即沿用 base） */
  decidingRuleId: string | null;
}
