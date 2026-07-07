import type { Scenario } from '../types'

// 5 hand-written agent-run action plans. Verdicts are NOT stored here — they are
// computed by src/logic/analyze.ts from each action's kind + flags.

export const scenarios: Scenario[] = [
  {
    id: 'local-refactor',
    name: '① 本地重构 + 提交',
    summary: 'coder agent 重构模块、跑测试、提交并推到自己的 feature 分支。全程可干净回退。',
    actions: [
      { id: 'a1', ts: 0, actor: 'coder', kind: 'file.write', target: 'src/auth/session.ts' },
      { id: 'a2', ts: 1200, actor: 'coder', kind: 'file.write', target: 'src/auth/token.ts' },
      { id: 'a3', ts: 2600, actor: 'coder', kind: 'shell.run', target: 'npm test', detail: 'readonly' },
      { id: 'a4', ts: 5200, actor: 'coder', kind: 'git.commit', target: 'refactor: extract token store' },
      { id: 'a5', ts: 6000, actor: 'coder', kind: 'git.push', target: 'feature/token-store', shared: false },
    ],
  },
  {
    id: 'ship-release',
    name: '② 发布上线',
    summary: 'release agent 加一列、部署新版本、跑健康检查。全部可退，但撤销有代价（停机 / 抖动）。',
    actions: [
      { id: 'b1', ts: 0, actor: 'release', kind: 'db.migrate.additive', target: 'orders.add_column(coupon_id)' },
      { id: 'b2', ts: 3000, actor: 'release', kind: 'deploy.release', target: 'checkout-svc v2.4.0', shared: true },
      { id: 'b3', ts: 9000, actor: 'release', kind: 'http.get', target: 'GET /healthz' },
      { id: 'b4', ts: 9500, actor: 'release', kind: 'git.push', target: 'main (release tag)', shared: true },
    ],
  },
  {
    id: 'db-cleanup',
    name: '③ 数据库清理',
    summary: 'cleanup agent 清理"过期"数据：删行 + 删列，均无备份。经典的不可逆事故。',
    actions: [
      { id: 'c1', ts: 0, actor: 'cleanup', kind: 'file.write', target: 'scripts/cleanup.sql' },
      { id: 'c2', ts: 900, actor: 'cleanup', kind: 'db.delete_rows', target: 'events WHERE ts < 90d', hasBackup: false },
      { id: 'c3', ts: 4000, actor: 'cleanup', kind: 'db.migrate.destructive', target: 'users.drop_column(legacy_addr)', hasBackup: false },
      { id: 'c4', ts: 7000, actor: 'cleanup', kind: 'git.commit', target: 'chore: prune legacy data' },
    ],
  },
  {
    id: 'refund-flow',
    name: '④ 客户退款自动化',
    summary: 'support agent 拉订单、发起退款、群发确认邮件。看似"帮客户"，却有不可逆的尾巴。',
    actions: [
      { id: 'd1', ts: 0, actor: 'support', kind: 'http.get', target: 'GET /orders?status=dispute' },
      { id: 'd2', ts: 1500, actor: 'support', kind: 'payment.charge', target: 'refund #INV-8842 ($129)' },
      { id: 'd3', ts: 4200, actor: 'support', kind: 'http.post', target: 'POST /crm/ticket/close', detail: 'has-compensation' },
      { id: 'd4', ts: 6000, actor: 'support', kind: 'message.send', target: '批量退款确认邮件 → 312 位客户' },
    ],
  },
  {
    id: 'cost-cleanup',
    name: '⑤ 清理云资源省成本',
    summary: 'finops agent 为省钱销毁"闲置"资源并强推清理历史。无备份 → 灾难级不可逆。',
    actions: [
      { id: 'e1', ts: 0, actor: 'finops', kind: 'http.get', target: 'GET /billing/idle-resources' },
      { id: 'e2', ts: 2000, actor: 'finops', kind: 'cloud.delete_resource', target: 'terminate rds:staging-db', hasBackup: false },
      { id: 'e3', ts: 5000, actor: 'finops', kind: 'shell.run', target: 'rm -rf /var/snapshots/*', detail: 'destructive', snapshot: false },
      { id: 'e4', ts: 8000, actor: 'finops', kind: 'git.force_push', target: 'main (squash history)', shared: true },
    ],
  },
]
