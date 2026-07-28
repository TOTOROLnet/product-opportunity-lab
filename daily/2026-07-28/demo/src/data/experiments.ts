import type { Experiment, DailyPoint } from '../types';

// —— 全部为 mock 数据，仅用于演示读数引擎；不来自任何真实个人健康记录 ——

function seq(
  values: number[],
  phase: DailyPoint['phase'],
  startDay: number,
  block?: DailyPoint['block'],
): DailyPoint[] {
  return values.map((value, i) => ({ day: startDay + i, value, phase, block }));
}

// 实验① 少吃夜宵 → 静息心率↓（objective, AB）
// 结论目标：数据不足 / 疑似均值回归。
// 基线 10 天本就从 ~64 一路降到 ~55（干预前趋势已下行）；干预期均值仅比基线低 2.0bpm，小于基线日间波动。
const exp1Baseline = [64, 63, 61, 60, 59, 58, 57, 56, 57, 55]; // mean 59.0
const exp1Intervention = [58, 57, 56, 57, 58, 57, 58, 56, 57, 56]; // mean 57.0

// 实验② 睡前补镁 → 深睡时长↑（objective, ABAB）
// 结论目标：有效（中等偏上）。补→停→补→停，深睡在“补”段 ~79min、“停”段回落 ~62min，两轮复现。
const exp2A1 = [55, 68, 60, 64, 63]; // mean 62.0（off）
const exp2B1 = [74, 82, 78, 80, 79]; // mean 78.6（on）
const exp2A2 = [58, 70, 61, 66, 60]; // mean 63.0（off）
const exp2B2 = [81, 77, 83, 80, 79]; // mean 80.0（on）

// 实验③ 冷水澡 → 主观精力↑（subjective, AB）
// 结论目标：疑似安慰剂 / 新奇效应。第 1 周 +1.2，到第 3 周回落至基线；未盲、主观。
const exp3Baseline = [3.0, 3.2, 2.8, 3.1, 3.0, 2.9, 3.0]; // mean 3.0
const exp3Intervention = [
  4.2, 4.3, 4.0, 4.4, 4.1, 4.2, 4.3, // 第 1 周 mean 4.214
  3.6, 3.5, 3.7, 3.4, 3.5, 3.6, 3.4, // 第 2 周 mean 3.529
  3.1, 3.0, 3.2, 2.9, 3.1, 3.0, 3.0, // 第 3 周 mean 3.043
];

export const EXPERIMENTS: Experiment[] = [
  {
    id: 'exp1',
    suggestion: '你最近静息心率偏高，试试少吃夜宵（22:00 后不进食）。',
    source: 'Illume 主动推送',
    intervention: '连续 10 天 22:00 后不进食',
    metricName: '静息心率',
    metricUnit: 'bpm',
    metricType: 'objective',
    direction: 'lower-better',
    design: 'AB',
    minDetectable: 3,
    confounders: ['饮酒', '训练强度', '室温', '入睡时间'],
    hold: ['固定起床时间', '不改动训练计划', '不同时改咖啡因摄入'],
    series: [
      ...seq(exp1Baseline, 'off', 1),
      ...seq(exp1Intervention, 'on', 11),
    ],
  },
  {
    id: 'exp2',
    suggestion: '你的深睡时长偏短，可以试试睡前补充镁。',
    source: 'ChatGPT Health 建议',
    intervention: '睡前 30 分钟服用甘氨酸镁（ABAB：补 5 天 / 停 5 天 / 补 5 天 / 停 5 天）',
    metricName: '深睡时长',
    metricUnit: 'min',
    metricType: 'objective',
    direction: 'higher-better',
    design: 'ABAB',
    minDetectable: 10,
    confounders: ['酒精', '屏幕使用', '卧室温度', '压力'],
    hold: ['固定就寝/起床时间', '不同时改动其他补剂', '周末作息一致'],
    series: [
      ...seq(exp2A1, 'off', 1, 'A1'),
      ...seq(exp2B1, 'on', 6, 'B1'),
      ...seq(exp2A2, 'off', 11, 'A2'),
      ...seq(exp2B2, 'on', 16, 'B2'),
    ],
  },
  {
    id: 'exp3',
    suggestion: '想更有精神？试试每天早上冲个冷水澡吧。',
    source: '养生社群转发',
    intervention: '连续 21 天早晨冷水澡 60 秒',
    metricName: '主观精力自评',
    metricUnit: '分(1–5)',
    metricType: 'subjective',
    direction: 'higher-better',
    design: 'AB',
    minDetectable: 0.5,
    confounders: ['期待/心理暗示', '天气', '睡眠', '工作压力'],
    hold: ['固定评分时间', '同一评分量表'],
    series: [
      ...seq(exp3Baseline, 'off', 1),
      ...seq(exp3Intervention, 'on', 8),
    ],
  },
];
