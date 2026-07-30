// 全部为 Demo 内的类型定义。真实产品里 backlog 来自 Pocket/Readwise/浏览器书签/YouTube 稍后看，
// hostIntro/hostClosing 来自 LLM 主持；本 Demo 中它们都是 mock（模拟 AI 编排/口播的结果）。

export type ItemKind = 'article' | 'video' | 'thread';

/** 一条积压的"稍后读/稍后看"。 */
export interface BacklogItem {
  id: string;
  title: string;
  source: string;
  kind: ItemKind;
  /** 存了多久没看（天）。用来体现"积压坟场"。 */
  savedDaysAgo: number;
  /** 预计消费时长（分钟）。 */
  minutes: number;
  /** 内容摘录——来自用户自己保存的东西，AI 不生成正文。 */
  excerpt: string;
  tags: string[];
}

/** 节目里每一条的角色，用来组织"起承转合"的弧线。 */
export type SegmentRole = 'opening' | 'deep' | 'contrast' | 'closer';

/** 主持话痨度：控制串场口播的长度（AI 只做主持、可调、不喧宾夺主）。 */
export type HostVerbosity = 'concise' | 'normal' | 'chatty';

/** 节目单里的一条 = 引用一条 backlog + AI 主持给它写的串场口播。 */
export interface ProgramSegment {
  itemId: string;
  role: SegmentRole;
  /** AI 主持"为什么现在给你放这条"的串场口播（预置 mock，模拟生成结果）。 */
  hostIntro: {
    concise: string;
    normal: string;
    chatty: string;
  };
}

/** 今日整档节目（模拟 AI 编排的结果）。 */
export interface DailyProgram {
  date: string;
  /** 节目主题——AI 从今天选中的条目里提炼的一句"今日气质"。 */
  theme: string;
  segments: ProgramSegment[];
  /** 收播收尾语（预置 mock）。 */
  hostClosing: {
    concise: string;
    normal: string;
    chatty: string;
  };
  /** 编排前的总积压条数。 */
  backlogBefore: number;
  /** 已连续收播天数。 */
  streakDays: number;
}

export type ViewName = 'rundown' | 'player' | 'signoff';
