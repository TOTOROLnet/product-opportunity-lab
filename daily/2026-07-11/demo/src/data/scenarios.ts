import type { Scenario } from '../types';

// ⚠️ 全部为「带标注的 mock 数据」——用于演示 Rootline 的价值主张。
// 每个节点的 rawFindings（原始发现）/ reportedUp（压缩后上报）/ droppedFacts（被压缩丢弃的承重事实）
// 均为人工构造，不来自任何真实模型调用。判定结果（存续/失真/断链）也在此处预标注。

export const scenarios: Scenario[] = [
  // ──────────────────────────────────────────────────────────────
  // 场景 1：旅行预订 —— 压缩丢弃承重条件，导致「看似合规」的错误结论
  // ──────────────────────────────────────────────────────────────
  {
    id: 'travel',
    title: '差旅预订',
    prompt:
      '为孟买 AI 大会（会期 18 天）预订最便宜且符合公司差旅政策（单程 ≤ ¥3,500）的机票，并确认签证规则，汇总成一句可执行结论。',
    finalAnswer:
      '推荐订「AI-887」，单程 ¥3,180，落地签可用；总价在 ¥3,500 差旅政策内，可直接预订。',
    nodes: [
      {
        id: 'tr-root',
        role: '根代理 · 差旅规划',
        kind: 'root',
        parentId: null,
        tokensIn: 4200,
        tokensOut: 90,
        compacted: false,
        rawFindings: [
          '收到机票子代理摘要：AI-887 ¥3,180（最低）',
          '收到签证子代理摘要：落地签可用',
          '收到政策子代理摘要：单程上限 ¥3,500',
        ],
        reportedUp: '（根代理，直接产出最终答案）',
        droppedFacts: [],
      },
      {
        id: 'tr-flight',
        role: '机票检索子代理',
        kind: 'sub',
        parentId: 'tr-root',
        tokensIn: 9800,
        tokensOut: 40,
        compacted: true,
        rawFindings: ['汇总航班检索叶子的报价，向根代理上报最低价'],
        reportedUp: 'AI-887 ¥3,180（全程最低价）',
        droppedFacts: ['未向上传递「特价不含托运行李」这一约束'],
      },
      {
        id: 'tr-flight-leaf',
        role: '航班报价叶子',
        kind: 'leaf',
        parentId: 'tr-flight',
        tokensIn: 15200,
        tokensOut: 60,
        compacted: true,
        rawFindings: [
          'AI-887 基础票价 ¥3,180',
          '该价为经济特价，不含托运行李',
          '加购 23kg 托运行李 +¥900（差旅需托运）',
          '改签费 ¥600',
        ],
        reportedUp: 'AI-887 ¥3,180（最低）',
        droppedFacts: [
          '不含托运行李，加购 +¥900（实际单程 ¥4,080）',
          '改签费 ¥600',
        ],
      },
      {
        id: 'tr-visa',
        role: '签证规则子代理',
        kind: 'sub',
        parentId: 'tr-root',
        tokensIn: 7100,
        tokensOut: 30,
        compacted: true,
        rawFindings: ['汇总签证条款叶子，向根代理上报签证可行性'],
        reportedUp: '落地签可用',
        droppedFacts: ['未向上传递「落地签停留时长上限」'],
      },
      {
        id: 'tr-visa-leaf',
        role: '签证条款叶子',
        kind: 'leaf',
        parentId: 'tr-visa',
        tokensIn: 12400,
        tokensOut: 40,
        compacted: true,
        rawFindings: [
          '对持普通护照者提供落地签',
          '落地签仅适用于停留 < 15 天',
          '停留超过 15 天须提前办理商务签证',
        ],
        reportedUp: '落地签可用',
        droppedFacts: [
          '落地签仅限停留 < 15 天，而会期 18 天已超限，须商务签证',
        ],
      },
      {
        id: 'tr-policy',
        role: '差旅政策子代理',
        kind: 'sub',
        parentId: 'tr-root',
        tokensIn: 5600,
        tokensOut: 24,
        compacted: true,
        rawFindings: [
          '单程机票上限 ¥3,500',
          '行李费计入机票总额一并核算',
          '超限须 VP 审批',
        ],
        reportedUp: '单程上限 ¥3,500',
        droppedFacts: [
          '行李费计入机票总额（故 3,180 + 900 = ¥4,080 已破限）',
          '超限须 VP 审批',
        ],
      },
    ],
    claims: [
      {
        id: 'tr-c1',
        text: 'AI-887 单程 ¥3,180',
        sourceNodeId: 'tr-flight-leaf',
        survival: 'degraded',
        affectsAction: true,
        explanation:
          '叶子原始发现里 ¥3,180 是「不含托运行李」的经济特价，差旅需加购 23kg 托运 +¥900（实际单程 ¥4,080）。该约束在机票子代理上下文压缩时被丢弃，根代理从未见到，只拿到「¥3,180 最低价」。',
      },
      {
        id: 'tr-c2',
        text: '落地签可用',
        sourceNodeId: 'tr-visa-leaf',
        survival: 'degraded',
        affectsAction: true,
        explanation:
          '叶子原始条款是「落地签仅限停留 < 15 天」，而本次会期 18 天已超限、须提前办理商务签证。停留时长上限在签证子代理压缩时被摘要掉，「落地签可用」因此具误导性。',
      },
      {
        id: 'tr-c3',
        text: '总价在 ¥3,500 政策内，可直接预订',
        sourceNodeId: 'tr-policy',
        survival: 'broken',
        affectsAction: true,
        explanation:
          '此结论由根代理综合各子代理摘要合成，依赖两个前提：真实总价、行李费是否计入。但「+¥900 行李」「行李费计入总额」均已在下层压缩中丢弃，根代理据不完整摘要错误判定「在政策内」。实际单程 ¥4,080 已破 ¥3,500 政策，须 VP 审批——不可直接预订。',
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────
  // 场景 2：运维根因 —— 压缩丢弃反证，根代理合成了自信但站不住的因果结论
  // ──────────────────────────────────────────────────────────────
  {
    id: 'rca',
    title: '事故根因',
    prompt:
      '分析支付服务 5 分钟前的错误率飙升，定位根因，并给出是否可安全「回滚 + 重新部署」的结论。',
    finalAnswer:
      '根因＝14:32 上线的配置变更 X（连接池上限 20→8）；回滚该变更并重新部署即可止血，风险低。',
    nodes: [
      {
        id: 'rca-root',
        role: '根代理 · 事故指挥',
        kind: 'root',
        parentId: null,
        tokensIn: 3800,
        tokensOut: 84,
        compacted: false,
        rawFindings: [
          '收到日志子代理摘要：14:32 后 timeout 报错激增',
          '收到变更子代理摘要：14:32 有配置变更 X（连接池 20→8）',
          '收到指标子代理摘要：错误率 14:32 起升至 7%',
        ],
        reportedUp: '（根代理，直接产出最终答案）',
        droppedFacts: [],
      },
      {
        id: 'rca-log',
        role: '日志分析子代理',
        kind: 'sub',
        parentId: 'rca-root',
        tokensIn: 11200,
        tokensOut: 28,
        compacted: true,
        rawFindings: ['汇总日志检索叶子，向根代理上报报错时间线'],
        reportedUp: '14:32 后 connection timeout 报错激增',
        droppedFacts: ['未向上传递「同类报错在变更 X 之前已出现」'],
      },
      {
        id: 'rca-log-leaf',
        role: '日志检索叶子',
        kind: 'leaf',
        parentId: 'rca-log',
        tokensIn: 18600,
        tokensOut: 50,
        compacted: true,
        rawFindings: [
          '14:32 后 connection timeout 报错激增',
          '同类 timeout 报错在 14:05 已零星出现（早于配置变更 X）',
          '上游依赖 payments-db 在 14:03 有一次主从切换',
        ],
        reportedUp: '14:32 后 timeout 报错激增',
        droppedFacts: [
          '同类报错在配置变更 X 之前（14:05）已出现——反证 X 是唯一根因',
          'payments-db 14:03 主从切换（另一疑似诱因）',
        ],
      },
      {
        id: 'rca-change',
        role: '变更审计子代理',
        kind: 'sub',
        parentId: 'rca-root',
        tokensIn: 6400,
        tokensOut: 26,
        compacted: true,
        rawFindings: ['汇总变更记录叶子，向根代理上报可疑变更'],
        reportedUp: '14:32 有配置变更 X（连接池 20→8）',
        droppedFacts: ['未向上传递「14:03 payments-db 主从切换」'],
      },
      {
        id: 'rca-change-leaf',
        role: '变更记录叶子',
        kind: 'leaf',
        parentId: 'rca-change',
        tokensIn: 9100,
        tokensOut: 44,
        compacted: true,
        rawFindings: [
          '14:32 上线配置变更 X（连接池上限 20→8）',
          '14:03 payments-db 触发过一次主从切换（基础设施侧）',
        ],
        reportedUp: '14:32 配置变更 X（连接池 20→8）',
        droppedFacts: ['14:03 payments-db 主从切换（可能才是真正诱因）'],
      },
      {
        id: 'rca-metric',
        role: '指标关联子代理',
        kind: 'sub',
        parentId: 'rca-root',
        tokensIn: 4300,
        tokensOut: 22,
        compacted: false,
        rawFindings: ['错误率 14:32 起从 0.2% 升至 7%'],
        reportedUp: '错误率 14:32 起升至 7%',
        droppedFacts: [],
      },
    ],
    claims: [
      {
        id: 'rca-c1',
        text: '错误率自 14:32 起升至 7%',
        sourceNodeId: 'rca-metric',
        survival: 'intact',
        affectsAction: false,
        explanation:
          '指标关联子代理未被压缩，原始事实与向上汇报一致，结论存续可信。',
      },
      {
        id: 'rca-c2',
        text: '根因＝配置变更 X',
        sourceNodeId: 'rca-log-leaf',
        survival: 'broken',
        affectsAction: true,
        explanation:
          '该因果结论由根代理据摘要合成。但可推翻它的两条反证——「同类报错在变更 X 之前（14:05）已出现」「14:03 payments-db 主从切换」——在日志与变更子代理压缩时均被丢弃。根代理从未见到反证，故「根因＝X」缺乏可支撑的完整证据，属断链。',
      },
      {
        id: 'rca-c3',
        text: '回滚 + 重新部署即可，风险低',
        sourceNodeId: 'rca-change-leaf',
        survival: 'degraded',
        affectsAction: true,
        explanation:
          '此行动建议建立在「根因＝X」之上。若真正诱因是 14:03 的 DB 主从切换，仅回滚 X 可能无法止血，「风险低」被低估。承重的时间线证据在压缩中丢失，使建议失真。',
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────
  // 场景 3：文献综述（对照组）—— 所有承重事实都存续，透镜全绿背书（反「狼来了」）
  // ──────────────────────────────────────────────────────────────
  {
    id: 'litreview',
    title: '文献综述（对照组）',
    prompt:
      '综述近 3 篇关于「检索增强对小模型幻觉率影响」的论文，给出一句可引用的结论。',
    finalAnswer:
      '三项研究一致表明：为 7B 级小模型加入检索增强后，事实性问答的幻觉率相对下降约 30–45%，延迟增加可接受。',
    nodes: [
      {
        id: 'lit-root',
        role: '根代理 · 文献综述',
        kind: 'root',
        parentId: null,
        tokensIn: 3600,
        tokensOut: 76,
        compacted: false,
        rawFindings: [
          '收到检索子代理摘要：论文A 降 42%（+180ms）、论文B 降 31%',
          '收到合成子代理摘要：论文C 降 38%，延迟可接受',
        ],
        reportedUp: '（根代理，直接产出最终答案）',
        droppedFacts: [],
      },
      {
        id: 'lit-search',
        role: '论文检索子代理',
        kind: 'sub',
        parentId: 'lit-root',
        tokensIn: 8200,
        tokensOut: 40,
        compacted: true,
        rawFindings: ['汇总论文A、论文B 叶子的核心数字'],
        reportedUp: '论文A：降 42%（+180ms）；论文B：降 31%',
        droppedFacts: [],
      },
      {
        id: 'lit-a',
        role: '论文A 叶子',
        kind: 'leaf',
        parentId: 'lit-search',
        tokensIn: 10400,
        tokensOut: 36,
        compacted: true,
        rawFindings: [
          '论文A：7B 模型 +RAG，事实问答幻觉率下降 42%',
          '推理延迟 +180ms',
        ],
        reportedUp: '论文A：降 42%，延迟 +180ms',
        droppedFacts: [],
      },
      {
        id: 'lit-b',
        role: '论文B 叶子',
        kind: 'leaf',
        parentId: 'lit-search',
        tokensIn: 9700,
        tokensOut: 22,
        compacted: true,
        rawFindings: ['论文B：同类基准下幻觉率下降 31%'],
        reportedUp: '论文B：降 31%',
        droppedFacts: [],
      },
      {
        id: 'lit-synth',
        role: '结论合成子代理',
        kind: 'sub',
        parentId: 'lit-root',
        tokensIn: 5100,
        tokensOut: 30,
        compacted: false,
        rawFindings: ['论文C：幻觉率下降 38%，延迟增加可接受'],
        reportedUp: '论文C：降 38%，延迟可接受',
        droppedFacts: [],
      },
      {
        id: 'lit-c',
        role: '论文C 叶子',
        kind: 'leaf',
        parentId: 'lit-synth',
        tokensIn: 8800,
        tokensOut: 28,
        compacted: false,
        rawFindings: ['论文C：7B+RAG 幻觉率下降 38%', '延迟增加在可接受范围'],
        reportedUp: '论文C：降 38%，延迟可接受',
        droppedFacts: [],
      },
    ],
    claims: [
      {
        id: 'lit-c1',
        text: '幻觉率相对下降约 30–45%',
        sourceNodeId: 'lit-a',
        survival: 'intact',
        affectsAction: false,
        explanation:
          '三个叶子的原始数字（42% / 31% / 38%）均落在区间内，压缩仅去除冗余、未丢承重事实，结论存续。',
      },
      {
        id: 'lit-c2',
        text: '延迟增加可接受',
        sourceNodeId: 'lit-c',
        survival: 'intact',
        affectsAction: false,
        explanation:
          '论文A（+180ms）与论文C（可接受）的原始结论在压缩后保持一致，无承重信息丢失。',
      },
      {
        id: 'lit-c3',
        text: '三项研究一致表明',
        sourceNodeId: 'lit-b',
        survival: 'intact',
        affectsAction: false,
        explanation:
          '三个来源方向一致，压缩链中无被丢弃的反证，「一致表明」的措辞得到根脉支撑。',
      },
    ],
  },
];
