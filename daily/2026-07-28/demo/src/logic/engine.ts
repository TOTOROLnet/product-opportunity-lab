import type { Experiment, DailyPoint, ReadoutResult, Verdict } from '../types';

// ————————————————————————————————————————————————————————————
// 验己 读数引擎（确定性统计替身）
//
// 说明：真实产品里，「把自由文本建议转成有效实验协议」与「从噪声数据里给诚实读数」
// 需要 LLM 推理 + 稳健统计。此处用确定性规则做**价值可视化替身**，如实标注，
// 不声称是真实 AI 推断。核心立场：宁可说“数据不足 / 疑似安慰剂”，也不制造伪改善错觉。
// ————————————————————————————————————————————————————————————

const round = (n: number, d = 1): number => {
  const f = Math.pow(10, d);
  return Math.round(n * f) / f;
};

const mean = (xs: number[]): number =>
  xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;

/** 样本标准差（n-1） */
const sampleSD = (xs: number[]): number => {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  const v = xs.reduce((a, b) => a + (b - m) * (b - m), 0) / (xs.length - 1);
  return Math.sqrt(v);
};

const vals = (pts: DailyPoint[]): number[] => pts.map((p) => p.value);
const clamp = (n: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, n));

export function computeReadout(exp: Experiment): ReadoutResult {
  const improvementSign = exp.direction === 'higher-better' ? 1 : -1;

  const offPts = exp.series.filter((p) => p.phase === 'off');
  const onPts = exp.series.filter((p) => p.phase === 'on');
  const offVals = vals(offPts);
  const onVals = vals(onPts);

  const baselineMean = mean(offVals);
  const baselineSD = sampleSD(offVals);
  const interventionMean = mean(onVals);

  const rawDiff = interventionMean - baselineMean;
  const improvement = improvementSign * rawDiff; // 朝改善方向为正
  const effectRatio = baselineSD > 0 ? Math.abs(rawDiff) / baselineSD : 0;

  // —— ABAB 反转一致性：两轮“on”是否都优于相邻“off” ——
  let reversalConsistent: boolean | null = null;
  if (exp.design === 'ABAB') {
    const blockMean = (b: DailyPoint['block']) =>
      mean(vals(exp.series.filter((p) => p.block === b)));
    const a1 = blockMean('A1');
    const b1 = blockMean('B1');
    const a2 = blockMean('A2');
    const b2 = blockMean('B2');
    reversalConsistent =
      improvementSign * (b1 - a1) > 0 && improvementSign * (b2 - a2) > 0;
  }

  // —— 均值回归启发式（仅 AB）：基线自身在干预开始前是否已朝改善方向漂移 ——
  let regressionToMean = false;
  if (exp.design === 'AB' && offVals.length >= 4) {
    const half = Math.floor(offVals.length / 2);
    const firstHalf = mean(offVals.slice(0, half));
    const secondHalf = mean(offVals.slice(offVals.length - half));
    const baselineDrift = improvementSign * (secondHalf - firstHalf);
    regressionToMean = baselineDrift > 0.5 * baselineSD;
  }

  // —— 新奇效应衰减启发式（仅 AB）：早期改善明显、后期回落到基线附近 ——
  let noveltyDecay = false;
  if (exp.design === 'AB' && onVals.length >= 6) {
    const third = Math.floor(onVals.length / 3);
    const earlyMean = mean(onVals.slice(0, third));
    const lateMean = mean(onVals.slice(onVals.length - third));
    const earlyImprove = improvementSign * (earlyMean - baselineMean);
    const lateImprove = improvementSign * (lateMean - baselineMean);
    noveltyDecay = earlyImprove > 0.5 && lateImprove < 0.3 * earlyImprove;
  }

  // —— 判定（顺序敏感）——
  let verdict: Verdict;
  if (noveltyDecay && exp.metricType === 'subjective') {
    verdict = 'placebo';
  } else if (
    effectRatio >= 1.5 &&
    exp.metricType === 'objective' &&
    (exp.design === 'ABAB' ? reversalConsistent === true : true)
  ) {
    verdict = 'effective';
  } else {
    verdict = 'insufficient';
  }

  // —— 个人证据强度 0–100 ——
  let s = 0;
  if (exp.metricType === 'objective') s += 10;
  s += Math.min(45, effectRatio * 30);
  if (reversalConsistent === true) s += 20;
  if (regressionToMean) s -= 15;
  if (noveltyDecay) s -= 25;
  if (exp.metricType === 'subjective') s -= 10; // 未盲的主观自评降权
  const evidenceStrength = Math.round(clamp(s, 0, 95));

  // —— 理由 & 读数文案 ——
  const reasons: string[] = [];
  const swing = round(baselineSD, 1);
  reasons.push(
    `干预期均值 ${round(interventionMean, 1)} vs 基线均值 ${round(baselineMean, 1)} ${exp.metricUnit}，` +
      `朝改善方向变化 ${round(improvement, 1)}${exp.metricUnit}。`,
  );
  reasons.push(
    `效应量 = |均值差| / 基线波动 = ${round(effectRatio, 2)}（基线日间波动约 ±${swing}${exp.metricUnit}）。`,
  );
  if (exp.design === 'ABAB') {
    reasons.push(
      reversalConsistent
        ? '两轮 ABAB 反转一致：干预段改善、停用段回落，效果可复现。'
        : '两轮 ABAB 反转不一致：干预与停用段未呈现可复现的改善。',
    );
  }
  if (regressionToMean) {
    reasons.push('基线在干预开始前就已朝改善方向下行——更像均值回归而非干预的功劳。');
  }
  if (noveltyDecay) {
    reasons.push('改善集中在干预早期、后期回落到基线附近——典型的新奇效应衰减。');
  }
  if (exp.metricType === 'subjective') {
    reasons.push('主指标是未设盲的主观自评，易受期待/心理暗示影响，证据权重更低。');
  }

  const naiveReading =
    `${exp.metricName}从 ${round(baselineMean, 1)} 变到 ${round(interventionMean, 1)}${exp.metricUnit}，` +
    `朝好的方向动了 ${round(Math.abs(improvement), 1)}${exp.metricUnit}——看起来有效！`;

  let honestReading: string;
  let recommendation: string;
  if (verdict === 'effective') {
    honestReading =
      `效应约为你基线波动的 ${round(effectRatio, 1)} 倍` +
      (reversalConsistent ? '，且 ABAB 两轮都复现' : '') +
      `——这是**较强的个人证据**：对你而言大概率真的有用。`;
    recommendation = '建议再跑一轮巩固，并留意是否有其它同时改变的变量（如睡眠环境）。';
  } else if (verdict === 'placebo') {
    honestReading =
      `别急着庆祝：改善集中在头几天、随后回落到基线，且这是主观自评——` +
      `**疑似安慰剂 / 新奇效应**，不是稳定的真实效果。`;
    recommendation = '若要判断真效果：加入不做干预的对照周、盲化评分方式，并延长观察。';
  } else {
    honestReading =
      `这点变化（${round(Math.abs(improvement), 1)}${exp.metricUnit}）` +
      `小于你自己的日间波动（±${swing}${exp.metricUnit}）` +
      (regressionToMean ? '，而且你的基线本就在往这个方向走——更像均值回归。' : '，还分不清是信号还是噪声。') +
      ` **证据不足，先别下结论。**`;
    recommendation = '建议延长干预期或提高对比度（更彻底地执行/加大剂量），再重新读数。';
  }

  return {
    baselineMean: round(baselineMean, 1),
    baselineSD: round(baselineSD, 2),
    interventionMean: round(interventionMean, 1),
    improvement: round(improvement, 1),
    effectRatio: round(effectRatio, 2),
    reversalConsistent,
    regressionToMean,
    noveltyDecay,
    verdict,
    evidenceStrength,
    reasons,
    naiveReading,
    honestReading,
    recommendation,
  };
}

