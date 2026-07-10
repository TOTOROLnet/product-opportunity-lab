import type { Scenario } from '../types';

// ⚠️ 全部为 mock / 预先标注的示例数据。
// 「模型生成的界面」与「每个元素的 grounding 判定」都是预置的，用于演示 Pane 的价值，
// 不代表任何真实模型推理、真实价格或真实账单。

export const SCENARIOS: Scenario[] = [
  // 场景 1：订机票 —— 一个被编造的最低价 + 一个"看起来能下单其实是占位"的按钮
  {
    id: 'flights',
    tab: '订东京机票',
    title: '去东京 · 机票比价',
    userPrompt: '帮我找去东京最便宜的机票，直接帮我订。',
    assistantIntro: '已为你生成一个机票比价界面，并给出最低价与预订入口：',
    paneVerdict: 'caught',
    verdictNote:
      '头条"最低价 ¥1,280"是模型推测且与已核实报价不符；"立即预订"是未绑定真实下单能力的占位按钮——两者在裸界面里都毫无破绽。',
    elements: [
      {
        id: 'f-headline',
        kind: 'metric',
        label: '最低价',
        value: '¥1,280',
        grounding: 'guessed',
        provenance: {
          source: '模型推测',
          reason:
            '模型综合"印象中的廉航价格"给出的估算，未与任何一家航司的实时报价核对。已核实的最低真实报价其实是 ¥1,980（国航 CA168）。',
        },
      },
      {
        id: 'f-row-nh',
        kind: 'row',
        label: 'NH956 · 全日空 08:30 → 13:10',
        value: '¥2,180',
        grounding: 'verified',
        provenance: {
          source: '示例航司数据集 (mock)',
          fetchedAt: '2026-07-10 09:12',
          reason: '来自航司报价示例数据，含航班号、时刻与价格，可核对。',
        },
      },
      {
        id: 'f-row-ca',
        kind: 'row',
        label: 'CA168 · 国航 10:05 → 15:00',
        value: '¥1,980',
        highlight: true,
        grounding: 'verified',
        provenance: {
          source: '示例航司数据集 (mock)',
          fetchedAt: '2026-07-10 09:12',
          reason: '来自航司报价示例数据，是本次已核实结果里真正的最低价。',
        },
      },
      {
        id: 'f-row-ll',
        kind: 'row',
        label: 'SL** · 承运人未定 时刻未定',
        value: '¥1,280',
        grounding: 'guessed',
        provenance: {
          source: '模型推测',
          reason: '航班号、承运人、时刻均为模型占位补全，价格未与任何来源核对。',
        },
      },
      {
        id: 'f-act-book',
        kind: 'action',
        label: '立即预订 ¥1,280',
        grounding: 'placeholder',
        provenance: {
          source: '模型生成的展示元素',
          reason:
            '这个按钮是模型为了"界面完整"生成的，并未绑定任何真实预订能力。在裸界面里它和真正的下单按钮长得一模一样。',
        },
        action: {
          realBinding: false,
          plainEffect: '（未绑定真实预订能力：即使点击也不会真正下单，但用户无从分辨。）',
          risk: 'none',
        },
      },
      {
        id: 'f-act-detail',
        kind: 'action',
        label: '查看 NH956 详情',
        grounding: 'verified',
        provenance: {
          source: '示例航司数据集 (mock)',
          fetchedAt: '2026-07-10 09:12',
          reason: '绑定到已核实航班的只读详情，无副作用。',
        },
        action: {
          realBinding: true,
          plainEffect: '打开全日空 NH956 的示例详情页（只读，不花钱、不下单）。',
          risk: 'safe',
        },
      },
    ],
  },

  // 场景 2：账单分析 —— 一个被算错的头条总额（与已核实明细矛盾）+ 一个真花钱的按钮
  {
    id: 'bills',
    tab: '账单分析',
    title: '本月账单 · 分析与分期',
    userPrompt: '帮我看看这个月一共花了多少，能不能分期？',
    assistantIntro: '已为你生成本月支出概览，并给出分期入口：',
    paneVerdict: 'caught',
    verdictNote:
      '头条"本月支出 ¥8,640"是模型推测，且与已核实明细求和（¥7,910）自相矛盾；"一键分期"是会真实花钱的动作，需明文预检与确认。',
    elements: [
      {
        id: 'b-headline',
        kind: 'metric',
        label: '本月支出',
        value: '¥8,640',
        grounding: 'guessed',
        provenance: {
          source: '模型推测',
          reason:
            '模型对交易求和时重复计入了一笔并算错一笔，得到 ¥8,640；而下方已核实明细求和为 ¥7,910，两者矛盾。头条数字未经核对。',
        },
      },
      {
        id: 'b-rent',
        kind: 'row',
        label: '房租',
        value: '¥4,200',
        grounding: 'verified',
        provenance: {
          source: '示例账单流水 (mock)',
          fetchedAt: '2026-07-10 08:40',
          reason: '来自账单流水明细，单笔可核对。',
        },
      },
      {
        id: 'b-food',
        kind: 'row',
        label: '餐饮',
        value: '¥1,860',
        grounding: 'verified',
        provenance: {
          source: '示例账单流水 (mock)',
          fetchedAt: '2026-07-10 08:40',
          reason: '来自账单流水明细，单笔可核对。',
        },
      },
      {
        id: 'b-transport',
        kind: 'row',
        label: '交通',
        value: '¥520',
        grounding: 'verified',
        provenance: {
          source: '示例账单流水 (mock)',
          fetchedAt: '2026-07-10 08:40',
          reason: '来自账单流水明细，单笔可核对。',
        },
      },
      {
        id: 'b-sub',
        kind: 'row',
        label: '订阅',
        value: '¥330',
        grounding: 'verified',
        provenance: {
          source: '示例账单流水 (mock)',
          fetchedAt: '2026-07-10 08:40',
          reason: '来自账单流水明细，单笔可核对。',
        },
      },
      {
        id: 'b-shop',
        kind: 'row',
        label: '购物',
        value: '¥1,000',
        grounding: 'verified',
        provenance: {
          source: '示例账单流水 (mock)',
          fetchedAt: '2026-07-10 08:40',
          reason: '来自账单流水明细，单笔可核对。',
        },
      },
      {
        id: 'b-verified-sum',
        kind: 'note',
        label: '已核实明细合计 = ¥7,910（≠ 头条的 ¥8,640）',
        grounding: 'verified',
        provenance: {
          source: 'Pane 对已核实明细求和',
          reason: '对上方 5 笔已核实明细逐项求和得到 ¥7,910，用于交叉校验头条数字。',
        },
      },
      {
        id: 'b-act-installment',
        kind: 'action',
        label: '一键分期（12 期）',
        grounding: 'verified',
        provenance: {
          source: '绑定到真实分期能力 (mock)',
          reason: '这是一个真实动作按钮，点击会发起真实分期申请——风险高，必须明文预检。',
        },
        action: {
          realBinding: true,
          plainEffect:
            '会真实向你的信用卡发起一笔 12 期分期申请，预计手续费约 ¥520。此操作会花钱且可能影响征信。',
          risk: 'money',
        },
      },
    ],
  },

  // 场景 3：食谱换算 —— 对照组：全部 grounded，Pane 为其背书（证明不是狼来了报警器）
  {
    id: 'recipe',
    tab: '食谱换算',
    title: '番茄意面 · 6 人份换算',
    userPrompt: '把这份 2 人份的番茄意面食谱换算成 6 人份。',
    assistantIntro: '已按 6 人份（×3）为你生成换算后的食材清单：',
    paneVerdict: 'endorsed',
    verdictNote:
      '这份界面完全 grounded：每一项都来自原食谱的线性换算，没有推测项、没有占位按钮。Pane 为它整体背书——不是每个界面都要报警，可信的就该被明确背书。',
    elements: [
      {
        id: 'r-headline',
        kind: 'metric',
        label: '换算系数',
        value: '×3（2 人 → 6 人）',
        grounding: 'verified',
        provenance: {
          source: '原食谱 (mock) 线性换算',
          fetchedAt: '2026-07-10 09:20',
          reason: '基于原食谱 2 人份按比例放大 3 倍，系数来源明确、可复核。',
        },
      },
      {
        id: 'r-pasta',
        kind: 'row',
        label: '意面',
        value: '480 g',
        grounding: 'verified',
        provenance: {
          source: '原食谱 160g ×3',
          fetchedAt: '2026-07-10 09:20',
          reason: '原食谱 160g 线性换算，可复核。',
        },
      },
      {
        id: 'r-tomato',
        kind: 'row',
        label: '番茄',
        value: '6 个',
        grounding: 'verified',
        provenance: {
          source: '原食谱 2 个 ×3',
          fetchedAt: '2026-07-10 09:20',
          reason: '原食谱 2 个线性换算，可复核。',
        },
      },
      {
        id: 'r-garlic',
        kind: 'row',
        label: '大蒜',
        value: '6 瓣',
        grounding: 'verified',
        provenance: {
          source: '原食谱 2 瓣 ×3',
          fetchedAt: '2026-07-10 09:20',
          reason: '原食谱 2 瓣线性换算，可复核。',
        },
      },
      {
        id: 'r-oil',
        kind: 'row',
        label: '橄榄油',
        value: '45 ml',
        grounding: 'verified',
        provenance: {
          source: '原食谱 15ml ×3',
          fetchedAt: '2026-07-10 09:20',
          reason: '原食谱 15ml 线性换算，可复核。',
        },
      },
      {
        id: 'r-note',
        kind: 'note',
        label: '全部食材均来自原食谱线性换算，无模型推测项。',
        grounding: 'verified',
        provenance: {
          source: 'Pane 汇总',
          reason: '本界面所有元素 grounding 均为 verified，无 guessed / placeholder。',
        },
      },
      {
        id: 'r-act-list',
        kind: 'action',
        label: '生成购物清单',
        grounding: 'verified',
        provenance: {
          source: '绑定到只读清单生成 (mock)',
          reason: '把已核实食材整理为只读购物清单，无副作用。',
        },
        action: {
          realBinding: true,
          plainEffect: '把上面已核实的食材生成一份只读购物清单（不下单、不花钱）。',
          risk: 'safe',
        },
      },
    ],
  },
];
