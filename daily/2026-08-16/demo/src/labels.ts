// ---- 中文标签映射（UI 展示用） ----
import type { DataClass, Decision, RulePref, Scope, ToolCategory } from './types';

export const CAT_LABEL: Record<ToolCategory, string> = {
  shell: 'Shell',
  git: 'Git',
  fs: '文件系统',
  cloud: '云资源',
  db: '数据库',
  net: '网络出站',
  comms: '外发触达',
  payment: '支付',
};

export const CAT_EMOJI: Record<ToolCategory, string> = {
  shell: '💻',
  git: '🔀',
  fs: '📁',
  cloud: '☁️',
  db: '🗄️',
  net: '🌐',
  comms: '📣',
  payment: '💳',
};

export const SCOPE_LABEL: Record<Scope, string> = {
  local: '本地',
  staging: '预发',
  prod: '生产',
  external: '外部',
};

export const DATA_LABEL: Record<DataClass, string> = {
  none: '无数据',
  internal: '内部',
  pii: 'PII',
  secret: '密钥',
};

export const DEC_LABEL: Record<Decision, string> = {
  allow: '放行',
  review: '人审',
  deny: '否决',
};

export const DEC_EMOJI: Record<Decision, string> = {
  allow: '✅',
  review: '🙋',
  deny: '⛔',
};

export const RULE_LABEL: Record<RulePref, string> = {
  inherit: '跟随全局',
  allow: '放行',
  review: '人审',
  deny: '否决',
};