// —— 协议设计：从建议推导 n-of-1 实验协议（所需天数由指标噪声驱动的“功效精简版”）——
export interface Protocol {
  hypothesis: string;
  primaryMetric: string;
  designLabel: string;
  baselineDays: number;
  interventionDays: number;
  recommendedDays: number;
  successLine: string;
  confounders: string[];
  hold: string[];
}

export function designProtocol(exp: Experiment): Protocol {
  const offDays = exp.series.filter((p) => p.phase === 'off').length;
  const onDays = exp.series.filter((p) => p.phase === 'on').length;
  const baselineSD = sampleSD(vals(exp.series.filter((p) => p.phase === 'off')));

  // 简化“功效”估计：要可靠检出 minDetectable，所需天数随 (波动/最小效应)^2 上升。
  const ratio = exp.minDetectable > 0 ? baselineSD / exp.minDetectable : 1;
  const recommendedDays = clamp(Math.ceil(14 * ratio * ratio), 10, 42);

  const dirWord = exp.direction === 'higher-better' ? '升高' : '降低';

  return {
    hypothesis: `若「${exp.intervention}」，则「${exp.metricName}」会${dirWord}至少 ${exp.minDetectable}${exp.metricUnit}。`,
    primaryMetric: `${exp.metricName}（${exp.metricUnit}）——只盯这一个主指标，避免多重比较自欺。`,
    designLabel: exp.design === 'ABAB' ? 'ABAB 交替（可自我复现，最稳）' : 'AB 前后对照',
    baselineDays: offDays,
    interventionDays: onDays,
    recommendedDays,
    successLine: `干预期相对基线的改善需 ≥ ${exp.minDetectable}${exp.metricUnit}，且效应量（改善/基线波动）≥ 1.5 才算“有效”。`,
    confounders: exp.confounders,
    hold: exp.hold,
  };
}
