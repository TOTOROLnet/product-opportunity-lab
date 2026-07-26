// 一次「跑在 OpenComputer 式可续跑运行时上的数据分析 agent 会话」的 mock 事件日志与汇总统计。
// 全部为演示用数据，不代表真实统计推断。

import type { Decisions, MetricColumn, MetricStat } from '../types';

export const GOAL = {
  metric: 'retained_d7' as MetricColumn,
  metricLabel: 'D7 留存（新用户 7 日留存）',
  alpha: 0.05,
  window: '2026-07-01 ~ 2026-07-14',
  question: '改版后新用户 D7 留存是否显著提升？是否全量上线？',
};

// mock 汇总统计（演示用）：改版只提升了 D1（新鲜感效应），未提升目标 D7。
export const STATS: Record<MetricColumn, MetricStat> = {
  retained: { control: 0.33, redesign: 0.41, p: 0.008 }, // 实为 D1 留存
  retained_d7: { control: 0.25, redesign: 0.24, p: 0.62 }, // 目标 D7 留存
};

export const COLUMN_LABEL: Record<MetricColumn, string> = {
  retained: 'retained（实为 D1 留存）',
  retained_d7: 'retained_d7（D7 留存＝目标指标）',
};

export const BASE_ROWS = 5000;

export const DROPPED: Record<Decisions['dropRule'], number> = {
  strict: 120, // 丢弃所有缺失/异常行（2.4%）
  lenient: 20, // 仅丢弃真正空行、回收可修复行（0.4%）
};

// 会话默认（含缺陷）决策：把 D1 当成了 D7。
export const DEFAULT_DECISIONS: Decisions = {
  metricColumn: 'retained',
  dropRule: 'strict',
};

export interface StepMeta {
  seq: number;
  action: string;
  reads: string[];
  decisionKey?: keyof Decisions;
}

// 9 步会话事件日志（动作与读入为静态元数据；写出/摘要/不变量由 engine 依决策复算）。
export const STEPS: StepMeta[] = [
  { seq: 1, action: '载入实验配置', reads: ['task.goal', 'exp.config'] },
  { seq: 2, action: '拉取新用户明细', reads: ['db.users'] },
  { seq: 3, action: '过滤实验窗口 & 清洗脏数据', reads: ['users.raw'], decisionKey: 'dropRule' },
  { seq: 4, action: '按 variant 分组', reads: ['users.clean'] },
  { seq: 5, action: '选择留存指标列', reads: ['schema.columns', 'task.goal'], decisionKey: 'metricColumn' },
  { seq: 6, action: '计算两组留存率', reads: ['groups', 'metric.column'] },
  { seq: 7, action: '做显著性检验', reads: ['rates'] },
  { seq: 8, action: '生成摘要与图表', reads: ['rates', 'sig'] },
  { seq: 9, action: '得出上线建议', reads: ['summary'] },
];

export const SESSION_META = {
  id: 'sess_9f3a-retention-ab',
  runtime: 'OpenComputer 式托管运行时（事件日志可从任意 seq 续跑/分叉）',
  agent: '数据分析 agent',
  durationMin: 42,
};
