// 说戏 Shuōxì —— 核心类型定义
// 说明：本 Demo 只演示「改稿层」。Shot（镜头）是从上游 brief→成片 agent 拿到的初稿单元；
// 我们不生成视频，只对这些镜头做导演级说戏、锁定与选择性重生成。

export type Pace = 'slow' | 'keep' | 'fast';

/** 一个镜头（初稿里的一个 beat）。缩略图用色块 + emoji 占位，不加载任何外部资源。 */
export interface Shot {
  id: string;
  index: number;
  /** 镜头角色名，如「开场钩子」「行动号召」 */
  label: string;
  emoji: string;
  color: string;
  /** 口播文案 */
  script: string;
  /** 时长（秒） */
  durationSec: number;
  pace: Pace;
  /** 情绪强度 1–5 */
  energy: number;
  /** 画面描述（storyboard 提示） */
  visualNote: string;
  /** 「收紧节奏」时可被剪掉的铺垫词（用于 tracked-changes diff 的删除标记） */
  fillers: string[];
  /** 「强调」时高亮的关键短语 */
  keyPhrase: string;
  /** 「加强情绪」时插入的冲击式开场前缀 */
  hookPrefix: string;
}

/** 用户对某个镜头的「说戏」。 */
export interface DirectorNote {
  shotId: string;
  /** 锁定=已认可，改稿时逐字保留、绝不重生成 */
  locked: boolean;
  /** 自然语言导演笔记 */
  text: string;
  /** 快捷控件：节奏 */
  pace: Pace;
  /** 快捷控件：情绪增减 -1 / 0 / +1 */
  energyDelta: -1 | 0 | 1;
  /** 快捷控件：强调关键短语 */
  emphasize: boolean;
  /** 快捷控件：语气（空=不改） */
  tone: string;
}

export type ShotStatus = 'locked' | 'toRevise' | 'untouched';

/** tracked-changes diff 的一个片段 */
export interface DiffToken {
  text: string;
  kind: 'same' | 'del' | 'add' | 'emph';
}

/** 引擎对单个镜头重生成的结果 */
export interface Regen {
  tokens: DiffToken[];
  rationale: string[];
  result: {
    script: string;
    pace: Pace;
    energy: number;
    durationSec: number;
  };
}
