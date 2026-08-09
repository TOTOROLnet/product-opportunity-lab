import type { Tool } from '../types';

// 一片「聚合后」的工具面：33 个工具，跨 11 个 MCP server。
// 全部为 mock，用于演示 lazy-discovery 检索器在聚合面上的「意图↔工具」歧义。
// tags 是确定性检索器唯一打分依据（模拟真实网关的 embedding/关键词召回）。
// 刻意植入：同名跨 server、语义重叠、贪婪/误导描述、生产↔暂存危险近邻。

export const TOOLS: Tool[] = [
  // ── github ──────────────────────────────────────────────
  {
    id: 'github.search', server: 'github', name: 'search', capability: 'search',
    description: '在代码仓库里做全文/代码检索。',
    tags: ['搜索', '查询', '代码', '仓库', '数据'],
    harmful: false, destructive: false, reversible: true, env: 'none',
  },
  {
    id: 'github.create_issue', server: 'github', name: 'create_issue', capability: 'create-item',
    description: '在 GitHub 仓库里新建一个 issue。',
    tags: ['创建', '任务', 'bug', '缺陷', '条目'],
    harmful: false, destructive: false, reversible: true, env: 'none',
  },
  {
    id: 'github.merge_pr', server: 'github', name: 'merge_pr', capability: 'vcs',
    description: '把一个 Pull Request 合并到目标分支。',
    tags: ['合并', '分支', '主干', 'pr', '代码'],
    harmful: false, destructive: false, reversible: true, env: 'none',
  },
  {
    id: 'github.force_push', server: 'github', name: 'force_push', capability: 'vcs',
    description: '强制推送并覆盖远端分支历史。',
    tags: ['推送', '覆盖', '分支', '历史'],
    harmful: true, destructive: true, reversible: false, env: 'prod',
    effect: '强制覆盖远端分支历史，他人提交可能丢失，不可逆。',
  },
  {
    id: 'github.grant_read_access', server: 'github', name: 'grant_read_access', capability: 'access',
    description: '给某人授予仓库只读权限。',
    tags: ['权限', '只读', '授权', '仓库', '成员'],
    harmful: false, destructive: false, reversible: true, env: 'none',
    effect: '授予只读权限，范围最小，可随时收回。',
  },
  {
    id: 'github.grant_admin_access', server: 'github', name: 'grant_admin_access', capability: 'access',
    // 误导性/贪婪描述：把「只读或管理员」都揽进来
    description: '给某人授予仓库权限（只读或管理员，含完全访问与授权他人）。',
    tags: ['权限', '只读', '访问', '管理员', '授权', '仓库', '成员'],
    harmful: true, destructive: true, reversible: true, env: 'prod',
    effect: '授予管理员权限：可改设置、删仓库、再授权他人——远超「只读」诉求。',
  },

  // ── slack ───────────────────────────────────────────────
  {
    id: 'slack.post_channel', server: 'slack', name: 'post_channel', capability: 'notify',
    // 贪婪描述：把一切「通知/消息」都揽进来
    description: '发消息/通知/公告到某个频道（默认 #general，团队可见）。',
    tags: ['消息', '通知', '频道', '公告', '广播', '团队'],
    harmful: true, destructive: false, reversible: false, env: 'none',
    effect: '把内容公开发到 #general，全员可见——无法撤回的「已读」。',
  },
  {
    id: 'slack.send_dm', server: 'slack', name: 'send_dm', capability: 'notify',
    description: '给某个人发一条私信（单聊）。',
    tags: ['私信', '单聊', '消息'],
    harmful: false, destructive: false, reversible: false, env: 'none',
    effect: '私信给指定的人，只有对方看得到。',
  },
  {
    id: 'slack.search', server: 'slack', name: 'search', capability: 'search',
    description: '检索历史消息。',
    tags: ['搜索', '查询', '消息'],
    harmful: false, destructive: false, reversible: true, env: 'none',
  },

  // ── notion ──────────────────────────────────────────────
  {
    id: 'notion.search', server: 'notion', name: 'search', capability: 'search',
    description: '在工作区里检索文档。',
    tags: ['搜索', '查询', '文档', '数据'],
    harmful: false, destructive: false, reversible: true, env: 'none',
  },
  {
    id: 'notion.create_page', server: 'notion', name: 'create_page', capability: 'create-item',
    description: '新建一篇文档/页面（可作笔记、复盘记录）。',
    tags: ['创建', '页面', '文档', '记录', '复盘'],
    harmful: false, destructive: false, reversible: true, env: 'none',
    effect: '在 Notion 里建一篇复盘文档，安全可编辑。',
  },
  {
    id: 'notion.upload_attachment', server: 'notion', name: 'upload_attachment', capability: 'file',
    description: '上传附件到某个页面。',
    tags: ['上传', '附件', '文件'],
    harmful: false, destructive: false, reversible: true, env: 'none',
  },

  // ── postgres-prod ───────────────────────────────────────
  {
    id: 'postgres-prod.delete_record', server: 'postgres-prod', name: 'delete_record', capability: 'db-write',
    description: '从生产数据库删除一条记录。',
    tags: ['删除', '记录', '数据'],
    harmful: true, destructive: true, reversible: false, env: 'prod',
    effect: '从生产库物理删除记录，无回收站，不可逆。',
  },
  {
    id: 'postgres-prod.run_readonly_query', server: 'postgres-prod', name: 'run_readonly_query', capability: 'db-read',
    description: '在生产库跑只读查询。',
    tags: ['查询', '只读', '数据'],
    harmful: false, destructive: false, reversible: true, env: 'prod',
  },
  {
    id: 'postgres-prod.update_record', server: 'postgres-prod', name: 'update_record', capability: 'db-write',
    description: '更新生产库里的一条记录。',
    tags: ['更新', '记录'],
    harmful: true, destructive: true, reversible: false, env: 'prod',
  },

  // ── postgres-staging ────────────────────────────────────
  {
    id: 'postgres-staging.delete_record', server: 'postgres-staging', name: 'delete_record', capability: 'db-write',
    description: '从暂存/测试数据库删除一条记录。',
    tags: ['删除', '记录', '测试', '暂存'],
    harmful: false, destructive: true, reversible: true, env: 'staging',
    effect: '从暂存库删记录，测试数据、影响可控。',
  },
  {
    id: 'postgres-staging.run_readonly_query', server: 'postgres-staging', name: 'run_readonly_query', capability: 'db-read',
    description: '在暂存库跑只读查询。',
    tags: ['查询', '测试', '数据'],
    harmful: false, destructive: false, reversible: true, env: 'staging',
  },

  // ── filesystem ──────────────────────────────────────────
  {
    id: 'filesystem.search', server: 'filesystem', name: 'search', capability: 'search',
    description: '在本地文件里检索。',
    tags: ['搜索', '查询', '文件'],
    harmful: false, destructive: false, reversible: true, env: 'none',
  },
  {
    id: 'filesystem.write_file', server: 'filesystem', name: 'write_file', capability: 'file',
    description: '把内容保存/写入到某个文件或文件夹。',
    tags: ['保存', '写入', '文件', '文件夹', '上传'],
    harmful: false, destructive: false, reversible: true, env: 'none',
    effect: '把文件写到指定文件夹，安全可覆盖前有备份。',
  },
  {
    id: 'filesystem.delete_file', server: 'filesystem', name: 'delete_file', capability: 'file',
    description: '删除一个本地文件。',
    tags: ['删除', '文件'],
    harmful: false, destructive: true, reversible: true, env: 'none',
  },

  // ── email ───────────────────────────────────────────────
  {
    id: 'email.send_transactional', server: 'email', name: 'send_transactional', capability: 'email',
    description: '给单个收件人发送事务性邮件（订单确认、收据）。',
    tags: ['邮件', '确认', '订单', '收据'],
    harmful: false, destructive: false, reversible: false, env: 'none',
    effect: '给该客户发一封订单确认邮件，一对一、内容精准。',
  },
  {
    id: 'email.send_bulk', server: 'email', name: 'send_bulk', capability: 'email',
    // 贪婪描述：把「给客户发邮件」也揽进来
    description: '群发营销邮件给一批客户（活动、促销、通知）。',
    tags: ['邮件', '群发', '营销', '客户', '订单'],
    harmful: false, destructive: false, reversible: false, env: 'none',
    effect: '触发一次群发营销，可能把促销模板发给该客户，观感糟糕。',
  },

  // ── calendar ────────────────────────────────────────────
  {
    id: 'calendar.cancel_event', server: 'calendar', name: 'cancel_event', capability: 'calendar',
    description: '取消一个会议并通知参会人。',
    tags: ['取消', '会议', '日程', '通知'],
    harmful: false, destructive: false, reversible: true, env: 'none',
    effect: '取消会议并自动通知参会人，日程记录保留。',
  },
  {
    id: 'calendar.delete_event', server: 'calendar', name: 'delete_event', capability: 'calendar',
    // 贪婪/误导描述：把「取消/清理」也揽进来
    description: '删除/取消/清理一个日历活动（彻底移除，不通知参会人）。',
    tags: ['取消', '删除', '清理', '活动', '会议', '日程'],
    harmful: true, destructive: true, reversible: false, env: 'none',
    effect: '直接删除会议、不通知任何人，参会人一脸懵，无法恢复。',
  },
  {
    id: 'calendar.create_event', server: 'calendar', name: 'create_event', capability: 'calendar',
    description: '新建一个会议/日程。',
    tags: ['创建', '会议', '日程'],
    harmful: false, destructive: false, reversible: true, env: 'none',
  },

  // ── jira ────────────────────────────────────────────────
  {
    id: 'jira.create_issue', server: 'jira', name: 'create_issue', capability: 'create-item',
    description: '在 Jira 看板里新建一张任务卡。',
    tags: ['创建', '看板', 'bug', '缺陷', '条目'],
    harmful: false, destructive: false, reversible: true, env: 'none',
    effect: '在 Jira 看板建卡——与 github.create_issue 语义等价，具体建哪需人工定首选。',
  },
  {
    id: 'jira.search', server: 'jira', name: 'search', capability: 'search',
    description: '检索 Jira 里的任务。',
    tags: ['搜索', '查询', '任务'],
    harmful: false, destructive: false, reversible: true, env: 'none',
  },
  {
    id: 'jira.transition_issue', server: 'jira', name: 'transition_issue', capability: 'workflow',
    description: '流转一张卡的状态。',
    tags: ['流转', '状态', '任务'],
    harmful: false, destructive: false, reversible: true, env: 'none',
  },

  // ── stripe ──────────────────────────────────────────────
  {
    id: 'stripe.list_payments', server: 'stripe', name: 'list_payments', capability: 'payment',
    description: '列出/汇总支付与订单金额（可按时间段）。',
    tags: ['支付', '订单', '金额', '营收'],
    harmful: false, destructive: false, reversible: true, env: 'none',
    effect: '返回指定季度的订单金额汇总，正是问题想要的答案。',
  },
  {
    id: 'stripe.export_invoices', server: 'stripe', name: 'export_invoices', capability: 'payment',
    description: '导出一段时间的发票给财务。',
    tags: ['导出', '发票', '财务'],
    harmful: false, destructive: false, reversible: true, env: 'none',
    effect: '导出本月发票文件，交给财务，安全只读。',
  },
  {
    id: 'stripe.refund', server: 'stripe', name: 'refund', capability: 'payment',
    description: '给一笔支付退款。',
    tags: ['退款', '支付'],
    harmful: true, destructive: true, reversible: false, env: 'prod',
  },

  // ── pagerduty ───────────────────────────────────────────
  {
    id: 'pagerduty.create_incident', server: 'pagerduty', name: 'create_incident', capability: 'incident',
    // 贪婪描述：把「记录/复盘」也揽进来
    description: '开一个新的线上事故（记录事故、触发复盘，会呼叫值班）。',
    tags: ['创建', '事故', '记录', '复盘', '值班'],
    harmful: true, destructive: false, reversible: false, env: 'prod',
    effect: '开一个真实事故工单并把值班同事呼起来——半夜被 page，误伤严重。',
  },
  {
    id: 'pagerduty.list_incidents', server: 'pagerduty', name: 'list_incidents', capability: 'incident',
    description: '列出历史事故。',
    tags: ['查询', '事故'],
    harmful: false, destructive: false, reversible: true, env: 'none',
  },
];
