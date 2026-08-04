import type { Issue, SessionInput, Visibility } from '../types';

// ——— 全部为 mock 数据：脚本化的逐次关节观测，模拟端侧 CV 输出 ———
// 简写构造器：v(可见性, 深度%, 内扣°, 下放s)
function v(visibility: Visibility, depth: number, valgus: number, tempo: number) {
  return { visibility, depth, valgus, tempo };
}

// 今日主演示：深蹲 1 组 ×12。刻意覆盖：
// 达标 / 膝内扣提醒 / 机位看不清 / 遮挡看不清 / 太快看不清 / 后半段疲劳掉深度→喊停。
export const FEATURED: SessionInput = {
  id: 'today-squat',
  exercise: '深蹲',
  label: '今日 · 深蹲 1 组 ×12',
  reps: [
    v('clear', 92, 6, 1.3), // 1 达标
    v('clear', 88, 8, 1.2), // 2 达标
    v('clear', 90, 18, 1.1), // 3 膝内扣，提醒
    v('clear', 86, 7, 1.2), // 4 达标
    v('angle', 0, 0, 0), //   5 机位太正，看不清
    v('clear', 84, 8, 1.1), // 6 达标
    v('clear', 82, 9, 1.0), // 7 达标
    v('occluded', 0, 0, 0), // 8 器械遮挡，看不清
    v('clear', 66, 14, 0.9), // 9 疲劳掉深度（喊停点）
    v('clear', 60, 16, 0.8), //10 继续掉（触发连续下滑）
    v('fast', 0, 0, 0), //     11 太快，看不清
    v('clear', 55, 20, 0.7), //12 硬撑，动作已垮
  ],
};

// 一周 7 天 mock（深度中位数逐日上升 = 真进步；但每天后半段仍有疲劳硬撑）。
export const WEEK: SessionInput[] = [
  {
    id: 'w1',
    exercise: '深蹲',
    label: '周一 · 深蹲',
    reps: [
      v('clear', 80, 9, 1.2),
      v('clear', 78, 12, 1.1),
      v('angle', 0, 0, 0),
      v('clear', 76, 10, 1.0),
      v('clear', 62, 16, 0.9),
      v('clear', 58, 18, 0.8),
    ],
  },
  {
    id: 'w2',
    exercise: '俯卧撑',
    label: '周二 · 俯卧撑',
    reps: [
      v('clear', 82, 8, 1.3),
      v('clear', 80, 9, 1.2),
      v('clear', 79, 10, 1.1),
      v('occluded', 0, 0, 0),
      v('clear', 64, 15, 0.9),
      v('clear', 60, 17, 0.8),
    ],
  },
  {
    id: 'w3',
    exercise: '深蹲',
    label: '周三 · 深蹲',
    reps: [
      v('clear', 84, 7, 1.3),
      v('clear', 83, 8, 1.2),
      v('clear', 82, 9, 1.1),
      v('clear', 80, 10, 1.1),
      v('fast', 0, 0, 0),
      v('clear', 66, 14, 0.9),
    ],
  },
  {
    id: 'w4',
    exercise: '深蹲',
    label: '周四 · 深蹲',
    reps: [
      v('clear', 86, 7, 1.3),
      v('clear', 85, 8, 1.2),
      v('clear', 84, 8, 1.2),
      v('clear', 83, 9, 1.1),
      v('clear', 70, 13, 0.9),
      v('clear', 64, 15, 0.8),
    ],
  },
  {
    id: 'w5',
    exercise: '俯卧撑',
    label: '周五 · 俯卧撑',
    reps: [
      v('clear', 88, 6, 1.3),
      v('clear', 87, 7, 1.2),
      v('angle', 0, 0, 0),
      v('clear', 85, 8, 1.2),
      v('clear', 72, 12, 0.9),
    ],
  },
  {
    id: 'w6',
    exercise: '深蹲',
    label: '周六 · 深蹲',
    reps: [
      v('clear', 90, 6, 1.3),
      v('clear', 89, 6, 1.3),
      v('clear', 88, 7, 1.2),
      v('clear', 86, 8, 1.2),
      v('clear', 74, 12, 0.9),
      v('clear', 68, 14, 0.8),
    ],
  },
  {
    id: 'w7',
    exercise: '深蹲',
    label: '周日 · 深蹲',
    reps: [
      v('clear', 93, 5, 1.4),
      v('clear', 92, 6, 1.3),
      v('clear', 91, 6, 1.3),
      v('occluded', 0, 0, 0),
      v('clear', 90, 7, 1.2),
      v('clear', 78, 11, 0.9),
    ],
  },
];

export const DAY_NAMES = WEEK.map((s) => s.label.split(' · ')[0]);

// ——— 展示用文案映射 ———
export const VIS_LABEL: Record<Visibility, string> = {
  clear: '看得清',
  angle: '机位太正',
  occluded: '器械遮挡',
  fast: '动作太快',
};

export const ISSUE_LABEL: Record<Issue, string> = {
  depth: '深度不够',
  valgus: '膝盖内扣',
  tempo: '下放过快',
};
