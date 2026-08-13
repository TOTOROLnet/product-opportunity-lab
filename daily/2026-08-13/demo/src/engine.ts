import { CORE_ORDER, DRILLS, HABITS, TASKS } from './data/mock';
import type { HabitAgg, HabitInstance, HabitType, Drill, Progress, Task } from './types';

// ────────────────────────────────────────────────────────────────────────────
// 「模拟 AI 引擎」（simulated AI engine）
// 演示用的确定性纯前端逻辑：把 mock 产出聚类成"习惯"、匹配差异高亮、批改补差练习。
// 真实产品里这三件事（母语改写 / 跨样本聚类 / 生成练习）由 LLM 完成。
// ────────────────────────────────────────────────────────────────────────────

export const emptyProgress: Progress = {
  lexical: 0,
  calque: 0,
  collocation: 0,
  pragmatic: 0,
  redundant: 0,
  surface: 0,
};

export function drillsForHabit(habit: HabitType): Drill[] {
  return DRILLS.filter((d) => d.habit === habit);
}

// 掌握度：完成了该习惯对应的几道练习 → 百分比。无对应练习记为 0。
export function masteryOf(habit: HabitType, progress: Progress): number {
  const total = drillsForHabit(habit).length;
  if (total === 0) return 0;
  return Math.min(100, Math.round((progress[habit] / total) * 100));
}

// 把散落在各任务里的差异片段，聚类成"你反复出现的习惯"。这是与逐条改错工具的本质区别。
export function buildGapMap(progress: Progress, tasks: Task[] = TASKS): HabitAgg[] {
  const byHabit = new Map<HabitType, HabitInstance[]>();
  for (const task of tasks) {
    for (const span of task.spans) {
      const arr = byHabit.get(span.habit) ?? [];
      arr.push({
        taskId: task.id,
        taskTitle: task.title,
        learner: span.learner,
        native: span.native,
        note: span.note,
      });
      byHabit.set(span.habit, arr);
    }
  }

  const aggs: HabitAgg[] = [];
  for (const habit of CORE_ORDER) {
    const instances = byHabit.get(habit) ?? [];
    if (instances.length === 0) continue;
    aggs.push({
      meta: HABITS[habit],
      freq: instances.length,
      instances,
      drillCount: drillsForHabit(habit).length,
    });
  }
  // 排序：core 优先于 low；同优先级按频次降序。
  return aggs.sort((a, b) => {
    if (a.meta.priority !== b.meta.priority) return a.meta.priority === 'core' ? -1 : 1;
    return b.freq - a.freq;
  });
}

// 一句话"地道度画像"总结。
export function profileSummary(aggs: HabitAgg[]): string {
  const core = aggs.filter((a) => a.meta.priority === 'core');
  const top = core.slice(0, 3).map((a) => a.meta.label);
  const coreCount = core.length;
  const lowCount = aggs.length - coreCount;
  return `本次从你的 3 段真实产出里聚出 ${aggs.length} 类习惯：${coreCount} 类属"地道度"（可提升空间大）、${lowCount} 类是实例级小错（次要）。最该先补的是：${top.join(' / ')}。`;
}

// 归一化：小写、去标点、压空格。用于练习批改。
function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/[^a-z' ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export type DrillVerdict = 'correct' | 'close' | 'retry';

export function checkDrill(drill: Drill, answer: string): DrillVerdict {
  const a = normalize(answer);
  if (!a) return 'retry';
  if (drill.reject) {
    for (const r of drill.reject) {
      if (a.includes(normalize(r))) return 'close';
    }
  }
  for (const acc of drill.accept) {
    if (a.includes(normalize(acc))) return 'correct';
  }
  // 改了句子但没命中要点 → 接近；几乎没改 → 再试。
  return a === normalize(drill.stem) ? 'retry' : 'close';
}

// ── 内联高亮：把学习者产出里"能精确定位"的差异片段包起来（含省略号/括号的片段只在差异清单里展示）──
export interface HiToken {
  text: string;
  habit?: HabitType;
  spanIndex?: number;
}

export function highlightLearner(task: Task): HiToken[] {
  const text = task.learnerOutput;
  type M = { start: number; end: number; habit: HabitType; i: number };
  const matches: M[] = [];
  task.spans.forEach((s, i) => {
    if (s.learner.includes('…') || s.learner.includes('(')) return;
    const idx = text.indexOf(s.learner);
    if (idx >= 0) matches.push({ start: idx, end: idx + s.learner.length, habit: s.habit, i });
  });
  matches.sort((a, b) => a.start - b.start);

  const chosen: M[] = [];
  let last = -1;
  for (const m of matches) {
    if (m.start >= last) {
      chosen.push(m);
      last = m.end;
    }
  }

  const tokens: HiToken[] = [];
  let cursor = 0;
  for (const m of chosen) {
    if (m.start > cursor) tokens.push({ text: text.slice(cursor, m.start) });
    tokens.push({ text: text.slice(m.start, m.end), habit: m.habit, spanIndex: m.i });
    cursor = m.end;
  }
  if (cursor < text.length) tokens.push({ text: text.slice(cursor) });
  return tokens;
}
