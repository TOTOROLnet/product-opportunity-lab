import type { Autonomy, Interaction, Situation, Stakes, Topic } from '../types';

// ————— 话题 / 风险 / 授权档的展示文案 —————

export const TOPIC_LABEL: Record<Topic, string> = {
  schedule: '排期改约',
  followup: '客户跟进',
  billing: '订阅账单',
  negotiate: '报价谈判',
  access: '维修准入',
  lend: '人情借钱',
  family: '家人事务',
  sales: '陌生销售',
};

export const TOPIC_ICON: Record<Topic, string> = {
  schedule: '🗓️',
  followup: '📨',
  billing: '💳',
  negotiate: '🤝',
  access: '🔑',
  lend: '💸',
  family: '👪',
  sales: '📞',
};

export const STAKES_LABEL: Record<Stakes, string> = {
  low: '低风险',
  mid: '中风险',
  high: '高风险',
};

export const AUTONOMY_LABEL: Record<Autonomy, string> = {
  handle: '放手让它做',
  draft: '拟稿待批',
  ask: '先问我',
  never: '绝不可碰',
};

export const AUTONOMY_SHORT: Record<Autonomy, string> = {
  handle: '放手',
  draft: '拟稿',
  ask: '先问',
  never: '禁碰',
};

export const OUTCOME_LABEL: Record<string, string> = {
  handled: '替你处理',
  draft: '拟稿待批',
  ask: '退回拍板',
  blocked: '直接拦下',
};

// 话题在彩排中的展示顺序（也是画像矩阵的行顺序）。
export const TOPIC_ORDER: Topic[] = [
  'schedule',
  'followup',
  'sales',
  'billing',
  'negotiate',
  'access',
  'lend',
  'family',
];

// ————— 彩排情境卡（8 张，一张一个话题，全部虚构）—————

export const SITUATIONS: Situation[] = [
  {
    id: 's1',
    topic: 'schedule',
    stakes: 'low',
    title: '供应商想把例会挪 30 分钟',
    context: '一位长期供应商发消息，想把明早 10:00 的例会往后挪到 10:30。',
    proposedAction: '代表打算：直接回复同意并顺手更新你的日历，不来打扰你。',
    voiceSample: '「没问题，改到 10:30，我这边日历已经更新啦，明天见～」',
    toneFixHint: '你更常用简短、少语气词的回法，如「好，10:30」。',
  },
  {
    id: 's2',
    topic: 'followup',
    stakes: 'low',
    title: '两周没回的潜在客户',
    context: '一个两周没回复的潜在客户，代表想主动发一封轻催跟进邮件。',
    proposedAction: '代表打算：以你的名义发送一封跟进邮件，附上上次方案要点。',
    voiceSample: '「上次的方案不知您这边是否还有兴趣？我把要点再附一份，随时聊。」',
    toneFixHint: '你倾向更克制，不主动"轻催"，只在对方问起时回复。',
  },
  {
    id: 's3',
    topic: 'sales',
    stakes: 'low',
    title: '陌生推销贷款来电',
    context: '一个陌生号码来电，识别为推销贷款。',
    proposedAction: '代表打算：礼貌拒绝、挂断并把号码拉黑，不来打扰你。',
    voiceSample: '「谢谢，暂时不需要，祝好。」（随后挂断并标记骚扰）',
    toneFixHint: '你希望它直接挂断即可，连"谢谢"都不必说。',
  },
  {
    id: 's4',
    topic: 'billing',
    stakes: 'mid',
    title: '订阅明天将按 2× 自动续费',
    context: '你的一个 SaaS 订阅明天到期，将按新价（约为原价 2 倍）自动续费。',
    proposedAction: '代表打算：先暂停自动续费，并向对方要一个老价格的续订链接，然后拟稿等你点头。',
    voiceSample: '「我们想继续使用，但新价偏高，是否能提供老客户续订价？」',
    toneFixHint: '这封基本像你，语气可以再直接一点。',
  },
  {
    id: 's5',
    topic: 'negotiate',
    stakes: 'high',
    title: '猎头来电想现在敲定薪资',
    context: '一位猎头来电给出 offer，想现在就口头敲定你能接受的薪资区间。',
    proposedAction: '代表打算：以你的名义口头确认「这个区间可以接受」，替你把话说定。',
    voiceSample: '「这个区间我可以接受，你们走流程吧。」',
    toneFixHint: '薪资这种事你从不让别人替你"把话说定"，口吻不是重点、边界才是。',
  },
  {
    id: 's6',
    topic: 'access',
    stakes: 'high',
    title: '房东要放维修工进你家',
    context: '房东要求明天下午让维修工进你家换水管，问钥匙怎么给。',
    proposedAction: '代表打算：回复同意进入，并告知「钥匙放门口花盆下」。',
    voiceSample: '「明天下午可以进，钥匙放在门口花盆下面，麻烦了。」',
    toneFixHint: '让陌生人进家、且透露钥匙位置——你不会让任何人代你决定。',
  },
  {
    id: 's7',
    topic: 'lend',
    stakes: 'high',
    title: '老朋友想借 5000 元周转',
    context: '一位老朋友发消息，想周转借 5000 元，问你方不方便。',
    proposedAction: '代表打算：以你的口吻先答应「没问题，今晚转给你」。',
    voiceSample: '「没问题，我今晚就转给你，别客气。」',
    toneFixHint: '借钱是关系里的大事，你要亲自回，代表不该替你答应。',
  },
  {
    id: 's8',
    topic: 'family',
    stakes: 'high',
    title: '妈妈身体不舒服来电',
    context: '妈妈打来电话说身体不太舒服，想让你现在决定要不要去医院。',
    proposedAction: '代表打算：替你接起、安抚，并代你拿主意「先在家观察」。',
    voiceSample: '「妈你别急，先在家观察一下，我这边有事晚点打给你。」',
    toneFixHint: '家人健康决策你必须亲自在场，代表最多帮你先接起、立刻转给你。',
  },
];

