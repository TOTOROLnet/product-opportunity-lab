import type { Doc } from '../types';

// mock：一份《退款服务 SOP》初始文档（agent 任务是把它更新到与新版 API v2 一致）。
// 全部为演示用 mock 文本，不代表任何真实业务规则。
export const initialDoc: Doc = [
  {
    id: 's1',
    title: '概述',
    short: '概述',
    body: '本文档说明退款流程的标准操作，供客服与研发共同维护。',
  },
  {
    id: 's2',
    title: '退款条件',
    short: '条件',
    body: '订单在签收后 7 天内、商品未拆封可申请退款。部分特价商品不支持退款。',
  },
  {
    id: 's3',
    title: '退款时限',
    short: '时限',
    body: '审核通过后，款项将在 3-5 个工作日内原路退回。',
  },
  {
    id: 's4',
    title: 'API 调用',
    short: 'API',
    body: '调用 POST /v1/refunds，字段：order_id、reason。返回 refund_id。',
  },
  {
    id: 's5',
    title: '附录：废弃字段',
    short: '附录',
    body: '旧字段 legacy_channel、manual_flag 仅历史订单使用，勿在新代码引用。',
  },
];
