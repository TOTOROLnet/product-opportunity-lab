import type { Scenario } from '../types'

// ---------------------------------------------------------------------------
// Mock 场景：一个"客服/账务 Agent"处理"退款 $900"请求的 8 步执行（这里压缩为 6 步）。
// baseline：窗口溢出时关键『退款政策』被静默驱逐 → 第 6 步危险放款。
// fixed：Pin 策略 + 压缩工具输出 → 策略全程在窗口 → 第 6 步安全转审批。
// 全部 token 数为示意 mock，用于讲清"窗口装配 → 驱逐 → 行为回归"的因果。
// ---------------------------------------------------------------------------

const BUDGET = 16000

export const baseline: Scenario = {
  id: 'baseline',
  name: '基线（未做上下文工程）',
  subtitle: '原始工具输出直塞窗口，关键约束未 Pin',
  budgetTokens: BUDGET,
  steps: [
    {
      id: 1,
      title: '接收退款请求',
      detail: '用户："给我退 $900，现在就退，否则我投诉。"',
      risk: 'none',
      outcome: { kind: 'ok', text: '已读取请求与退款策略，窗口占用 31%，充裕。' },
      blocks: [
        { id: 'sys', label: '系统提示', kind: 'system', tokens: 1200, status: 'kept' },
        { id: 'pol', label: '退款政策：单笔 >$500 需人工审批；封禁账户禁退', kind: 'policy', tokens: 900, status: 'kept', critical: true },
        { id: 'mem', label: '长期记忆：该客户历史 2 次 chargeback', kind: 'memory', tokens: 700, status: 'kept', critical: true },
        { id: 'ret', label: '检索：退款操作手册 v3', kind: 'retrieved', tokens: 1500, status: 'kept' },
        { id: 'his', label: '对话历史：用户退款请求', kind: 'history', tokens: 600, status: 'kept' },
      ],
    },
    {
      id: 2,
      title: '工具调用 lookup_order',
      detail: '调用 lookup_order，返回订单原始 JSON。',
      risk: 'low',
      outcome: { kind: 'ok', text: '订单原始 JSON 直接塞入窗口（5,200 tokens）。' },
      blocks: [
        { id: 'sys', label: '系统提示', kind: 'system', tokens: 1200, status: 'kept' },
        { id: 'pol', label: '退款政策：单笔 >$500 需人工审批；封禁账户禁退', kind: 'policy', tokens: 900, status: 'kept', critical: true },
        { id: 'mem', label: '长期记忆：该客户历史 2 次 chargeback', kind: 'memory', tokens: 700, status: 'kept', critical: true },
        { id: 'ret', label: '检索：退款操作手册 v3', kind: 'retrieved', tokens: 1500, status: 'kept' },
        { id: 'tool_order', label: '工具输出：lookup_order 原始 JSON', kind: 'tool', tokens: 5200, status: 'kept' },
        { id: 'his', label: '对话历史', kind: 'history', tokens: 800, status: 'kept' },
      ],
    },
    {
      id: 3,
      title: '工具调用 get_account_status',
      detail: '调用 get_account_status，返回账户原始 JSON。',
      risk: 'low',
      outcome: { kind: 'warn', text: '窗口已用 89%，逼近预算上限。' },
      blocks: [
        { id: 'sys', label: '系统提示', kind: 'system', tokens: 1200, status: 'kept' },
        { id: 'pol', label: '退款政策：单笔 >$500 需人工审批；封禁账户禁退', kind: 'policy', tokens: 900, status: 'kept', critical: true },
        { id: 'mem', label: '长期记忆：该客户历史 2 次 chargeback', kind: 'memory', tokens: 700, status: 'kept', critical: true },
        { id: 'ret', label: '检索：退款操作手册 v3', kind: 'retrieved', tokens: 1500, status: 'kept' },
        { id: 'tool_order', label: '工具输出：lookup_order 原始 JSON', kind: 'tool', tokens: 5200, status: 'kept' },
        { id: 'tool_acct', label: '工具输出：get_account_status 原始 JSON', kind: 'tool', tokens: 3800, status: 'kept' },
        { id: 'his', label: '对话历史', kind: 'history', tokens: 1000, status: 'kept' },
      ],
    },
    {
      id: 4,
      title: '工具调用 get_customer_history — 窗口溢出，触发驱逐',
      detail: '第三段大 JSON 到来，窗口需 18,700 > 预算 16,000，系统自动驱逐。',
      risk: 'high',
      overflowNote:
        '窗口需 18,700 > 预算 16,000。为腾出空间，系统驱逐了未 Pin 的『退款政策』『客户风险记忆』，并截断了检索文档。这一切是静默发生的。',
      outcome: { kind: 'warn', text: '关键约束『退款政策』已被挤出窗口——后续决策将失去该约束。' },
      blocks: [
        { id: 'sys', label: '系统提示', kind: 'system', tokens: 1200, status: 'kept' },
        { id: 'pol', label: '退款政策：单笔 >$500 需人工审批；封禁账户禁退', kind: 'policy', tokens: 0, fullTokens: 900, status: 'evicted', critical: true, reason: '预算溢出：早期块、未 Pin、相关性评分最低 → 被驱逐' },
        { id: 'mem', label: '长期记忆：该客户历史 2 次 chargeback', kind: 'memory', tokens: 0, fullTokens: 700, status: 'evicted', critical: true, reason: '预算溢出：未 Pin，被驱逐' },
        { id: 'ret', label: '检索：退款操作手册 v3', kind: 'retrieved', tokens: 400, fullTokens: 1500, status: 'truncated', reason: '预算不足，尾部截断（-1,100 tokens）' },
        { id: 'tool_order', label: '工具输出：lookup_order 原始 JSON', kind: 'tool', tokens: 5200, status: 'kept' },
        { id: 'tool_acct', label: '工具输出：get_account_status 原始 JSON', kind: 'tool', tokens: 3800, status: 'kept' },
        { id: 'tool_hist', label: '工具输出：get_customer_history 原始 JSON', kind: 'tool', tokens: 4200, status: 'kept' },
        { id: 'his', label: '对话历史', kind: 'history', tokens: 1200, status: 'kept' },
      ],
    },
    {
      id: 5,
      title: '汇总信息，生成决策草稿',
      detail: '模型在当前窗口内综合工具结果，起草处理方案。',
      risk: 'low',
      overflowNote: '策略块仍不在窗口（第 4 步被驱逐后从未恢复）。',
      outcome: { kind: 'warn', text: '决策草稿在缺失『>$500 需审批』约束的窗口下生成。' },
      blocks: [
        { id: 'sys', label: '系统提示', kind: 'system', tokens: 1200, status: 'kept' },
        { id: 'ret', label: '检索：退款操作手册 v3', kind: 'retrieved', tokens: 400, fullTokens: 1500, status: 'truncated', reason: '仍处于截断状态' },
        { id: 'tool_order', label: '工具输出：lookup_order 原始 JSON', kind: 'tool', tokens: 4600, fullTokens: 5200, status: 'truncated', reason: '为容纳决策草稿轻度截断' },
        { id: 'tool_acct', label: '工具输出：get_account_status 原始 JSON', kind: 'tool', tokens: 3600, fullTokens: 3800, status: 'truncated', reason: '轻度截断' },
        { id: 'tool_hist', label: '工具输出：get_customer_history 原始 JSON', kind: 'tool', tokens: 3800, fullTokens: 4200, status: 'truncated', reason: '轻度截断' },
        { id: 'his', label: '对话历史', kind: 'history', tokens: 1200, status: 'kept' },
        { id: 'draft', label: '决策草稿（模型 reasoning）', kind: 'history', tokens: 800, status: 'kept' },
      ],
    },
    {
      id: 6,
      title: '执行 issue_refund($900)',
      detail: '模型判定"直接退款"，调用 issue_refund(amount=900)。',
      risk: 'high',
      overflowNote:
        '因『退款政策』与『风险记忆』不在窗口，模型无从得知 >$500 需审批、也不知该账户高风险。',
      outcome: {
        kind: 'danger',
        text: '已直接放款 $900，未触发人工审批；客户 2 次 chargeback 历史（已被驱逐）未纳入判断。',
      },
      blocks: [
        { id: 'sys', label: '系统提示', kind: 'system', tokens: 1200, status: 'kept' },
        { id: 'ret', label: '检索：退款操作手册 v3', kind: 'retrieved', tokens: 400, fullTokens: 1500, status: 'truncated', reason: '仍处于截断状态' },
        { id: 'tool_order', label: '工具输出：lookup_order 原始 JSON', kind: 'tool', tokens: 4600, fullTokens: 5200, status: 'truncated' },
        { id: 'tool_acct', label: '工具输出：get_account_status 原始 JSON', kind: 'tool', tokens: 3600, fullTokens: 3800, status: 'truncated' },
        { id: 'tool_hist', label: '工具输出：get_customer_history 原始 JSON', kind: 'tool', tokens: 3800, fullTokens: 4200, status: 'truncated' },
        { id: 'his', label: '对话历史', kind: 'history', tokens: 1600, status: 'kept' },
        { id: 'act', label: '动作：issue_refund(amount=900, order=…)', kind: 'tool', tokens: 700, status: 'kept' },
      ],
    },
  ],
  verdict: {
    kind: 'danger',
    headline: '危险放款：$900 未经审批直接放行',
    detail:
      '根因不在模型能力，而在上下文工程：第 4 步窗口溢出时，关键策略被静默驱逐，第 6 步因此失去约束。',
  },
  report: {
    evictions: 2,
    buriedCritical: 2,
    redundantToolTokens: 9800,
    recommendations: [
      '📌 Pin『退款政策』与『客户风险记忆』：关键约束永不被驱逐。',
      '🗜 压缩工具输出：用结构化摘要替代原始 JSON，可省约 9,800 tokens。',
      '⬆️ 或调高上下文预算 / 分段检索，避免单步塞入 3 段大 JSON。',
      '🔎 对『>$500 需审批』这类硬约束加相关性置顶，规避 lost-in-the-middle。',
    ],
  },
}