// ————— 一周 mock 互动（15 条，用于回放；全部虚构）—————

export const WEEK_INTERACTIONS: Interaction[] = [
  { id: 'w1', topic: 'schedule', stakes: 'low', day: '周一', time: '09:12', summary: '客户想把周三的评审会提前一小时' },
  { id: 'w2', topic: 'sales', stakes: 'low', day: '周一', time: '11:40', summary: '陌生号码推销企业保险' },
  { id: 'w3', topic: 'followup', stakes: 'low', day: '周一', time: '15:03', summary: '给三天没回的供应商发跟进' },
  { id: 'w4', topic: 'billing', stakes: 'mid', day: '周二', time: '08:50', summary: '云服务下月起涨价 30%，要不要续' },
  { id: 'w5', topic: 'schedule', stakes: 'mid', day: '周二', time: '13:20', summary: '与重要客户的午餐要改到别的城市' },
  { id: 'w6', topic: 'negotiate', stakes: 'high', day: '周二', time: '17:45', summary: '合作方要求现在口头确认返点比例' },
  { id: 'w7', topic: 'access', stakes: 'high', day: '周三', time: '10:05', summary: '物业要进屋检修燃气，问何时可进' },
  { id: 'w8', topic: 'negotiate', stakes: 'mid', day: '周三', time: '14:30', summary: '供应商问能否把账期从 30 天延到 45 天' },
  { id: 'w9', topic: 'lend', stakes: 'high', day: '周三', time: '21:10', summary: '亲戚想借 20000 元应急' },
  { id: 'w10', topic: 'family', stakes: 'high', day: '周四', time: '07:30', summary: '爸爸问要不要陪爷爷去做复查' },
  { id: 'w11', topic: 'billing', stakes: 'high', day: '周四', time: '16:18', summary: '一年期合同今晚到期，续签涉及 4 万元' },
  { id: 'w12', topic: 'sales', stakes: 'mid', day: '周四', time: '18:00', summary: '老供应商推销一个可能有用的新模块' },
  { id: 'w13', topic: 'followup', stakes: 'mid', day: '周五', time: '10:22', summary: '给卡在决策的大客户发跟进并给个小让步' },
  { id: 'w14', topic: 'access', stakes: 'mid', day: '周五', time: '13:55', summary: '快递想把包裹放到邻居家代收' },
  { id: 'w15', topic: 'family', stakes: 'low', day: '周五', time: '19:40', summary: '妈妈问周末回不回家吃饭' },
];

// ————— 默认拍板（新手第一次、偏放手的合理设定）—————
// 用于两点：①未彩排时画像有一个可用起点；②回放里能看到"差点出格"的几件，供收紧演示。
// 每个话题在其彩排卡的风险档上给出一个默认授权档。
export const DEFAULT_DECISIONS: Record<Topic, Autonomy> = {
  schedule: 'handle',
  followup: 'handle',
  sales: 'handle',
  billing: 'draft',
  negotiate: 'draft', // 高风险却放到"拟稿"，回放里会成为"差点出格"来源
  access: 'draft', // 同上
  lend: 'ask',
  family: 'ask',
};
