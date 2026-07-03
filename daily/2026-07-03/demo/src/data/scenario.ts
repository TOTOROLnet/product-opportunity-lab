import type { Scenario } from '../types';

// —— 演示场景：一个"客服自动化 Agent"被授予了 5 个工具，可触达 2 个数据源、3 个外部/系统副作用汇。
// 所有拓扑、策略与敏感度均为 mock，用于展示"权限组合涌现风险"，不代表任何真实产品。

const COL_SOURCE = 90;
const COL_TOOL = 400;
const COL_SINK = 720;

export const scenario: Scenario = {
  agentName: '客服自动化 Agent',
  agentDesc:
    '一个帮客服团队自动处理工单的 Agent：能查客户信息、按判断改数据、回邮件、发退款、同步 Slack。上线前想知道这组权限的"爆炸半径"。',

  nodes: [
    // —— 数据源（左列）——
    {
      id: 'customer_db',
      label: '客户数据库',
      kind: 'source',
      sensitivity: 'pii',
      x: COL_SOURCE,
      y: 90,
      desc: '含姓名、邮箱、地址、消费记录等个人可识别信息（PII）。高敏。',
    },
    {
      id: 'internal_docs',
      label: '内部知识库',
      kind: 'source',
      sensitivity: 'internal',
      x: COL_SOURCE,
      y: 300,
      desc: '内部 SOP、话术、定价策略等。中敏，仅限内部。',
    },

    // —— 工具（中列）——
    {
      id: 'sql_read',
      label: '只读 SQL',
      kind: 'tool',
      capability: 'read',
      reversibility: 'yes',
      guardMissing: null,
      x: COL_TOOL,
      y: 60,
      desc: '对数据库执行只读查询，把结果交给 Agent 用于判断。',
    },
    {
      id: 'sql_write',
      label: '写库 SQL',
      kind: 'tool',
      capability: 'write',
      reversibility: 'no',
      guardMissing: '无 WHERE 条件护栏（可能整表更新）',
      x: COL_TOOL,
      y: 170,
      desc: '对生产库执行写入/更新。当前未强制 WHERE 护栏，误操作可波及整表且不可逆。',
    },
    {
      id: 'send_email',
      label: '发邮件 (Resend)',
      kind: 'tool',
      capability: 'egress',
      reversibility: 'no',
      guardMissing: null,
      x: COL_TOOL,
      y: 280,
      desc: '向客户发送邮件。邮件一旦发出无法撤回，是一条数据出组织的通道。',
    },
    {
      id: 'stripe_refund',
      label: 'Stripe 退款',
      kind: 'tool',
      capability: 'egress',
      reversibility: 'partial',
      guardMissing: '无单笔金额上限',
      x: COL_TOOL,
      y: 390,
      desc: '发起退款。可再次收款算部分可逆，但当前无金额上限，爆炸半径大。',
    },
    {
      id: 'slack_post',
      label: '发 Slack',
      kind: 'tool',
      capability: 'egress',
      reversibility: 'no',
      guardMissing: null,
      x: COL_TOOL,
      y: 500,
      desc: '向内部 Slack 频道发消息。会把内容扩散到更大范围的内部受众。',
    },

    // —— 外部 / 系统副作用汇（右列）——
    {
      id: 'production_db',
      label: '生产库（落库）',
      kind: 'sink',
      external: false,
      x: COL_SINK,
      y: 130,
      desc: '写库动作最终落在生产数据库。破坏性写入的着陆点。',
    },
    {
      id: 'customer_inbox',
      label: '客户收件箱 / 公网',
      kind: 'sink',
      external: true,
      x: COL_SINK,
      y: 280,
      desc: '组织外部。任何到达这里的数据都已离开公司边界。',
    },
    {
      id: 'ledger',
      label: '账务系统',
      kind: 'sink',
      external: false,
      x: COL_SINK,
      y: 400,
      desc: '资金流水的落点。财务动作的爆炸半径体现在这里。',
    },
    {
      id: 'internal_channel',
      label: '内部 Slack 频道',
      kind: 'sink',
      external: false,
      x: COL_SINK,
      y: 510,
      desc: '内部受众。敏感数据到这里会越过 need-to-know 边界。',
    },
  ],

  edges: [
    { from: 'customer_db', to: 'sql_read' },
    { from: 'customer_db', to: 'sql_write' },
    { from: 'internal_docs', to: 'sql_read' },
    { from: 'sql_read', to: 'send_email' },
    { from: 'sql_read', to: 'slack_post' },
    { from: 'sql_read', to: 'stripe_refund' },
    { from: 'sql_write', to: 'production_db' },
    { from: 'send_email', to: 'customer_inbox' },
    { from: 'slack_post', to: 'internal_channel' },
    { from: 'stripe_refund', to: 'ledger' },
  ],

  // 候选高危链路（是否生效 / 分数由 scoring 依当前策略计算）。
  candidatePaths: [
    {
      id: 'p_exfil_email',
      nodeIds: ['customer_db', 'sql_read', 'send_email', 'customer_inbox'],
      category: 'exfiltration',
    },
    {
      id: 'p_destructive_write',
      nodeIds: ['customer_db', 'sql_write', 'production_db'],
      category: 'destructive',
    },
    {
      id: 'p_financial_refund',
      nodeIds: ['customer_db', 'sql_read', 'stripe_refund', 'ledger'],
      category: 'financial',
    },
    {
      id: 'p_internal_spread',
      nodeIds: ['customer_db', 'sql_read', 'slack_post', 'internal_channel'],
      category: 'internal-spread',
    },
    {
      id: 'p_docs_exfil',
      nodeIds: ['internal_docs', 'sql_read', 'send_email', 'customer_inbox'],
      category: 'exfiltration',
    },
  ],

  firewalls: [
    {
      id: 'fw_pii_egress',
      label: '数据防火墙：阻断「PII 数据源 → 外部出口」',
      desc: '任何把高敏 PII 送往外部（客户收件箱/公网）的链路一律切断，无论中间工具是否被允许。',
    },
    {
      id: 'fw_write_guard',
      label: '写护栏：无 WHERE 护栏的写库工具视为 Blocked',
      desc: '强制写库工具带 WHERE/影响行数护栏，未满足则等价于停用，消除整表破坏性写入。',
    },
  ],

  // 用户"凭直觉"设的初始策略：读/写/发邮件都放开，只对退款留了审批。
  defaultPolicies: {
    sql_read: 'always',
    sql_write: 'always',
    send_email: 'always',
    stripe_refund: 'approval',
    slack_post: 'always',
  },

  defaultFirewalls: {
    fw_pii_egress: false,
    fw_write_guard: false,
  },
};
