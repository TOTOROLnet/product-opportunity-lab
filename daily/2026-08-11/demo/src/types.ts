// 众读 Zhòngdú — 类型定义
// 全部为纯前端 mock 数据结构；真实产品里“读者反应”由 persona 条件化的 LLM 在线生成，
// 本 Demo 用预计算的脚本化反应驱动，界面显式标注为离线模拟。

// 读者对某一句的反应类型
// engaged=投入(继续读)  confused=困惑  skeptical=反感/怀疑  bored=走神/略读  drop=在此弃读
export type ReactionKind = 'engaged' | 'confused' | 'skeptical' | 'bored' | 'drop';

export interface Reader {
  id: string;
  name: string;
  emoji: string;
  role: string; // 一句话画像
  caresAbout: string; // 最在意什么
  patience: number; // 0–100 初始注意力/耐心，越低越早流失
}

export interface Sentence {
  id: string; // 如 's1'
  text: string;
}

export interface Sample {
  id: string;
  title: string;
  scene: string; // 使用场景
  targetReaderId: string; // 作者真正想打动的“目标读者”
  panel: string[]; // 本样本的读者面板（含目标读者），引用 Reader.id
  sentences: Sentence[];
}

// 脚本化：某读者读到某句时的反应
export interface Reaction {
  readerId: string;
  sentenceId: string;
  kind: ReactionKind;
  attentionDelta: number; // -100..+100，对该读者注意力的增减
  note: string; // 一句话内心反应
}

// 一个可勾选的“改法”（结构/价值层面，而非语法）
export interface Edit {
  id: string;
  label: string;
  rationale: string; // 为什么这样改（改的是结构/价值，不是语法）
  overrides: Reaction[]; // 勾选后，用这些反应覆盖对应 (readerId, sentenceId)
}

export interface SampleData {
  sample: Sample;
  baseReactions: Reaction[]; // 覆盖 panel × sentences 的完整基线反应
  edits: Edit[];
}

// —— 引擎输出 ——

export interface TraceStep {
  sentenceId: string;
  index: number; // 1-based
  kind: ReactionKind;
  note: string;
  attentionAfter: number; // 0–100
  dropped: boolean; // 该读者是否已在此句（或之前）弃读
}

export interface ReaderTrace {
  readerId: string;
  steps: TraceStep[];
  dropIndex: number | null; // 首次弃读的句子序号（1-based），读到底则为 null
  finalAttention: number; // 读到的最后一句时的注意力
  readThroughRatio: number; // 读完比例 0–1
  score: number; // 该读者的接收分 0–100
}

export interface ReplayEvent {
  order: number;
  readerId: string;
  sentenceId: string;
  sentenceIndex: number;
  kind: ReactionKind;
  note: string;
  attentionAfter: number;
  dropped: boolean;
}

export interface SentenceHeat {
  sentenceId: string;
  index: number;
  level: ReactionKind; // 该句聚合后的主导热力等级
  byReader: { readerId: string; kind: ReactionKind; note: string; dropped: boolean }[];
}

export interface Friction {
  sentenceId: string;
  index: number;
  severity: number; // 越大越严重
  kind: ReactionKind;
  reason: string; // 聚合后的原因
  readerIds: string[];
}

export interface Analysis {
  traces: ReaderTrace[];
  heatmap: SentenceHeat[];
  targetDropIndex: number | null; // 目标读者流失句序号
  topFrictions: Friction[];
  receptionScore: number; // 0–100
}
