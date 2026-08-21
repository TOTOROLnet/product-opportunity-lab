import type { ItemType, FoldState, Severity } from './types';

export const TYPE_LABEL: Record<ItemType, string> = {
  user_constraint: '用户硬约束',
  decision: '已定方案',
  file_ref: '文件引用',
  error_learned: '踩坑经验',
  todo: '待办',
  chatter: '过程闲聊',
};

export const TYPE_ICON: Record<ItemType, string> = {
  user_constraint: '🔒',
  decision: '🧭',
  file_ref: '📄',
  error_learned: '🩹',
  todo: '☑️',
  chatter: '💬',
};

export const FOLD_LABEL: Record<FoldState, string> = {
  kept: '保留',
  lossy: '有损压缩',
  dropped: '丢弃',
};

export const SEVERITY_LABEL: Record<Severity, string> = {
  fatal: '致命 · 任务失败',
  rework: '返工 · 绕路重做',
};

export function riskTier(risk: number): { label: string; tone: 'low' | 'mid' | 'high' } {
  if (risk >= 60) return { label: '高危', tone: 'high' };
  if (risk >= 25) return { label: '中危', tone: 'mid' };
  return { label: '低危', tone: 'low' };
}

export function fmtTokens(n: number): string {
  if (Math.abs(n) >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return `${n}`;
}
