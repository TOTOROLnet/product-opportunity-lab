import type { TimelineEvent } from '../types';

// mock：一条脚本化的"人机共写会话"事件序列。
// 场景：你在改《退款 SOP》，同时给 agent 派了任务"把文档更新到与新版 API v2 一致"。
// 你和 agent 的意图在 §条件 / §时限 / §附录 上发生时空重叠；§API 是可并行的无冲突区。
// 同一条序列会分别喂给"朴素模式"和"并笔模式"引擎，差异由引擎算出（非硬编码）。

// agent 打算写入的 v2 版本正文（意图）。
const V2_CONDITIONS =
  '订单在签收后 14 天内、商品吊牌完整可申请退款（v2：时限由 7 天放宽至 14 天）。部分特价商品不支持退款。';
const V2_TIMELINE =
  '审核通过后，款项将在 1-3 个工作日内原路退回（v2：由 3-5 天提速至 1-3 天）。';
const V2_API =
  '调用 POST /v2/refunds，字段：order_id、reason、idempotency_key。返回 refund_id 与 status。';
const V2_APPENDIX = '（v2 已移除全部废弃字段说明，本附录待删。）';

export const timeline: TimelineEvent[] = [
  { t: 0, type: 'agent_task', desc: '把《退款 SOP》更新到与新版 API v2 一致' },

  // —— §条件：你和 agent 撞车（你在写，agent 想覆盖）——
  { t: 1, type: 'human_focus', section: 's2' },
  { t: 2, type: 'agent_claim', section: 's2', agentBody: V2_CONDITIONS },
  { t: 3, type: 'human_edit', section: 's2', humanText: '（新增）钻石会员退款一律免手续费。' },
  { t: 4, type: 'agent_edit', section: 's2', agentBody: V2_CONDITIONS },
  { t: 5, type: 'human_blur', section: 's2' },

  // —— §时限：同样的撞车 ——
  { t: 6, type: 'human_focus', section: 's3' },
  { t: 7, type: 'agent_claim', section: 's3', agentBody: V2_TIMELINE },
  { t: 8, type: 'human_edit', section: 's3', humanText: '（新增）跨境订单退款时限延长至 30 个工作日。' },
  { t: 9, type: 'agent_edit', section: 's3', agentBody: V2_TIMELINE },
  { t: 10, type: 'human_blur', section: 's3' },

  // —— §API：无冲突的并行区（agent 在你看别处时把它改好）——
  { t: 11, type: 'agent_claim', section: 's4', agentBody: V2_API },
  { t: 12, type: 'human_focus', section: 's1' },
  { t: 13, type: 'agent_edit', section: 's4', agentBody: V2_API },
  { t: 14, type: 'human_blur', section: 's1' },

  // —— §附录：agent 想改，但你马上要删它（朴素模式会白做）——
  { t: 15, type: 'human_focus', section: 's5' },
  { t: 16, type: 'agent_claim', section: 's5', agentBody: V2_APPENDIX },
  { t: 17, type: 'agent_edit', section: 's5', agentBody: V2_APPENDIX },
  { t: 18, type: 'human_delete', section: 's5' },
];
