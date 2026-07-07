import type { ActionKind, Reversibility } from '../types'

export const kindLabel: Record<ActionKind, string> = {
  'file.write': '写文件',
  'file.delete': '删文件',
  'git.commit': 'git 提交',
  'git.push': 'git 推送',
  'git.force_push': 'git 强推',
  'shell.run': 'shell 命令',
  'db.migrate.additive': 'DB 迁移(加)',
  'db.migrate.destructive': 'DB 迁移(删)',
  'db.delete_rows': 'DB 删行',
  'http.get': 'HTTP GET',
  'http.post': 'HTTP POST',
  'message.send': '发消息',
  'deploy.release': '部署发布',
  'payment.charge': '扣款',
  'cloud.delete_resource': '销毁云资源',
}

export const kindIcon: Record<ActionKind, string> = {
  'file.write': '📝',
  'file.delete': '🗑️',
  'git.commit': '⎇',
  'git.push': '⇧',
  'git.force_push': '⚡',
  'shell.run': '⌘',
  'db.migrate.additive': '＋',
  'db.migrate.destructive': '⚠',
  'db.delete_rows': '➖',
  'http.get': '↓',
  'http.post': '↑',
  'message.send': '✉️',
  'deploy.release': '🚀',
  'payment.charge': '💳',
  'cloud.delete_resource': '☁',
}

export const reversibilityMeta: Record<
  Reversibility,
  { label: string; short: string; color: string }
> = {
  REVERSIBLE: { label: '可逆', short: '可干净回退', color: 'var(--ok)' },
  COMPENSABLE: { label: '可补偿', short: '有代价可退', color: 'var(--warn)' },
  IRREVERSIBLE: { label: '不可逆', short: '退不回来', color: 'var(--bad)' },
}
