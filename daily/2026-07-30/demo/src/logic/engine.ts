import type {
  BacklogItem,
  DailyProgram,
  HostVerbosity,
  ProgramSegment,
  SegmentRole,
} from '../types';
import { backlogById } from '../data/backlog';

// 每种 segment 角色的展示信息 —— 让 AI 的"编排弧线"对用户可见（起承转合）。
export const ROLE_META: Record<
  SegmentRole,
  { label: string; hint: string; accent: string }
> = {
  opening: { label: '开场 · 暖场', hint: '定调，把你带进来', accent: '#e8a13a' },
  deep: { label: '深读 · 主菜', hint: '今晚的分量所在', accent: '#7c6cf0' },
  contrast: { label: '反调 · 对照', hint: '故意放的反方，别只听顺耳的', accent: '#e06c9f' },
  closer: { label: '轻收尾 · 收播', hint: '着陆，然后结束', accent: '#4bb3a7' },
};

export const KIND_LABEL: Record<BacklogItem['kind'], string> = {
  article: '文章',
  video: '视频',
  thread: '长推',
};

/** 一条节目 = backlog 内容 + AI 主持口播，已在编排引擎里 join 好。 */
export interface EnrichedSegment {
  index: number;
  item: BacklogItem;
  role: SegmentRole;
  segment: ProgramSegment;
}

export interface BuiltProgram {
  date: string;
  theme: string;
  streakDays: number;
  segments: EnrichedSegment[];
  totalMinutes: number;
  cleared: number;
  backlogBefore: number;
  backlogAfter: number;
}

/**
 * 确定性"编排"：把今日节目单与你的积压 join 起来，算出弧线、总时长与清空后的积压。
 * 真实产品里这一步是 LLM 从整个 backlog 里挑 + 排；这里用固定 program 复现其结果，保证可复算、每次一致。
 */
export function buildProgram(program: DailyProgram): BuiltProgram {
  const segments: EnrichedSegment[] = program.segments
    .map((segment, index) => {
      const item = backlogById(segment.itemId);
      if (!item) return null;
      return { index, item, role: segment.role, segment };
    })
    .filter((s): s is EnrichedSegment => s !== null);

  const totalMinutes = segments.reduce((sum, s) => sum + s.item.minutes, 0);
  const cleared = segments.length;

  return {
    date: program.date,
    theme: program.theme,
    streakDays: program.streakDays,
    segments,
    totalMinutes,
    cleared,
    backlogBefore: program.backlogBefore,
    backlogAfter: Math.max(program.backlogBefore - cleared, 0),
  };
}

export function hostText(segment: ProgramSegment, verbosity: HostVerbosity): string {
  return segment.hostIntro[verbosity];
}

/** 剩余时长（分钟）：从 currentIndex（含）到结尾。用来强化"节目会结束"。 */
export function minutesRemaining(segments: EnrichedSegment[], currentIndex: number): number {
  return segments
    .slice(currentIndex)
    .reduce((sum, s) => sum + s.item.minutes, 0);
}
