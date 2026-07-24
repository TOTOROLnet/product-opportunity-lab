// 榫卯 Tenon — mock 3-agent 流水线：研究员 → 分析师 → 报告员
// 三者通过一块共享盘 /drive 交换工件；所有数据均为 mock。

import type { AgentId, ArtifactContract, Drift } from '../types';

export const AGENTS: Record<AgentId, { name: string; emoji: string; role: string }> = {
  researcher: { name: '研究员 Agent', emoji: '🔎', role: '抓取并汇总原始信号' },
  analyst: { name: '分析师 Agent', emoji: '📊', role: '读 findings，算综合指标' },
  reporter: { name: '报告员 Agent', emoji: '📝', role: '读 metrics，写结论报告' },
};

/** 研究员这次产出的「真实意图」（ground truth）——契约 v1 下的正确取值 */
export const GROUND_TRUTH = {
  topic: '竞品定价策略',
  score: 87, // 单位 0–100
  sampleSize: 42,
  sentiment: 'positive' as 'positive' | 'neutral' | 'negative' | 'mixed',
};

/** 共享盘上三个工件的接口契约（v1） */
export const CONTRACTS: ArtifactContract[] = [
  {
    file: 'findings.json',
    producer: 'researcher',
    consumers: ['analyst'],
    version: 1,
    fields: [
      { name: 'topic', type: 'string', consumedBy: ['analyst'] },
      { name: 'score', type: 'number', unit: '0–100', range: '[0,100]', consumedBy: ['analyst'] },
      { name: 'sampleSize', type: 'number', unit: '计数', range: '[1,∞)', consumedBy: ['analyst'] },
      { name: 'sources', type: 'string[]' },
      {
        name: 'sentiment',
        type: 'enum',
        values: ['positive', 'neutral', 'negative'],
        consumedBy: ['analyst'],
      },
    ],
  },
  {
    file: 'metrics.json',
    producer: 'analyst',
    consumers: ['reporter'],
    version: 1,
    fields: [
      { name: 'confidenceIndex', type: 'number', unit: '0–100', range: '[0,100]', consumedBy: ['reporter'] },
      { name: 'reliableSample', type: 'enum', values: ['true', 'false'], consumedBy: ['reporter'] },
      { name: 'mood', type: 'string', consumedBy: ['reporter'] },
    ],
  },
  {
    file: 'report.md',
    producer: 'reporter',
    consumers: [],
    version: 1,
    fields: [{ name: 'conclusion', type: 'string' }],
  },
];

/**
 * 研究员可能对 findings.json 发起的改动（写入共享盘）。
 * 前 4 个破坏契约；最后 1 个是安全演进（向后兼容）——用来证明榫卯不是「一刀切拦截」。
 */
export const DRIFTS: Drift[] = [
  {
    id: 'rename',
    label: '把 score 改名为 confidence',
    kind: 'rename',
    onArtifact: 'findings.json',
    detail: '`score` → `confidence`（生产者觉得新名字更贴切）',
    breaking: true,
    clause: '字段 `score`（0–100）必须存在——分析师依赖它',
    severity: 3,
    downstreamEffect: '分析师读 `score` 得到「缺失」→ 当 0 处理 → 综合置信塌成 0，结论被反转成「不建议推进」',
    migration: '字段改名映射：读时 `confidence → score`（或生产者侧回填别名），下游零改动',
    corrupts: ['metrics.json', 'report.md'],
  },
  {
    id: 'unit',
    label: '把 score 单位从 0–100 改成 0–1',
    kind: 'unit',
    onArtifact: 'findings.json',
    detail: '`score` 值从 87 变成 0.87（生产者改成了归一化小数）',
    breaking: true,
    clause: '字段 `score` 单位固定为 0–100',
    severity: 3,
    downstreamEffect:
      '字段还在、类型还对、值也「像」正常数——分析师把 0.87 当 0–100 用 → 综合置信=1，结论悄悄错但没人报错（最阴险的一类）',
    migration: '单位适配器：读时 `score = confidence × 100`，把 0–1 归一回 0–100',
    corrupts: ['metrics.json', 'report.md'],
  },
  {
    id: 'drop',
    label: '删掉 sampleSize 字段',
    kind: 'drop',
    onArtifact: 'findings.json',
    detail: '不再输出 `sampleSize`（生产者觉得没用）',
    breaking: true,
    clause: '字段 `sampleSize`（计数）必须存在——分析师用它判样本是否充分',
    severity: 2,
    downstreamEffect: '分析师读不到样本量 → 判「样本不足」→ 置信打六折到 52 → 报告误加「结论仅供参考」',
    migration: '把 `sampleSize` 声明为必填并阻断写入直至补齐（或回填上一版默认值）',
    corrupts: ['metrics.json', 'report.md'],
  },
  {
    id: 'enum',
    label: 'sentiment 新增取值 mixed',
    kind: 'enum',
    onArtifact: 'findings.json',
    detail: '`sentiment` 出现契约里没有的新值 `mixed`（多空分歧）',
    breaking: true,
    clause: '字段 `sentiment` 取值域 = {positive, neutral, negative}',
    severity: 2,
    downstreamEffect: '分析师的 mood 映射没有 `mixed` 分支 → 落到默认「未知」→ 报告丢掉「多空分歧」这个真实结论',
    migration: '为新枚举值 `mixed → 多空分歧` 补一条映射，并把契约取值域升级到 v2',
    corrupts: ['metrics.json', 'report.md'],
  },
  {
    id: 'add',
    label: '新增可选字段 notes（安全演进）',
    kind: 'add',
    onArtifact: 'findings.json',
    detail: '追加一个可选 `notes` 字段（补充说明），不动任何已有字段',
    breaking: false,
    clause: '向后兼容：新增可选字段不破坏任何消费者',
    severity: 0,
    downstreamEffect: '下游不依赖它 → 毫无影响。榫卯识别为安全演进，静默放行并把它纳入契约可选字段',
    migration: '无需迁移；契约自动纳入 `notes?` 为可选字段',
    corrupts: [],
  },
];

export const CHAIN_STEPS = ['findings.json', 'metrics.json', 'report.md'];
