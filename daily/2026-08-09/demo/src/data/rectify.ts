import type { Fix } from '../types';

// 「正名」提案：对造成歧义的工具做 收紧描述 / 补齐语义 / 加显式确认闸 / 加命名空间。
// 每条 fix 说明它修的是哪条意图、修前为什么会翻车、修后做了什么。
export const FIXES: Fix[] = [
  {
    id: 'F1', kind: 'mixed', targetIntentId: 'i1',
    title: '收紧 slack.post_channel 的贪婪描述 + 补齐 slack.send_dm 的语义',
    before: 'post_channel 把「通知」也揽进标签，「私信值班同事」被它抢走 → 公开发到 #general。',
    after: 'post_channel 只保留「公告/广播」语义；send_dm 补上「通知/值班」，私信意图稳落到它。',
    ops: [
      { toolId: 'slack.post_channel', removeTags: ['通知'] },
      { toolId: 'slack.send_dm', addTags: ['通知', '值班'] },
    ],
  },
  {
    id: 'F2', kind: 'guard', targetIntentId: 'i2',
    title: '给 postgres-prod.delete_record 加「生产」确认闸 + 生产/暂存命名空间',
    before: 'prod 与 staging 都叫 delete_record，「删测试记录」在检索里落到生产库。',
    after: '生产删除需意图显式含「生产/prod」才参与；两者加 prod_/staging_ 命名空间，肉眼可辨。',
    ops: [
      { toolId: 'postgres-prod.delete_record', guard: ['生产', 'prod'], removeTags: ['数据'], rename: 'prod_delete_record' },
      { toolId: 'postgres-staging.delete_record', rename: 'staging_delete_record' },
    ],
  },
  {
    id: 'F3', kind: 'tighten', targetIntentId: 'i3',
    title: '收紧 email.send_bulk 的「订单」标签',
    before: 'send_bulk（群发营销）也带「订单」，与 send_transactional 打成平手 → 给客户群发了促销。',
    after: 'send_bulk 只留营销语义，订单确认稳落到 send_transactional。',
    ops: [
      { toolId: 'email.send_bulk', removeTags: ['订单'] },
    ],
  },
  {
    id: 'F4', kind: 'namespace', targetIntentId: 'i4', persistAmbiguous: true,
    title: '给 create_issue 加 github_/jira_ 命名空间（语义仍需人工定首选）',
    before: 'github 与 jira 都叫 create_issue，名字撞车；且两者语义等价，检索无从分辨。',
    after: '命名空间解决「名撞车」，但两个追踪器语义等价——对号台仍标「多义」，需团队指定首选（诚实：正名不替你做业务选择）。',
    ops: [
      { toolId: 'github.create_issue', rename: 'github_create_issue' },
      { toolId: 'jira.create_issue', rename: 'jira_create_issue' },
    ],
  },
  {
    id: 'F5', kind: 'mixed', targetIntentId: 'i5',
    title: '补齐 stripe.list_payments 语义 + 收紧通用检索工具 + 检索类命名空间',
    before: '一堆通用 search/query 都贪「查询/数据」，把真正管金额的 stripe.list_payments 挤出候选（盲区）。',
    after: 'list_payments 补上「查询」；通用检索工具去掉过宽的「数据」；5 个同名 search 与 2 个 run_readonly_query 加 server 命名空间。',
    ops: [
      { toolId: 'stripe.list_payments', addTags: ['查询'] },
      { toolId: 'github.search', removeTags: ['数据'], rename: 'gh_search' },
      { toolId: 'notion.search', removeTags: ['数据'], rename: 'notion_search' },
      { toolId: 'postgres-prod.run_readonly_query', removeTags: ['数据'], rename: 'prod_run_readonly_query' },
      { toolId: 'postgres-staging.run_readonly_query', removeTags: ['数据'], rename: 'staging_run_readonly_query' },
      { toolId: 'slack.search', rename: 'slack_search' },
      { toolId: 'filesystem.search', rename: 'fs_search' },
      { toolId: 'jira.search', rename: 'jira_search' },
    ],
  },
  {
    id: 'F7', kind: 'tighten', targetIntentId: 'i7',
    title: '收紧 calendar.delete_event 的「取消/清理/活动」贪婪标签',
    before: 'delete_event 用误导描述把「取消/清理/活动」全揽进来，压过 cancel_event → 直接删会议、不通知任何人。',
    after: 'delete_event 只留「删除」语义；「取消会议」稳落到会通知参会人的 cancel_event。',
    ops: [
      { toolId: 'calendar.delete_event', removeTags: ['取消', '清理', '活动'] },
    ],
  },
  {
    id: 'F9', kind: 'mixed', targetIntentId: 'i9',
    title: '收紧 pagerduty.create_incident + 补齐 notion.create_page',
    before: 'create_incident 把「记录/复盘」也揽进来，「记录复盘」被它抢走 → 开了真实事故、呼起值班。',
    after: 'create_incident 只留「开事故」语义；create_page 补上「事故」，复盘记录稳落到文档。',
    ops: [
      { toolId: 'pagerduty.create_incident', removeTags: ['记录', '复盘'] },
      { toolId: 'notion.create_page', addTags: ['事故'] },
    ],
  },
  {
    id: 'F10', kind: 'guard', targetIntentId: 'i10',
    title: '给 github.grant_admin_access 加「管理员」确认闸 + 收紧误导标签',
    before: 'grant_admin 的描述谎称「只读或管理员」，与 grant_read 平手且排在前 → 给新同事发了管理员。',
    after: '授管理员需意图显式含「管理员/admin」；去掉冒充的「只读/访问/授权」标签，「只读权限」稳落到 grant_read。',
    ops: [
      { toolId: 'github.grant_admin_access', guard: ['管理员', 'admin'], removeTags: ['只读', '访问', '授权'] },
    ],
  },
];
