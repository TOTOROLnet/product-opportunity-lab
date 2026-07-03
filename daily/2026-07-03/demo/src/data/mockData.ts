import type { AgentAction, Policy } from '../types'

// All data below is mock, used only to demonstrate the Gavel experience.

export const initialActions: AgentAction[] = [
  {
    id: 'act-1041',
    agent: 'Billing Agent',
    title: '向客户 Acme Corp 退款 $4,200',
    risk: 'high',
    tool: 'stripe.refunds.create',
    payloadLang: 'json',
    payload: `{
  "charge": "ch_3Pb2...9aQ",
  "amount": 420000,
  "currency": "usd",
  "reason": "requested_by_customer",
  "customer": "cus_Acme_88"
}`,
    impact: {
      scope: '1 位客户 · 1 笔扣款',
      magnitude: '$4,200（本月第 2 笔大额退款）',
      reversible: '可撤销性低：退款一旦发起难以追回',
    },
    reasoning: [
      { label: '触发', detail: '客户在工单 #5521 中主张"重复扣费"。' },
      { label: '取证', detail: '查到同一发票号有两笔 charge，时间相差 3 秒。' },
      { label: '判断', detail: '判定为重复扣费，决定全额退第二笔。' },
      { label: '拟动作', detail: '对 ch_3Pb2...9aQ 发起 $4,200 退款。' },
    ],
    priors: [
      { date: '2026-06-28', verdict: 'approved', note: '同类重复扣费退款 $1,180，已批。' },
      { date: '2026-06-15', verdict: 'rejected', note: '$6,300 退款被拒：金额超过单笔上限，需财务复核。' },
    ],
    createdAt: '08:02',
    status: 'pending',
  },
  {
    id: 'act-1042',
    agent: 'Data Ops Agent',
    title: '删除 1,203 条 30 天未激活的试用账号',
    risk: 'critical',
    tool: 'postgres.query',
    payloadLang: 'sql',
    payload: `DELETE FROM users
WHERE plan = 'trial'
  AND last_active_at < NOW() - INTERVAL '30 days';`,
    impact: {
      scope: 'users 表 · 预计影响 1,203 行',
      magnitude: '占试用用户 8.7%',
      reversible: '不可逆：无软删除，无 WHERE 上限保护',
    },
    reasoning: [
      { label: '触发', detail: '每周"清理僵尸试用账号"任务。' },
      { label: '取数', detail: '统计到 1,203 条 30 天未活跃试用账号。' },
      { label: '拟动作', detail: '直接 DELETE 这些行以释放配额。' },
    ],
    priors: [
      { date: '2026-06-26', verdict: 'rejected', note: '同类批量删除被拒：应改为软删除/归档，而非物理删除。' },
    ],
    createdAt: '08:03',
    status: 'pending',
  },
  {
    id: 'act-1043',
    agent: 'Growth Agent',
    title: '向 8,400 名休眠用户群发召回邮件',
    risk: 'high',
    tool: 'resend.batch.send',
    payloadLang: 'json',
    payload: `{
  "template": "winback_v3",
  "segment": "dormant_90d",
  "recipients": 8400,
  "send_at": "2026-07-03T10:00:00+08:00"
}`,
    impact: {
      scope: '8,400 名收件人 · 单次群发',
      magnitude: '触达量为日常的 12 倍，可能影响送达率',
      reversible: '部分可逆：发出后无法召回，可暂停后续批次',
    },
    reasoning: [
      { label: '触发', detail: '月度休眠用户召回计划。' },
      { label: '选段', detail: '选中 90 天未登录用户 8,400 人。' },
      { label: '拟动作', detail: '用 winback_v3 模板一次性群发。' },
    ],
    priors: [
      { date: '2026-06-20', verdict: 'approved', note: '5,000 人召回群发已批，打开率 22%。' },
    ],
    createdAt: '08:05',
    status: 'pending',
  },
  {
    id: 'act-1044',
    agent: 'Support Agent',
    title: '把工单 #5533 标记为已解决并关闭',
    risk: 'medium',
    tool: 'zendesk.ticket.update',
    payloadLang: 'json',
    payload: `{
  "ticket": 5533,
  "status": "solved",
  "public_reply": "已为您重置密码，如仍有问题请回复。"
}`,
    impact: {
      scope: '1 个工单',
      magnitude: '低',
      reversible: '可逆：可重新打开工单',
    },
    reasoning: [
      { label: '触发', detail: '用户确认密码问题已解决。' },
      { label: '拟动作', detail: '回复并关闭工单。' },
    ],
    priors: [
      { date: '2026-07-01', verdict: 'approved', note: '同类低风险关单，已批。' },
    ],
    createdAt: '08:07',
    status: 'pending',
  },
]

export const initialPolicies: Policy[] = [
  {
    id: 'pol-1',
    rule: '单笔退款 > $5,000 一律需人工审批',
    mode: 'needs_approval',
    source: 'auto',
    origin: '源自 2026-06-15 对 $6,300 退款的拒绝',
  },
  {
    id: 'pol-2',
    rule: '不带 LIMIT 或软删除的批量 DELETE 一律拦截',
    mode: 'block',
    source: 'auto',
    origin: '源自 2026-06-26 对批量删除的拒绝',
  },
  {
    id: 'pol-3',
    rule: '低风险关单（zendesk.ticket.update → solved）自动放行',
    mode: 'auto_allow',
    source: 'manual',
    origin: '运营手动设置',
  },
]
