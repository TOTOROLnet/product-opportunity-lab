export type Confidence = 'high' | 'mid' | 'low';

/** 一道苏格拉底式回忆题（选择题形式，便于纯前端即时判分）。 */
export interface RecallQuestion {
  id: string;
  /** 追问题干：迫使用户主动回忆，而非被动听过。 */
  prompt: string;
  options: string[];
  correctIndex: number;
  /** 作答后展示的解释，把"为什么"讲透。 */
  explanation: string;
}

/** 一个概念单元：音频课的最小切分粒度，播完即触发回忆。 */
export interface ConceptUnit {
  id: string;
  title: string;
  /** 语音播报脚本（真实产品由 LLM 生成，这里是 mock）。 */
  script: string;
  /** 该单元希望用户"听完记住"的一句话核心。 */
  keyIdea: string;
  questions: RecallQuestion[];
}

export interface Doc {
  id: string;
  title: string;
  /** 来源类型：科普文章 / 商业备忘 / 教材章节。 */
  sourceType: string;
  blurb: string;
  estMinutes: number;
  units: ConceptUnit[];
}

/** 单题作答记录。 */
export interface AnswerRecord {
  selectedIndex: number;
  confidence: Confidence;
  correct: boolean;
}

/** answers[unitId][questionId] = AnswerRecord */
export type AnswerMap = Record<string, Record<string, AnswerRecord>>;

export type MasteryStatus = 'mastered' | 'shaky' | 'weak';

export interface UnitMastery {
  unitId: string;
  title: string;
  /** 0–100 掌握分。 */
  score: number;
  status: MasteryStatus;
  answered: boolean;
  /** 是否"自信地答错"——教育学上最危险的状态。 */
  confidentlyWrong: boolean;
}