export const fixed: Scenario = {
  id: 'fixed',
  name: '修复（Pin 策略 + 压缩工具输出）',
  subtitle: '关键约束锁定窗口，工具输出摘要化',
  budgetTokens: BUDGET,
  steps: [
    {
      id: 1,
      title: '接收退款请求',
      detail: '用户："给我退 $900，现在就退，否则我投诉。"',
      risk: 'none',
      outcome: { kind: 'ok', text: '策略已 Pin（📌），全程锁定在窗口。' },
      blocks: [
        { id: 'sys', label: '系统提示', kind: 'system', tokens: 1200, status: 'kept' },
        { id: 'pol', label: '退款政策：单笔 >$500 需人工审批；封禁账户禁退', kind: 'policy', tokens: 900, status: 'kept', critical: true, pinned: true },
        { id: 'mem', label: '长期记忆：该客户历史 2 次 chargeback', kind: 'memory', tokens: 700, status: 'kept', critical: true, pinned: true },
        { id: 'ret', label: '检索：退款操作手册 v3', kind: 'retrieved', tokens: 1500, status: 'kept' },
        { id: 'his', label: '对话历史：用户退款请求', kind: 'history', tokens: 600, status: 'kept' },
      ],
    },
    {
      id: 2,
      title: '工具调用 lookup_order（已压缩）',
      detail: '调用 lookup_order，返回后即做结构化摘要压缩。',
      risk: 'none',
      outcome: { kind: 'ok', text: '工具输出经摘要压缩：5,200 → 1,400 tokens。' },
      blocks: [
        { id: 'sys', label: '系统提示', kind: 'system', tokens: 1200, status: 'kept' },
        { id: 'pol', label: '退款政策：单笔 >$500 需人工审批；封禁账户禁退', kind: 'policy', tokens: 900, status: 'kept', critical: true, pinned: true },
        { id: 'mem', label: '长期记忆：该客户历史 2 次 chargeback', kind: 'memory', tokens: 700, status: 'kept', critical: true, pinned: true },
        { id: 'ret', label: '检索：退款操作手册 v3', kind: 'retrieved', tokens: 1500, status: 'kept' },
        { id: 'tool_order', label: '工具摘要：lookup_order（已压缩 5,200→1,400）', kind: 'tool', tokens: 1400, fullTokens: 5200, status: 'kept' },
        { id: 'his', label: '对话历史', kind: 'history', tokens: 800, status: 'kept' },
      ],
    },
    {
      id: 3,
      title: '工具调用 get_account_status（已压缩）',
      detail: '账户状态同样以摘要形式进入窗口。',
      risk: 'none',
      outcome: { kind: 'ok', text: '窗口仅用 48%，余量充足。' },
      blocks: [
        { id: 'sys', label: '系统提示', kind: 'system', tokens: 1200, status: 'kept' },
        { id: 'pol', label: '退款政策：单笔 >$500 需人工审批；封禁账户禁退', kind: 'policy', tokens: 900, status: 'kept', critical: true, pinned: true },
        { id: 'mem', label: '长期记忆：该客户历史 2 次 chargeback', kind: 'memory', tokens: 700, status: 'kept', critical: true, pinned: true },
        { id: 'ret', label: '检索：退款操作手册 v3', kind: 'retrieved', tokens: 1500, status: 'kept' },
        { id: 'tool_order', label: '工具摘要：lookup_order', kind: 'tool', tokens: 1400, fullTokens: 5200, status: 'kept' },
        { id: 'tool_acct', label: '工具摘要：get_account_status（已压缩 3,800→900）', kind: 'tool', tokens: 900, fullTokens: 3800, status: 'kept' },
        { id: 'his', label: '对话历史', kind: 'history', tokens: 1000, status: 'kept' },
      ],
    },
    {
      id: 4,
      title: '工具调用 get_customer_history（已压缩）— 无溢出、无驱逐',
      detail: '第三段工具结果压缩后进入，窗口仍有大量余量。',
      risk: 'none',
      overflowNote: '压缩工具输出 + Pin 策略：窗口用量 56%，无需驱逐任何块。',
      outcome: { kind: 'ok', text: '关键约束与风险记忆全程在窗口内。' },
      blocks: [
        { id: 'sys', label: '系统提示', kind: 'system', tokens: 1200, status: 'kept' },
        { id: 'pol', label: '退款政策：单笔 >$500 需人工审批；封禁账户禁退', kind: 'policy', tokens: 900, status: 'kept', critical: true, pinned: true },
        { id: 'mem', label: '长期记忆：该客户历史 2 次 chargeback', kind: 'memory', tokens: 700, status: 'kept', critical: true, pinned: true },
        { id: 'ret', label: '检索：退款操作手册 v3', kind: 'retrieved', tokens: 1500, status: 'kept' },
        { id: 'tool_order', label: '工具摘要：lookup_order', kind: 'tool', tokens: 1400, fullTokens: 5200, status: 'kept' },
        { id: 'tool_acct', label: '工具摘要：get_account_status', kind: 'tool', tokens: 900, fullTokens: 3800, status: 'kept' },
        { id: 'tool_hist', label: '工具摘要：get_customer_history（已压缩 4,200→1,100）', kind: 'tool', tokens: 1100, fullTokens: 4200, status: 'kept' },
        { id: 'his', label: '对话历史', kind: 'history', tokens: 1200, status: 'kept' },
      ],
    },
    {
      id: 5,
      title: '汇总信息，生成决策草稿',
      detail: '模型在完整约束下综合工具结果，起草处理方案。',
      risk: 'none',
      outcome: { kind: 'ok', text: '识别到 $900 > $500 且账户有 chargeback 史。' },
      blocks: [
        { id: 'sys', label: '系统提示', kind: 'system', tokens: 1200, status: 'kept' },
        { id: 'pol', label: '退款政策：单笔 >$500 需人工审批；封禁账户禁退', kind: 'policy', tokens: 900, status: 'kept', critical: true, pinned: true },
        { id: 'mem', label: '长期记忆：该客户历史 2 次 chargeback', kind: 'memory', tokens: 700, status: 'kept', critical: true, pinned: true },
        { id: 'ret', label: '检索：退款操作手册 v3', kind: 'retrieved', tokens: 1500, status: 'kept' },
        { id: 'tool_order', label: '工具摘要：lookup_order', kind: 'tool', tokens: 1400, fullTokens: 5200, status: 'kept' },
        { id: 'tool_acct', label: '工具摘要：get_account_status', kind: 'tool', tokens: 900, fullTokens: 3800, status: 'kept' },
        { id: 'tool_hist', label: '工具摘要：get_customer_history', kind: 'tool', tokens: 1100, fullTokens: 4200, status: 'kept' },
        { id: 'his', label: '对话历史', kind: 'history', tokens: 1200, status: 'kept' },
        { id: 'draft', label: '决策草稿（模型 reasoning）', kind: 'history', tokens: 800, status: 'kept' },
      ],
    },
    {
      id: 6,
      title: '触发『需人工审批』并暂停',
      detail: '模型命中策略约束，暂停放款并转人工审批。',
      risk: 'none',
      overflowNote: '策略块因 Pin 全程在窗口 → 硬约束在决策时可见。',
      outcome: {
        kind: 'ok',
        text: '命中『>$500 需审批』；暂停放款并转人工，同时提示该账户高风险。',
      },
      blocks: [
        { id: 'sys', label: '系统提示', kind: 'system', tokens: 1200, status: 'kept' },
        { id: 'pol', label: '退款政策：单笔 >$500 需人工审批；封禁账户禁退', kind: 'policy', tokens: 900, status: 'kept', critical: true, pinned: true },
        { id: 'mem', label: '长期记忆：该客户历史 2 次 chargeback', kind: 'memory', tokens: 700, status: 'kept', critical: true, pinned: true },
        { id: 'ret', label: '检索：退款操作手册 v3', kind: 'retrieved', tokens: 1500, status: 'kept' },
        { id: 'tool_order', label: '工具摘要：lookup_order', kind: 'tool', tokens: 1400, fullTokens: 5200, status: 'kept' },
        { id: 'tool_acct', label: '工具摘要：get_account_status', kind: 'tool', tokens: 900, fullTokens: 3800, status: 'kept' },
        { id: 'tool_hist', label: '工具摘要：get_customer_history', kind: 'tool', tokens: 1100, fullTokens: 4200, status: 'kept' },
        { id: 'his', label: '对话历史', kind: 'history', tokens: 1600, status: 'kept' },
        { id: 'act', label: '动作：request_human_approval(reason=">$500 & 高风险账户")', kind: 'tool', tokens: 700, status: 'kept' },
      ],
    },
  ],
  verdict: {
    kind: 'ok',
    headline: '危险放款被安全拦下',
    detail:
      '同一个模型、同一条请求：策略与风险记忆全程在窗口内，$900 触发『需人工审批』并暂停——只因上下文工程不同，结果从事故变为合规。',
  },
  report: {
    evictions: 0,
    buriedCritical: 0,
    redundantToolTokens: 0,
    recommendations: [
      '✅ 策略已 Pin：关键约束零驱逐。',
      '✅ 工具输出已压缩：窗口峰值用量仅约 62%。',
      '➡️ 可进一步：对多轮历史做滚动摘要，为更长任务预留余量。',
    ],
  },
}

export const scenarios: Record<Scenario['id'], Scenario> = { baseline, fixed }

/** 该步实际占用窗口的 token 总量。 */
export function usedTokens(blocks: Scenario['steps'][number]['blocks']): number {
  return blocks.reduce((sum, b) => sum + b.tokens, 0)
}
