import type { Intent } from '../types';

// ~11 条真实 Agent 意图。keywords 是「用户话」被检索器捕捉到的关键词。
// correctToolId 是这条意图真正该落到的那个工具。
export const INTENTS: Intent[] = [
  {
    id: 'i1', family: '通知', text: '通知值班同事：部署已完成',
    keywords: ['通知', '值班', '消息'],
    correctToolId: 'slack.send_dm',
    note: '想私信提醒值班的那位同事，不该在全员频道公开广播。',
  },
  {
    id: 'i2', family: '删除', text: '把这条测试记录删掉',
    keywords: ['删除', '记录', '数据'],
    correctToolId: 'postgres-staging.delete_record',
    note: '删的是测试数据，绝不该落到生产库。',
  },
  {
    id: 'i3', family: '邮件', text: '给客户发一封订单确认邮件',
    keywords: ['邮件', '确认', '订单', '客户'],
    correctToolId: 'email.send_transactional',
    note: '一对一的订单确认，不是群发营销。',
  },
  {
    id: 'i4', family: '建条目', text: '在项目看板里给这个 bug 建一张任务卡',
    keywords: ['创建', '任务', 'bug', '看板'],
    correctToolId: 'jira.create_issue',
    note: 'github 与 jira 都能建条目——语义等价，需团队指定首选追踪器。',
  },
  {
    id: 'i5', family: '查询', text: '查一下上个季度的订单金额数据',
    keywords: ['查询', '数据', '金额'],
    correctToolId: 'stripe.list_payments',
    note: '金额在支付系统里，却被一堆通用 search/query 工具淹没。',
  },
  {
    id: 'i6', family: '文件', text: '把这份设计稿存到项目文件夹',
    keywords: ['保存', '文件', '文件夹'],
    correctToolId: 'filesystem.write_file',
    note: '普通的写文件，工具面里本就清晰。',
  },
  {
    id: 'i7', family: '日程', text: '取消我明天下午的那个会议活动',
    keywords: ['取消', '会议', '日程', '活动'],
    correctToolId: 'calendar.cancel_event',
    note: '取消并通知参会人，而不是彻底删除、谁都不知道。',
  },
  {
    id: 'i8', family: '代码', text: '把这个功能分支合并到主干',
    keywords: ['合并', '分支', '主干'],
    correctToolId: 'github.merge_pr',
    note: '正常的 PR 合并，工具面里本就清晰。',
  },
  {
    id: 'i9', family: '记录', text: '记录一下这次事故的复盘',
    keywords: ['记录', '事故', '复盘'],
    correctToolId: 'notion.create_page',
    note: '写一篇复盘文档，不是去开一个真实事故、把值班呼起来。',
  },
  {
    id: 'i10', family: '权限', text: '给这位新同事开通仓库的只读权限',
    keywords: ['权限', '只读', '仓库'],
    correctToolId: 'github.grant_read_access',
    note: '只读就够了，绝不是管理员。',
  },
  {
    id: 'i11', family: '财务', text: '导出本月的发票给财务',
    keywords: ['导出', '发票', '财务'],
    correctToolId: 'stripe.export_invoices',
    note: '导出发票，工具面里本就清晰。',
  },
];
