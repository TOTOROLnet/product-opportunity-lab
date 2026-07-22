import type { Scenario } from '../types';

// ── 场景数据（全部 mock，硬编码，不接任何真实后端 / 支付 / 外部 API）──
// 叙事：你把「订上海酒店」这件要花钱的事交给了 AI 消费 agent。
// agent 跑完带回 4 笔「即将成交」的订单，CommitGuard 在成交前逐单拦下待你核验。
// 真实产品里，下列每个字段都来自 AI 对商户结账页的解析；此处用确定性数据代理。

export const scenario: Scenario = {
  task: {
    title: '订下周五去上海的酒店，住 2 晚',
    delegatedTo: 'AI 消费 agent「跑腿」',
    constraints: ['每晚含税 ≤ ¥800', '必须可以免费取消', '地点：上海市区', '只订酒店（未授权买别的）'],
    currency: '¥',
  },
  orders: [
    // ── 订单 1：酒店，建议「让 agent 改」（隐藏费 + 违反免费取消 + 预勾选加购）──
    {
      id: 'ord-hotel-tripflash',
      category: 'hotel',
      merchant: '旅行酷订 TripFlash（第三方聚合）',
      title: '上海·外滩临江精选酒店 2 晚',
      agentNote: '这是搜索结果里价格最低的一档，首屏 ¥699/晚。',
      listedPrice: 1398,
      costLines: [
        { label: '房费（2 晚 × ¥699）', amount: 1398, hidden: false },
        { label: '税费（10%）', amount: 140, hidden: true },
        { label: '平台服务费', amount: 120, hidden: true },
        { label: '城市建设税', amount: 60, hidden: true },
      ],
      intentChecks: [
        { label: '可免费取消', required: '必须可免费取消', actual: '「不可取消特惠价」', ok: false },
        { label: '每晚含税 ≤ ¥800', required: '≤ ¥800/晚', actual: '实际 ¥859/晚（含税费）', ok: false },
        { label: '地点', required: '上海市区', actual: '上海·外滩', ok: true },
        { label: '日期', required: '下周五起 2 晚', actual: '下周五起 2 晚', ok: true },
      ],
      traps: [
        {
          type: '不可退',
          title: '「特惠价」实为不可取消',
          detail: '成交即锁定，全额不可退、不可改期——与你「必须免费取消」的要求直接冲突。',
          severity: 'high',
        },
        {
          type: '隐藏费 / drip pricing',
          title: '首屏 ¥699/晚，结算前追加 ¥320 税费杂费',
          detail: '标价只展示房费，税费 / 服务费 / 城市税要到最后一步才加，隐藏了真实总价的 19%。',
          severity: 'medium',
        },
        {
          type: '预勾选加购',
          title: '默认替你勾选了「¥88 旅行意外险」',
          detail: '加购项被默认勾选，不手动取消就会一起付掉。',
          severity: 'medium',
        },
      ],
      reversibility: {
        score: 8,
        refundWindow: '无（特惠不可取消）',
        refundDifficulty: '极高',
        cancelPath: '不可取消',
        summary: '一旦成交，全额不可退、改期也不行。',
      },
      merchantTrust: { score: 62, note: '第三方聚合票代，非酒店官方直订，客诉响应较慢。' },
      recommendation: 'modify',
      modifyInstruction:
        '改订同酒店「可免费取消」房型，去掉预勾选的旅行意外险，并把含税总价控制在 ¥1600 内（≤¥800/晚）。',
    },

    // ── 订单 2：订阅，建议「拒绝」（¥1 试用背后自动续订 + 取消困难）──
    {
      id: 'ord-sub-pixelmuse',
      category: 'subscription',
      merchant: 'PixelMuse AI',
      title: 'PixelMuse Pro 会员 · 首月 ¥1 体验',
      agentNote: '订酒店时看到弹窗推荐，首月只要 ¥1，顺手帮你开了做行程海报。',
      listedPrice: 1,
      costLines: [
        { label: '首月体验价', amount: 1, hidden: false },
        { label: '次月起自动续订（¥199/月 × 11）', amount: 2189, hidden: true },
      ],
      intentChecks: [
        { label: '不要自动续费', required: '只体验、不要自动扣款', actual: '试用结束自动转 ¥199/月', ok: false },
        { label: '任务范围', required: '只订酒店', actual: '额外开通了一个订阅', ok: false },
      ],
      traps: [
        {
          type: '自动续订',
          title: '「首月 ¥1」到期自动续订 ¥199/月',
          detail: '试用结束不提醒、直接扣款；首年真实成本约 ¥2190，而非 ¥1。',
          severity: 'high',
        },
        {
          type: '取消困难',
          title: '取消需发邮件并等 3 个工作日审核',
          detail: '无一键退订入口，且不退当期已扣费用。',
          severity: 'high',
        },
        {
          type: '紧迫感话术',
          title: '「仅剩 2 个 ¥1 名额」制造抢购',
          detail: '用虚假稀缺催你立刻确认，压缩你思考的时间。',
          severity: 'low',
        },
      ],
      reversibility: {
        score: 22,
        refundWindow: '自动续订后不退当期',
        refundDifficulty: '高（需邮件人工审核）',
        cancelPath: '邮件申请 + 3 工作日',
        summary: '会自动扣款，取消要跨好几步且不退当期费用。',
      },
      merchantTrust: { score: 55, note: '订阅条款藏在二级页面，历史有「取消困难」投诉。' },
      recommendation: 'reject',
      modifyInstruction: '本任务只授权订酒店，未授权开通任何订阅——取消此单。',
    },

    // ── 订单 3：机票，建议「拒绝」（越权 + drip pricing + 不可退）──
    {
      id: 'ord-flight-fastfare',
      category: 'flight',
      merchant: '极速特惠票（聚合票代）',
      title: '上海往返·特价机票',
      agentNote: '顺手帮你把往返机票也订了，看到有 ¥450 的特价。',
      listedPrice: 450,
      costLines: [
        { label: '票面价', amount: 450, hidden: false },
        { label: '选座费', amount: 80, hidden: true },
        { label: '行李费', amount: 120, hidden: true },
        { label: '出票服务费', amount: 62, hidden: true },
      ],
      intentChecks: [
        { label: '任务范围', required: '只授权订酒店', actual: 'agent 自作主张加订了机票', ok: false },
        { label: '可退改', required: '要能退改', actual: '不可退、不可改签', ok: false },
      ],
      traps: [
        {
          type: '越权成交',
          title: '超出你交代的任务范围',
          detail: '你只让它订酒店，它顺手把机票也买了——agent 的「热心」正在替你做未授权的承诺。',
          severity: 'medium',
        },
        {
          type: '隐藏费 / drip pricing',
          title: '票面 ¥450，加价至 ¥712（+58%）',
          detail: '选座、行李、出票服务费层层追加，真实价比首屏高六成。',
          severity: 'high',
        },
        {
          type: '不可退',
          title: '不可退、不可改签',
          detail: '出票即锁死，行程一变钱就打水漂。',
          severity: 'high',
        },
      ],
      reversibility: {
        score: 5,
        refundWindow: '无',
        refundDifficulty: '极高',
        cancelPath: '不可退改签',
        summary: '出票即不可退不可改，等于把钱锁死。',
      },
      merchantTrust: { score: 40, note: '非航司官方，聚合票代，出票 / 退改纠纷较多。' },
      recommendation: 'reject',
      modifyInstruction: '取消此订单——本次任务只授权订酒店，未授权购买机票。',
    },

    // ── 订单 4：干净的酒店，建议「批准」（意图全对、透明、可退、无陷阱）──
    {
      id: 'ord-hotel-official',
      category: 'hotel',
      merchant: '上海静安某万怡酒店（官方直订）',
      title: '上海·静安舒适大床房 2 晚',
      agentNote: '官方直订，含税价在预算内且可免费取消。',
      listedPrice: 1520,
      costLines: [
        { label: '房费（2 晚 × ¥760，已含税费）', amount: 1520, hidden: false },
      ],
      intentChecks: [
        { label: '可免费取消', required: '必须可免费取消', actual: '入住前 24h 可免费取消', ok: true },
        { label: '每晚含税 ≤ ¥800', required: '≤ ¥800/晚', actual: '¥760/晚（已含税）', ok: true },
        { label: '地点', required: '上海市区', actual: '上海·静安', ok: true },
        { label: '日期', required: '下周五起 2 晚', actual: '下周五起 2 晚', ok: true },
      ],
      traps: [],
      reversibility: {
        score: 92,
        refundWindow: '入住前 24h 全额退',
        refundDifficulty: '低（一键取消）',
        cancelPath: 'App / 官网一键取消',
        summary: '随时可免费取消，钱可控。',
      },
      merchantTrust: { score: 90, note: '酒店官方直订，价格透明、退改政策清晰。' },
      recommendation: 'approve',
      modifyInstruction: '',
    },
  ],
};
