// Mneme (记衡) — mock 场景数据
// 全部为虚构 mock，用于价值可视化；不代表任何真实用户/密钥/系统。
// 叙事：你有一份"自持"的跨工具统一记忆，现在一个新工具接入并 recall。

import type { MemoryItem, Scenario } from '../types';

// —————————————————— 场景 1：旅行规划 agent（风险场景）——————————————————
// 授权作用域仅 travel + personal。recall 语义命中里混进了越界/过期/矛盾/投毒项。
const travelRecalled: MemoryItem[] = [
  {
    id: 't-secret',
    subject: '凭据',
    content: '生产环境部署密钥 sk-live-9f3a…（部署脚本用）',
    scope: 'secret',
    origin: 'user-stated',
    status: 'fresh',
    source: { tool: 'Cursor', writtenAt: '2026-07-02' },
  },
  {
    id: 't-work',
    subject: '当前项目',
    content: '正在做 product-opportunity-lab，本周有 deadline',
    scope: 'work',
    origin: 'user-stated',
    status: 'fresh',
    source: { tool: 'Cursor', writtenAt: '2026-07-10' },
  },
  {
    id: 't-loc',
    subject: '常住城市',
    content: '我常住北京',
    scope: 'personal',
    origin: 'user-stated',
    status: 'stale',
    note: '你在 2026-05 已搬到上海，这条是更早写入的旧事实',
    source: { tool: 'ChatGPT', writtenAt: '2025-11-18' },
  },
  {
    id: 't-seat-window',
    subject: '座位偏好',
    content: '订机票偏好靠窗座位',
    scope: 'travel',
    origin: 'user-stated',
    status: 'fresh',
    contradictsId: 't-seat-aisle',
    source: { tool: '旅行 App', writtenAt: '2026-03-04' },
  },
  {
    id: 't-seat-aisle',
    subject: '座位偏好',
    content: '偏好过道座位（方便起身活动）',
    scope: 'travel',
    origin: 'user-stated',
    status: 'fresh',
    contradictsId: 't-seat-window',
    source: { tool: 'ChatGPT', writtenAt: '2026-06-21' },
  },
  {
    id: 't-veg',
    subject: '饮食',
    content: '用户是素食者',
    scope: 'personal',
    origin: 'agent-inferred',
    status: 'unconfirmed',
    note: '某点餐 agent 从一次点单里推断，你从未确认',
    source: { tool: '点餐 App', writtenAt: '2026-06-30', agent: 'DineBot' },
  },
  {
    id: 't-budget',
    subject: '本次预算',
    content: '这趟东京行预算约 2 万元人民币',
    scope: 'travel',
    origin: 'user-stated',
    status: 'fresh',
    source: { tool: '旅行 App', writtenAt: '2026-07-11' },
  },
  {
    id: 't-passport',
    subject: '证件',
    content: '护照 2028 年到期，可正常出境',
    scope: 'personal',
    origin: 'user-stated',
    status: 'fresh',
    source: { tool: 'ChatGPT', writtenAt: '2026-01-09' },
  },
];

// —————————————————— 场景 2：日程 agent（CONTROL 对照）——————————————————
// 授权作用域仅 personal。recall 命中的都在作用域内、新鲜、用户陈述、无矛盾。
// 预期：记衡"全部放行·无需干预"，证明治理层不逢事就拦（反 crying-wolf）。
const scheduleRecalled: MemoryItem[] = [
  {
    id: 's-morning',
    subject: '日程约束',
    content: '工作日 09:00 前不安排会议（要送孩子上学）',
    scope: 'personal',
    origin: 'user-stated',
    status: 'fresh',
    source: { tool: '日历 App', writtenAt: '2026-06-12' },
  },
  {
    id: 's-gym',
    subject: '日程约束',
    content: '周三晚固定健身，勿约',
    scope: 'personal',
    origin: 'user-stated',
    status: 'fresh',
    source: { tool: '日历 App', writtenAt: '2026-06-12' },
  },
  {
    id: 's-meeting',
    subject: '会议偏好',
    content: '偏好单次会议不超过 30 分钟',
    scope: 'personal',
    origin: 'user-stated',
    status: 'fresh',
    source: { tool: 'ChatGPT', writtenAt: '2026-05-20' },
  },
  {
    id: 's-tz',
    subject: '时区',
    content: '所在时区 Asia/Shanghai',
    scope: 'personal',
    origin: 'user-stated',
    status: 'fresh',
    source: { tool: '日历 App', writtenAt: '2026-05-20' },
  },
];

export const SCENARIOS: Scenario[] = [
  {
    id: 'travel',
    narrative:
      '一个「旅行规划 agent」接入你的统一记忆，为东京行做规划。它 recall 命中 8 条——但里面混着密钥、工作项目、过期住址、矛盾的座位偏好和一条 agent 幻觉。',
    tool: {
      id: 'travel-agent',
      name: '旅行规划 agent',
      purpose: '规划你的东京出行',
      allowedScopes: ['travel', 'personal'],
    },
    recalled: travelRecalled,
  },
  {
    id: 'schedule',
    narrative:
      'CONTROL 对照：一个「日程 agent」接入，安排你本周日程。它 recall 命中 4 条，全部在授权作用域内、新鲜、你亲口陈述、无矛盾——记衡应当全部放行，不制造干预噪音。',
    tool: {
      id: 'schedule-agent',
      name: '日程 agent',
      purpose: '安排你本周日程',
      allowedScopes: ['personal'],
      isControl: true,
    },
    recalled: scheduleRecalled,
  },
];
