// 习惯类型：分析的最小单位是"你反复出现的产出习惯"，而不是词 / 音素 / 单句错误。
export type HabitType =
  | 'lexical' // 词汇过窄（very+形容词、good/big 等笼统词）
  | 'calque' // 语法直译（although...but / because...so）
  | 'collocation' // 缺地道搭配（phrasal verbs、固定搭配）
  | 'pragmatic' // 语用生硬直接（命令 / 指责 / 硬否定）
  | 'redundant' // 冗余啰嗦
  | 'surface'; // 实例级小错（冠词/时态等，Grammarly 地盘，本产品刻意降权）

export interface HabitMeta {
  id: HabitType;
  label: string; // 中文标签
  en: string; // 英文短名
  color: string; // 主题色
  priority: 'core' | 'low'; // core=本产品重点；low=刻意降权
  desc: string; // 一句话说明
}

// 一段真实产出里的一处差异片段（原文 → 母语说法），归属到某一类习惯。
export interface Span {
  learner: string; // 学习者原文片段
  native: string; // 母语者说法
  habit: HabitType;
  note: string; // 为什么 / 解释
}

export interface Task {
  id: string;
  title: string; // 场景标题（中文）
  channel: string; // Slack / 会议 / 邮件
  prompt: string; // 要表达的意图（中文）
  learnerOutput: string; // 学习者产出（英文，含多个习惯）
  nativeRewrite: string; // 母语改写
  spans: Span[]; // 差异片段（按出现顺序）
}

// 图谱下钻：某习惯在各任务里的所有实例。
export interface HabitInstance {
  taskId: string;
  taskTitle: string;
  learner: string;
  native: string;
  note: string;
}

// 聚类后的一条习惯（跨样本）。
export interface HabitAgg {
  meta: HabitMeta;
  freq: number; // 出现次数（before）
  instances: HabitInstance[];
  drillCount: number; // 该习惯对应多少道补差练习
}

export interface Drill {
  id: string;
  habit: HabitType;
  promptCn: string; // 中文指令
  stem: string; // 待改写的英文句子
  hint: string; // 提示
  accept: string[]; // 可接受答案的关键片段（归一化后 includes 匹配）
  reject?: string[]; // 出现即判错（如 lexical 里仍保留 "very"）
  sample: string; // 参考母语答案
  explain: string; // 讲解
}

// 每个习惯的掌握进度：完成 closed 道对应练习。
export type Progress = Record<HabitType, number>;
