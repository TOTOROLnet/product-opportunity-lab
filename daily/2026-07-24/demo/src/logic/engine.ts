// 榫卯 Tenon — 确定性引擎
// 给定「研究员发起的改动组合」+「榫卯 关/开」，算出下游两个 agent 的结局与价值指标。
// 全部纯函数、无随机、无外部依赖：同一套引擎同时驱动「漂移哨兵」页与价值条，数字前后一致。

import type { AnalystOutput, Drift, ReporterOutput, Verdict, WorldResult } from '../types';
import { DRIFTS, GROUND_TRUTH } from '../data/pipeline';

const MOOD_MAP_V1: Record<string, string> = {
  positive: '看多',
  neutral: '中性',
  negative: '看空',
};
// 榫卯迁移后（v2）新增对 mixed 的处理
const MOOD_MAP_V2: Record<string, string> = { ...MOOD_MAP_V1, mixed: '多空分歧' };

function has(sel: string[], id: string): boolean {
  return sel.includes(id);
}

/** 分析师：读 findings → 算 metrics */
function runAnalyst(scoreSeen: number | null, sampleSeen: number | null, sentimentSeen: string, migrated: boolean): AnalystOutput {
  const reliableSample = sampleSeen !== null && sampleSeen >= 30;
  const scoreNum = scoreSeen ?? 0;
  const confidenceIndex = reliableSample ? Math.round(scoreNum) : Math.round(scoreNum * 0.6);
  const moodMap = migrated ? MOOD_MAP_V2 : MOOD_MAP_V1;
  const moodSeen = moodMap[sentimentSeen] ?? '未知';
  const scoreRawLabel = scoreSeen === null ? '缺失' : String(scoreSeen);
  return { scoreSeen, scoreRawLabel, sampleSeen, reliableSample, confidenceIndex, moodSeen };
}

/** 报告员：读 metrics → 写结论 */
function runReporter(a: AnalystOutput): ReporterOutput {
  const rec =
    a.confidenceIndex >= 70 && a.reliableSample
      ? '建议推进'
      : a.confidenceIndex >= 40
        ? '谨慎观望'
        : '不建议推进';
  const sampleTxt = a.reliableSample ? '样本充分' : '样本不足';
  const line = `综合置信 ${a.confidenceIndex}/100（${sampleTxt}，情绪${a.moodSeen}）：${rec}`;
  return { recommendation: rec, line };
}

/** 真实意图下（榫卯 开、迁移后）应得的正确结局 */
function groundTruthWorld(enumSelected: boolean): WorldResult {
  const sentiment = enumSelected ? 'mixed' : GROUND_TRUTH.sentiment;
  const analyst = runAnalyst(GROUND_TRUTH.score, GROUND_TRUTH.sampleSize, sentiment, true);
  const reporter = runReporter(analyst);
  return { guard: true, analyst, reporter, correct: true };
}

/** 榫卯 关：分析师用「旧契约假设」去解读被漂移的字节，产生静默误读 */
function unguardedWorld(sel: string[], truth: ReporterOutput): WorldResult {
  // 分析师「看到」的 score
  let scoreSeen: number | null = GROUND_TRUTH.score; // 87
  if (has(sel, 'rename')) {
    scoreSeen = null; // 字段被改名 → 读 `score` 缺失
  } else if (has(sel, 'unit')) {
    scoreSeen = 0.87; // 值被归一化，但分析师仍当 0–100 用
  }
  const sampleSeen = has(sel, 'drop') ? null : GROUND_TRUTH.sampleSize;
  const sentimentSeen = has(sel, 'enum') ? 'mixed' : GROUND_TRUTH.sentiment;

  const analyst = runAnalyst(scoreSeen, sampleSeen, sentimentSeen, false); // 未迁移，旧 mood 映射
  const reporter = runReporter(analyst);
  const correct = reporter.line === truth.line;
  return { guard: false, analyst, reporter, correct };
}

const byId = (id: string): Drift => DRIFTS.find((d) => d.id === id)!;

export function evaluate(selected: string[]): Verdict {
  const sel = [...selected];
  const enumSelected = has(sel, 'enum');

  const breakingSelected = sel.map(byId).filter((d) => d.breaking);
  const safeSelected = sel.map(byId).filter((d) => !d.breaking);

  const on = groundTruthWorld(enumSelected);
  const off = unguardedWorld(sel, on.reporter);

  // 下游被污染的工件集合（去重）
  const corruptedSet = new Set<string>();
  for (const d of breakingSelected) d.corrupts.forEach((f) => corruptedSet.add(f));
  const corrupted = corruptedSet.size;
  const anyBreaking = breakingSelected.length > 0;

  const metrics = {
    silentCorruptionsOff: corrupted,
    silentCorruptionsOn: 0,
    detectionLatencyOff: anyBreaking ? 2 : 0, // 从改动(第0步)到报告(第2步)才暴露
    detectionLatencyOn: 0, // 写入时即在源头拦截
    protectedDownstreamOff: 0,
    protectedDownstreamOn: corrupted, // 本会被污染、如今被保护
    debugStepsOff: anyBreaking ? 3 : 0, // 报告→metrics→findings 逐个回溯
    debugStepsOn: 0,
    blastAgentsOff: anyBreaking ? 2 : 0, // 分析师 + 报告员
    migrationsOffered: breakingSelected.length,
  };

  return { selected: sel, breakingSelected, safeSelected, off, on, metrics };
}

/** 顶部一句话摘要（用于英雄区/回放）——始终基于当前选择实时算 */
export function headline(v: Verdict): { off: string; on: string; flipped: boolean } {
  return {
    off: v.off.reporter.line,
    on: v.on.reporter.line,
    flipped: v.off.reporter.recommendation !== v.on.reporter.recommendation,
  };
}
