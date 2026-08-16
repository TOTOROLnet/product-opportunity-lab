// ---- 全 mock 数据：12 条 agent 拟执行动作 + 3 套预设护栏策略 ----
// 所有属性（可逆性 / 数据敏感度 / 影响面 / 基础风险）均为人工标注，不接真实 agent trace / LLM。

import type { Action, Policy, ToolCategory } from '../types';

const allInherit: Record<ToolCategory, 'inherit'> = {
  shell: 'inherit',
  git: 'inherit',
  fs: 'inherit',
  cloud: 'inherit',
  db: 'inherit',
  net: 'inherit',
  comms: 'inherit',
  payment: 'inherit',
};

/** 一份真实感的「agent 拟执行动作」语料：含安全项与高危不可逆项，覆盖 8 类工具。 */
export const ACTIONS: Action[] = [
  {
    id: 'a01',
    agent: 'ops-agent',
    title: 'tail -n 200 /var/log/app.log',
    category: 'shell',
    scope: 'prod',
    reversible: true,
    dataClass: 'internal',
    intent: '排查线上 5xx，读取最近 200 行应用日志。',
    riskBase: 1,
    emoji: '💻',
  },
  {
    id: 'a02',
    agent: 'release-bot',
    title: 'rm -rf /srv/app/releases/2026-08-16',
    category: 'shell',
    scope: 'prod',
    reversible: false,
    dataClass: 'none',
    intent: '清理本次发布产物目录以回收磁盘。',
    riskBase: 4,
    emoji: '💻',
  },
  {
    id: 'a03',
    agent: 'coder-01',
    title: 'gh pr create --draft "fix: null guard"',
    category: 'git',
    scope: 'staging',
    reversible: true,
    dataClass: 'internal',
    intent: '把修复推成 draft PR，等人 review。',
    riskBase: 1,
    emoji: '🔀',
  },
  {
    id: 'a04',
    agent: 'coder-01',
    title: 'git push --force origin main',
    category: 'git',
    scope: 'prod',
    reversible: false,
    dataClass: 'internal',
    intent: '强推重写 main 历史以「整理」提交。',
    riskBase: 4,
    emoji: '🔀',
  },
  {
    id: 'a05',
    agent: 'ops-agent',
    title: 'write config/app.staging.yaml',
    category: 'fs',
    scope: 'staging',
    reversible: true,
    dataClass: 'internal',
    intent: '更新预发环境的功能开关配置。',
    riskBase: 2,
    emoji: '📁',
  },
  {
    id: 'a06',
    agent: 'data-agent',
    title: 'DROP TABLE analytics_events;',
    category: 'db',
    scope: 'prod',
    reversible: false,
    dataClass: 'internal',
    intent: '「重建」埋点表，先删旧表。',
    riskBase: 5,
    emoji: '🗄️',
  },
  {
    id: 'a07',
    agent: 'data-agent',
    title: 'export users(email,phone) → s3://ext-bucket',
    category: 'db',
    scope: 'external',
    reversible: true,
    dataClass: 'pii',
    intent: '把用户联系方式导出到外部分析桶。',
    riskBase: 4,
    emoji: '🗄️',
  },
  {
    id: 'a08',
    agent: 'ops-agent',
    title: 'kubectl scale deploy/web --replicas=6',
    category: 'cloud',
    scope: 'prod',
    reversible: true,
    dataClass: 'internal',
    intent: '应对流量高峰，把 web 扩到 6 副本。',
    riskBase: 2,
    emoji: '☁️',
  },
  {
    id: 'a09',
    agent: 'ops-agent',
    title: 'aws s3 rb s3://prod-user-uploads --force',
    category: 'cloud',
    scope: 'prod',
    reversible: false,
    dataClass: 'pii',
    intent: '「清理无用桶」，删除生产用户上传桶。',
    riskBase: 5,
    emoji: '☁️',
  },
  {
    id: 'a10',
    agent: 'support-agent',
    title: 'stripe refund $420.00 (charge ch_9x)',
    category: 'payment',
    scope: 'external',
    reversible: false,
    dataClass: 'internal',
    intent: '按工单给用户退款 420 美元。',
    riskBase: 3,
    emoji: '💳',
  },
  {
    id: 'a11',
    agent: 'support-agent',
    title: 'email blast → all 48k users',
    category: 'comms',
    scope: 'external',
    reversible: false,
    dataClass: 'pii',
    intent: '给全体用户群发一封「服务恢复」通知。',
    riskBase: 3,
    emoji: '📣',
  },
  {
    id: 'a12',
    agent: 'coder-01',
    title: 'POST $STRIPE_KEY → hooks.example.dev',
    category: 'net',
    scope: 'external',
    reversible: false,
    dataClass: 'secret',
    intent: '把密钥发到「调试 webhook」验证连通性。',
    riskBase: 5,
    emoji: '🌐',
  },
];

// ---- 三套预设护栏策略 ----

export const LOOSE: Policy = {
  preset: 'loose',
  defaultForUnmatched: 'allow',
  requireHumanForIrreversible: false,
  requireHumanForProd: false,
  blockSecretExfil: false,
  maxAutoRisk: 5,
  reviewBudget: 3,
  categoryRules: { ...allInherit },
};

export const BALANCED: Policy = {
  preset: 'balanced',
  defaultForUnmatched: 'allow',
  requireHumanForIrreversible: true,
  requireHumanForProd: false,
  blockSecretExfil: true,
  maxAutoRisk: 3,
  reviewBudget: 5,
  categoryRules: { ...allInherit, payment: 'review', comms: 'review' },
};

export const STRICT: Policy = {
  preset: 'strict',
  defaultForUnmatched: 'deny',
  requireHumanForIrreversible: true,
  requireHumanForProd: true,
  blockSecretExfil: true,
  maxAutoRisk: 2,
  reviewBudget: 8,
  categoryRules: { ...allInherit, payment: 'deny', comms: 'review', db: 'review' },
};

export const PRESETS: Record<'loose' | 'balanced' | 'strict', Policy> = {
  loose: LOOSE,
  balanced: BALANCED,
  strict: STRICT,
};

export const PRESET_LABEL: Record<'loose' | 'balanced' | 'strict', string> = {
  loose: '宽松',
  balanced: '均衡',
  strict: '严格',
};

/** before/after 对比恒以「宽松基线」为参照。 */
export const BASELINE: Policy = LOOSE;

export function clonePolicy(p: Policy): Policy {
  return { ...p, categoryRules: { ...p.categoryRules } };
}
