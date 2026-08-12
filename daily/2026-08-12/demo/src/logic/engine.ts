import type {
  AgentRun,
  AttentionItem,
  Assumption,
  Chapter,
  LooseEnd,
  Phase,
  SelfEdit,
} from '../types';

// 章节的规范顺序（叙事时间线按此排列）。
export const PHASE_ORDER: Phase[] = [
  '确认目标',
  '首次尝试',
  '遇阻转向',
  '收敛',
  '自我修订',
  '收尾',
];

// 注意力清单「只盯这些」取前 N 条。
export const ATTENTION_TOP = 3;

// 「读懂用时」估算的单价（秒）。透明、可解释，不是玄学分数。
export const RATE = {
  logStepSec: 15, // 逐行爬：每条原始日志约 15 秒
  fileSec: 40, // 逐行爬：每个改动文件的 diff 约 40 秒
  lineSec: 2, // 逐行爬：每行净增删约 2 秒
  chapterSec: 20, // 随读：读懂一章的一句话约 20 秒
  attentionSec: 20, // 随读：读懂一个「只盯这些」条目约 20 秒
};

export function orderedChapters(run: AgentRun): Chapter[] {
  return [...run.chapters].sort(
    (a, b) => PHASE_ORDER.indexOf(a.phase) - PHASE_ORDER.indexOf(b.phase),
  );
}

export function uniqueFilesChanged(run: AgentRun): string[] {
  const set = new Set<string>();
  run.chapters.forEach((c) => c.touchedFiles.forEach((f) => set.add(f)));
  return [...set];
}

export function linesChanged(run: AgentRun): number {
  let n = 0;
  run.chapters.forEach((c) =>
    c.diff.forEach((d) => {
      if (d.kind === 'add' || d.kind === 'del') n += 1;
    }),
  );
  return n;
}

export type RunSummary = {
  steps: number;
  files: number;
  lines: number;
  chapters: number;
  assumptions: number;
  looseEnds: number;
  selfEdits: number;
  durationMin: number;
  rawReadSec: number;
  rawReadMin: number;
  catchupSec: number;
  catchupMin: number;
  savedMin: number;
  rawBreakdown: { logSec: number; fileSec: number; lineSec: number };
  catchupBreakdown: { chapterSec: number; attentionSec: number };
};

export function summarize(run: AgentRun): RunSummary {
  const steps = run.rawLog.length;
  const files = uniqueFilesChanged(run).length;
  const lines = linesChanged(run);
  const chapters = run.chapters.length;
  const durationMin = run.chapters.reduce((s, c) => s + c.durationMin, 0);

  const logSec = steps * RATE.logStepSec;
  const fileSec = files * RATE.fileSec;
  const lineSec = lines * RATE.lineSec;
  const rawReadSec = logSec + fileSec + lineSec;

  const topN = Math.min(ATTENTION_TOP, attentionItems(run).length);
  const chapterSec = chapters * RATE.chapterSec;
  const attentionSec = topN * RATE.attentionSec;
  const catchupSec = chapterSec + attentionSec;

  const rawReadMin = Math.round(rawReadSec / 60);
  const catchupMin = Math.round(catchupSec / 60);

  return {
    steps,
    files,
    lines,
    chapters,
    assumptions: run.assumptions.length,
    looseEnds: run.looseEnds.length,
    selfEdits: run.selfEdits.length,
    durationMin,
    rawReadSec,
    rawReadMin,
    catchupSec,
    catchupMin,
    savedMin: rawReadMin - catchupMin,
    rawBreakdown: { logSec, fileSec, lineSec },
    catchupBreakdown: { chapterSec, attentionSec },
  };
}

// 「需要你拿主意」的权重——仅用于排序，不是"对错分"。
export function assumptionWeight(a: Assumption): number {
  return a.divergence * 10 + 2;
}
export function looseEndWeight(l: LooseEnd): number {
  return l.severity * 10;
}
export function selfEditWeight(s: SelfEdit): number {
  const opW = s.op === 'add' ? 12 : 10;
  const kindW = s.kind === 'skill' ? 3 : s.kind === 'memory' ? 2 : 1;
  return opW + kindW;
}

// 汇总所有「需要你拿主意」的条目并按权重降序。
export function attentionItems(run: AgentRun): AttentionItem[] {
  const items: AttentionItem[] = [];

  run.assumptions.forEach((a) =>
    items.push({
      key: `assumption:${a.id}`,
      kind: 'assumption',
      title: `它替你假设：${a.text}`,
      detail: a.rationale,
      weight: assumptionWeight(a),
      chapterId: a.chapterId,
      refId: a.id,
    }),
  );
  run.looseEnds.forEach((l) =>
    items.push({
      key: `looseEnd:${l.id}`,
      kind: 'looseEnd',
      title: `悬而未决：${l.text}`,
      detail: `严重度 ${l.severity}/3`,
      weight: looseEndWeight(l),
      chapterId: l.chapterId,
      refId: l.id,
    }),
  );
  run.selfEdits.forEach((s) =>
    items.push({
      key: `selfEdit:${s.id}`,
      kind: 'selfEdit',
      title: `它给自己改了：${s.op === 'add' ? '新增' : '更新'} ${s.kind} 「${s.name}」`,
      detail: s.futureImpact,
      weight: selfEditWeight(s),
      chapterId: s.chapterId,
      refId: s.id,
    }),
  );

  return items.sort((a, b) => b.weight - a.weight);
}

export function topAttention(run: AgentRun): AttentionItem[] {
  return attentionItems(run).slice(0, ATTENTION_TOP);
}

// 「只看需要我决定的」过滤：带有任一假设/悬案/自我修订的章节 id。
export function decisionChapterIds(run: AgentRun): Set<string> {
  const ids = new Set<string>();
  run.chapters.forEach((c) => {
    if (
      c.relatedAssumptionIds.length ||
      c.relatedLooseEndIds.length ||
      c.relatedSelfEditIds.length
    ) {
      ids.add(c.id);
    }
  });
  return ids;
}

// 小工具：按 id 取对象（供 UI 交叉引用）。
export function assumptionById(run: AgentRun, id: string): Assumption | undefined {
  return run.assumptions.find((a) => a.id === id);
}
export function looseEndById(run: AgentRun, id: string): LooseEnd | undefined {
  return run.looseEnds.find((l) => l.id === id);
}
export function selfEditById(run: AgentRun, id: string): SelfEdit | undefined {
  return run.selfEdits.find((s) => s.id === id);
}
export function chapterById(run: AgentRun, id: string): Chapter | undefined {
  return run.chapters.find((c) => c.id === id);
}
export function rawLogStep(run: AgentRun, step: number) {
  return run.rawLog.find((r) => r.step === step);
}

// 展示用：秒 → "m 分" / "s 秒"。保持 engine 内部用原始秒，只在展示层格式化。
export function fmtDuration(sec: number): string {
  if (sec < 60) return `${sec} 秒`;
  const m = Math.round(sec / 60);
  return `${m} 分`;
}
