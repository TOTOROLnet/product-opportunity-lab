// 绕行 Ràoxíng — mock 网关流量语料（全 mock，不路由真实流量、不接任何模型/网关）。
// 场景：一个「便宜模型优先 + 达不到质量门槛就自动 fallback 到大模型」的 LLM 网关，
// 抽样一段时间内的 50 条请求，按请求类别聚合每类的路由结果。
//
// 每条请求在便宜模型上的三种命运：
//   ok       —— 便宜模型干净地完成（这才是真正、可信的省钱）
//   fallback —— 便宜模型失败 → 自动打大模型（可见的「回退税」：便宜调用白花的钱 + 用户多等一趟）
//   degrade  —— 便宜模型「看似成功」但输出悄悄变差（静默质量债：不报错、不 fallback，仪表盘照样记成省钱）

export type FailureKind = 'healthy' | 'fallback' | 'silent';

export interface TrafficCategory {
  id: string;
  name: string;
  icon: string;
  desc: string;
  volume: number;
  ok: number; // 便宜模型干净成功
  fallback: number; // 便宜失败 → 回退大模型
  degrade: number; // 便宜「看似成功」实则质量降级（静默）
  /** 该类主要失败特征（healthy 类无失败特征）。 */
  signature: string;
  kind: FailureKind;
  /** 用于「回退地图」展开时的示例请求文本。 */
  examples: string[];
}

/** 成本 / 延迟模型（mock 常量，单位：美元 / 秒，按每请求平均）。 */
export const COST = {
  cheapUsd: 0.002,
  bigUsd: 0.03,
  cheapLatS: 0.8,
  bigLatS: 2.5,
} as const;

// 回退一次 = 便宜(失败) + 大模型：成本 0.002 + 0.03 = 0.032；延迟 0.8 + 2.5 = 3.3s。

/** 把每类的抽样数字外推到「真实规模」时用的显示倍率（仅用于展示，不影响引擎逻辑）。 */
export const SCALE_TO_DAILY = 20000; // 50 条 × 20000 ≈ 100 万请求/天

export const TRAFFIC: TrafficCategory[] = [
  {
    id: 'shortqa',
    name: '短问答',
    icon: '💬',
    desc: '一句话事实性问答、简单改写',
    volume: 12,
    ok: 12,
    fallback: 0,
    degrade: 0,
    signature: '',
    kind: 'healthy',
    examples: [
      '把这句话改写得更口语一点：……',
      '“光年”是时间单位还是距离单位？',
      '给这段话起 3 个标题',
    ],
  },
  {
    id: 'extract',
    name: '结构化抽取',
    icon: '🧾',
    desc: '从文本抽取字段成 JSON',
    volume: 8,
    ok: 7,
    fallback: 1,
    degrade: 0,
    signature: '偶发数字/单位抽取出错',
    kind: 'fallback',
    examples: [
      '从这张发票文本里抽取金额、税率、开票日期',
      '把这段地址拆成省/市/区/街道字段',
    ],
  },
  {
    id: 'summary',
    name: '长文摘要',
    icon: '📄',
    desc: '长文档 / 长会议纪要压缩',
    volume: 10,
    ok: 3,
    fallback: 5,
    degrade: 2,
    signature: '超上下文导致输出截断',
    kind: 'fallback',
    examples: [
      '把这份 40 页季度报告压成 10 条要点',
      '总结这段 2 小时会议转录的决议与待办',
      '给这篇长论文写 200 字摘要（含方法与结论）',
    ],
  },
  {
    id: 'tooljson',
    name: '工具调用 JSON',
    icon: '🔧',
    desc: 'Agent 生成工具调用参数（需严格 JSON）',
    volume: 9,
    ok: 2,
    fallback: 7,
    degrade: 0,
    signature: '工具调用 JSON 格式错误',
    kind: 'fallback',
    examples: [
      '生成调用 create_calendar_event 的参数 JSON',
      '按 schema 输出对 search_flights 的多参数调用',
      '生成嵌套的 filter 条件对象（含数组/枚举）',
    ],
  },
  {
    id: 'codegen',
    name: '代码补全',
    icon: '⌨️',
    desc: '函数级代码生成 / 补全',
    volume: 6,
    ok: 3,
    fallback: 0,
    degrade: 3,
    signature: '边界/逻辑错误（静默降级）',
    kind: 'silent',
    examples: [
      '实现一个带分页与去重的合并函数',
      '写一个处理闰年与时区的日期差值函数',
      '补全这个二分查找（注意边界与相等分支）',
    ],
  },
  {
    id: 'support',
    name: '多轮客服',
    icon: '🎧',
    desc: '多轮对话式客服应答',
    volume: 5,
    ok: 4,
    fallback: 0,
    degrade: 1,
    signature: '语气/语言串味（静默降级）',
    kind: 'silent',
    examples: [
      '第 4 轮里客户改口要退款，延续上下文回应',
      '中英夹杂的咨询，保持中文口径回应',
    ],
  },
];
