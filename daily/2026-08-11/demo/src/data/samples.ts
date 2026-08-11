import type { Reaction, ReactionKind, SampleData } from '../types';

// 紧凑构造一条反应
const rx = (
  readerId: string,
  sentenceId: string,
  kind: ReactionKind,
  attentionDelta: number,
  note: string,
): Reaction => ({ readerId, sentenceId, kind, attentionDelta, note });

// ————————————————————————————————————————————————————————————
// 样本 1：独立开发者的冷启邮件（目标读者 = 潜在客户/决策者）
// ————————————————————————————————————————————————————————————
const coldEmail: SampleData = {
  sample: {
    id: 'cold-email',
    title: '独立开发者的冷启邮件',
    scene: '你想给一位潜在客户发一封自荐/合作邮件，只发一次，发错就石沉大海。',
    targetReaderId: 'rp_client',
    panel: ['rp_client', 'rp_skim', 'rp_skeptic', 'rp_peer'],
    sentences: [
      { id: 's1', text: '您好！我是一名充满热情、经验丰富的全栈独立开发者。' },
      { id: 's2', text: '我做过很多项目，技术栈非常全面，前后端、移动端几乎什么都能做。' },
      { id: 's3', text: '我最近关注到贵公司，觉得你们做得非常棒、很有潜力。' },
      { id: 's4', text: '不知道您这边最近有没有外包或者兼职方面的需求？' },
      { id: 's5', text: '如果有机会合作，我一定全力以赴，价格也好商量。' },
      { id: 's6', text: '期待您的回复，感谢！' },
    ],
  },
  baseReactions: [
    rx('rp_client', 's1', 'bored', -10, '又一个自我吹嘘的开头，跟我有什么关系？'),
    rx('rp_client', 's2', 'skeptical', -15, '“什么都能做”听着像“什么都不精”，不信。'),
    rx('rp_client', 's3', 'bored', -12, '泛泛的恭维，你根本没研究过我们。'),
    rx('rp_client', 's4', 'drop', -20, '读到这才提需求，而且很模糊——我没时间了。'),
    rx('rp_client', 's5', 'skeptical', -10, '“价格好商量”透着廉价，更像在推销自己。'),
    rx('rp_client', 's6', 'bored', -6, '标准客套，没有任何具体下一步。'),

    rx('rp_skim', 's1', 'bored', -12, '开头全是形容词，扫不到重点。'),
    rx('rp_skim', 's2', 'bored', -12, '一大串技术名词，我只想知道你能帮我什么。'),
    rx('rp_skim', 's3', 'drop', -15, '还在铺垫，走了。'),
    rx('rp_skim', 's4', 'bored', -8, '需求问得很含糊。'),
    rx('rp_skim', 's5', 'bored', -8, '没重点。'),
    rx('rp_skim', 's6', 'bored', -6, '结束了也没记住什么。'),

    rx('rp_skeptic', 's1', 'skeptical', -8, '“充满热情、经验丰富”是自封的形容词。'),
    rx('rp_skeptic', 's2', 'skeptical', -18, '“几乎什么都能做”——证据在哪？'),
    rx('rp_skeptic', 's3', 'skeptical', -12, '凭什么说我们有潜力？你了解我们吗？'),
    rx('rp_skeptic', 's4', 'confused', -8, '所以你到底想承接什么？说清楚。'),
    rx('rp_skeptic', 's5', 'skeptical', -14, '“价格好商量”=对自己价值不自信。'),
    rx('rp_skeptic', 's6', 'bored', -6, '没有可核实的东西。'),

    rx('rp_peer', 's1', 'bored', -8, '开头零信息量。'),
    rx('rp_peer', 's2', 'skeptical', -14, '技术栈罗列太泛，看不出深度。'),
    rx('rp_peer', 's3', 'bored', -10, '没有任何具体观察。'),
    rx('rp_peer', 's4', 'confused', -8, '需求描述模糊，接不住。'),
    rx('rp_peer', 's5', 'skeptical', -10, '谈价格前先谈价值嘛。'),
    rx('rp_peer', 's6', 'bored', -6, '缺一个明确的下一步。'),
  ],
  edits: [
    {
      id: 'e1',
      label: '删掉自夸开头，第一句换成对客户的具体观察',
      rationale: '开场不谈“我多厉害”，而谈“我注意到你们最近做了什么”，证明你做过功课——改的是切入角度，不是措辞。',
      overrides: [
        rx('rp_client', 's1', 'engaged', 10, '开头就点到我们刚上线的功能，看来做过功课。'),
        rx('rp_skim', 's1', 'engaged', 8, '第一句就有具体信息，愿意继续。'),
        rx('rp_skeptic', 's1', 'engaged', 6, '是具体观察，不是自封形容词。'),
        rx('rp_peer', 's1', 'engaged', 6, '开头有信息量，像懂行的人。'),
      ],
    },
    {
      id: 'e2',
      label: '把“我能帮你解决的具体问题 + 证据”前置',
      rationale: '把价值主张和一个可核实的案例提到前面，让 s4 的请求自然落地——改的是信息顺序与证据，不是语法。',
      overrides: [
        rx('rp_client', 's2', 'engaged', 12, '直接说能帮我把上线周期缩短一半，这才是我关心的。'),
        rx('rp_client', 's3', 'engaged', 8, '还给了一个做过的同类案例，可信。'),
        rx('rp_client', 's4', 'engaged', 6, '前面铺垫够了，这个请求很自然。'),
        rx('rp_skim', 's2', 'engaged', 10, '一眼看到“帮你省时间”，抓住了。'),
        rx('rp_skim', 's3', 'engaged', 6, '有个具体数字，记住了。'),
        rx('rp_skim', 's4', 'engaged', 4, '请求清楚。'),
        rx('rp_skeptic', 's2', 'engaged', 8, '有具体承诺和范围了。'),
        rx('rp_skeptic', 's3', 'engaged', 6, '给了可核实的案例。'),
        rx('rp_skeptic', 's4', 'engaged', 2, '请求还算具体。'),
        rx('rp_peer', 's2', 'engaged', 8, '能看出真的懂这个问题。'),
        rx('rp_peer', 's3', 'engaged', 6, '案例有细节。'),
        rx('rp_peer', 's4', 'engaged', 4, '承接范围清晰。'),
      ],
    },
    {
      id: 'e3',
      label: '删掉“价格好商量”，换成一个低门槛的下一步 CTA',
      rationale: '不谈虚的价格，给一个具体、低门槛的下一步（15 分钟通话 + 一个免费样例）——改的是行动召唤，不是客套。',
      overrides: [
        rx('rp_client', 's5', 'engaged', 8, '给了明确的下一步（15 分钟通话 + 一个样例），不用我费劲。'),
        rx('rp_client', 's6', 'engaged', 6, '收尾干净，有具体时间选项。'),
        rx('rp_skim', 's5', 'engaged', 6, '一句话 CTA，清楚。'),
        rx('rp_skim', 's6', 'engaged', 4, '知道该干嘛了。'),
        rx('rp_skeptic', 's5', 'engaged', 8, '不谈虚的价格，谈具体动作，加分。'),
        rx('rp_skeptic', 's6', 'engaged', 4, '收尾专业。'),
        rx('rp_peer', 's5', 'engaged', 6, 'CTA 具体。'),
        rx('rp_peer', 's6', 'engaged', 4, '利落。'),
      ],
    },
  ],
};

// ————————————————————————————————————————————————————————————
// 样本 2：应届生求职信开头（目标读者 = 招聘经理）
// ————————————————————————————————————————————————————————————
const coverLetter: SampleData = {
  sample: {
    id: 'cover-letter',
    title: '应届生的求职信开头',
    scene: '你要投递一个心仪岗位，这段自我介绍决定招聘经理是否继续看你的简历。',
    targetReaderId: 'rp_hr',
    panel: ['rp_hr', 'rp_skim', 'rp_skeptic', 'rp_peer'],
    sentences: [
      { id: 's1', text: '尊敬的招聘官您好，我怀着无比激动的心情投递这个职位。' },
      { id: 's2', text: '我性格开朗、学习能力强、抗压能力好，是个能快速上手的人。' },
      { id: 's3', text: '在校期间我担任过学生会干部，组织过多次大型活动。' },
      { id: 's4', text: '我相信自己完全能够胜任贵公司的这个岗位。' },
      { id: 's5', text: '希望能给我一个面试机会，我一定不会让您失望。' },
    ],
  },
  baseReactions: [
    rx('rp_hr', 's1', 'bored', -12, '“无比激动”的模板开头，我看过一千封。'),
    rx('rp_hr', 's2', 'skeptical', -14, '全是形容词，跟这个岗位有什么关系？'),
    rx('rp_hr', 's3', 'confused', -10, '学生会活动和我招的岗位有什么关联？'),
    rx('rp_hr', 's4', 'drop', -18, '空喊“完全能胜任”却没有一条证据，pass。'),
    rx('rp_hr', 's5', 'bored', -6, '又是“不会让您失望”的套话。'),

    rx('rp_skim', 's1', 'bored', -12, '模板开头，扫过。'),
    rx('rp_skim', 's2', 'bored', -14, '形容词堆砌，没重点。'),
    rx('rp_skim', 's3', 'drop', -12, '还没说到岗位相关，走了。'),
    rx('rp_skim', 's4', 'bored', -8, '空话。'),
    rx('rp_skim', 's5', 'bored', -6, '没记住。'),

    rx('rp_skeptic', 's1', 'skeptical', -8, '“无比激动”——套话。'),
    rx('rp_skeptic', 's2', 'skeptical', -16, '“学习能力强”谁都会写，证据呢？'),
    rx('rp_skeptic', 's3', 'skeptical', -10, '组织活动 ≠ 能做这个岗位的活。'),
    rx('rp_skeptic', 's4', 'skeptical', -14, '“完全能胜任”是最没说服力的一句。'),
    rx('rp_skeptic', 's5', 'skeptical', -8, '“不会让您失望”不可核实。'),

    rx('rp_peer', 's1', 'bored', -8, '零信息开头。'),
    rx('rp_peer', 's2', 'bored', -12, '没有与岗位匹配的硬信息。'),
    rx('rp_peer', 's3', 'confused', -10, '看不出可迁移的能力。'),
    rx('rp_peer', 's4', 'skeptical', -12, '结论先行、缺论据。'),
    rx('rp_peer', 's5', 'bored', -6, '没有具体的作品或数据。'),
  ],
  edits: [
    {
      id: 'e1',
      label: '删掉“激动”套话，开头直接点岗位 + 一个匹配的硬事实',
      rationale: '第一句不谈心情，谈“我为什么正好适合这个岗位”的一个具体事实——改的是开场焦点。',
      overrides: [
        rx('rp_hr', 's1', 'engaged', 10, '开头就对上了岗位关键词 + 一个具体成绩，愿意看下去。'),
        rx('rp_skim', 's1', 'engaged', 8, '一眼看到岗位相关，抓住了。'),
        rx('rp_skeptic', 's1', 'engaged', 6, '有具体数字，不是套话。'),
        rx('rp_peer', 's1', 'engaged', 6, '开头有硬信息。'),
      ],
    },
    {
      id: 'e2',
      label: '把“我很棒”换成“与岗位相关的具体成果 + 数据”',
      rationale: '用一个可量化的项目结果替代形容词，并把校园经历翻译成岗位可迁移的能力——改的是证据密度。',
      overrides: [
        rx('rp_hr', 's2', 'engaged', 12, '用一个可量化的项目结果替代了形容词，正是我要的。'),
        rx('rp_hr', 's3', 'engaged', 8, '把学生会经历翻译成了岗位可迁移的能力。'),
        rx('rp_skim', 's2', 'engaged', 10, '有数字，记住了。'),
        rx('rp_skim', 's3', 'engaged', 6, '看到相关能力了。'),
        rx('rp_skeptic', 's2', 'engaged', 10, '终于有可核实的成果。'),
        rx('rp_skeptic', 's3', 'engaged', 6, '把经历和岗位联系起来了，服气。'),
        rx('rp_peer', 's2', 'engaged', 8, '成果有细节和数据。'),
        rx('rp_peer', 's3', 'engaged', 6, '能力迁移讲清楚了。'),
      ],
    },
    {
      id: 'e3',
      label: '删掉“完全能胜任/不会让您失望”，换成作品链接 + 明确下一步',
      rationale: '把“空口结论”换成“可验证的作品 + 可面试时间”，让对方能立刻行动——改的是可验证性。',
      overrides: [
        rx('rp_hr', 's4', 'engaged', 8, '给了作品集链接，可以直接看，不用我猜。'),
        rx('rp_hr', 's5', 'engaged', 6, '收尾专业，附了可面试时间。'),
        rx('rp_skim', 's4', 'engaged', 6, '有链接，清楚。'),
        rx('rp_skim', 's5', 'engaged', 4, '知道下一步了。'),
        rx('rp_skeptic', 's4', 'engaged', 8, '把结论换成了可验证的作品，加分。'),
        rx('rp_skeptic', 's5', 'engaged', 4, '不喊口号了。'),
        rx('rp_peer', 's4', 'engaged', 6, '作品可查。'),
        rx('rp_peer', 's5', 'engaged', 4, '利落。'),
      ],
    },
  ],
};

// ————————————————————————————————————————————————————————————
// 样本 3：一句话融资开场（目标读者 = 早期投资人）
// ————————————————————————————————————————————————————————————
const pitch: SampleData = {
  sample: {
    id: 'pitch',
    title: '一句话融资开场',
    scene: '你要在冷启邮件/路演的头几句里让投资人愿意继续听——错过前 5 句就没有然后了。',
    targetReaderId: 'rp_investor',
    panel: ['rp_investor', 'rp_skim', 'rp_skeptic', 'rp_peer'],
    sentences: [
      { id: 's1', text: '我们正在打造一个革命性的、颠覆行业的 AI 平台。' },
      { id: 's2', text: '我们利用最前沿的大模型技术，赋能千行百业。' },
      { id: 's3', text: '市场空间高达数千亿，我们的天花板极高。' },
      { id: 's4', text: '我们的团队非常优秀，成员都来自顶尖院校。' },
      { id: 's5', text: '我们希望寻求本轮融资，一起改变世界。' },
    ],
  },
  baseReactions: [
    rx('rp_investor', 's1', 'skeptical', -12, '“革命性/颠覆”是危险词，还没说你到底做什么。'),
    rx('rp_investor', 's2', 'bored', -10, '“赋能千行百业”=没有具体客户，太泛。'),
    rx('rp_investor', 's3', 'skeptical', -10, 'TAM 数千亿是自上而下的幻觉，我不看这个。'),
    rx('rp_investor', 's4', 'drop', -16, '到这还没讲清“解决谁的什么问题”，pass。'),
    rx('rp_investor', 's5', 'bored', -6, '“改变世界”的收尾等于什么都没说。'),

    rx('rp_skim', 's1', 'bored', -12, '大词开头，扫一眼。'),
    rx('rp_skim', 's2', 'bored', -12, '还是大词，没重点。'),
    rx('rp_skim', 's3', 'drop', -14, '全是空话，走了。'),
    rx('rp_skim', 's4', 'bored', -8, '没记住。'),
    rx('rp_skim', 's5', 'bored', -6, '口号。'),

    rx('rp_skeptic', 's1', 'skeptical', -10, '“颠覆行业”——先证明你能活下来。'),
    rx('rp_skeptic', 's2', 'skeptical', -14, '“最前沿技术赋能百业”是最空的一句。'),
    rx('rp_skeptic', 's3', 'skeptical', -12, '拿 TAM 说事，没有自下而上的依据。'),
    rx('rp_skeptic', 's4', 'skeptical', -12, '“团队顶尖院校”不等于能做成这件事。'),
    rx('rp_skeptic', 's5', 'skeptical', -8, '“改变世界”不可核实。'),

    rx('rp_peer', 's1', 'bored', -8, '零信息的大词。'),
    rx('rp_peer', 's2', 'skeptical', -12, '没有具体场景与客户。'),
    rx('rp_peer', 's3', 'bored', -10, 'TAM 叙事，行家不吃。'),
    rx('rp_peer', 's4', 'confused', -8, '还是不知道产品到底是什么。'),
    rx('rp_peer', 's5', 'bored', -6, '没有牵引指标。'),
  ],
  edits: [
    {
      id: 'e1',
      label: '去掉“革命性/颠覆”大词，第一句讲清“为谁解决什么”',
      rationale: '开场一句话说清目标用户与具体问题，而不是形容自己多伟大——改的是清晰度。',
      overrides: [
        rx('rp_investor', 's1', 'engaged', 12, '一句话说清了给谁解决什么，我知道你做什么了。'),
        rx('rp_skim', 's1', 'engaged', 8, '一眼懂了在做什么。'),
        rx('rp_skeptic', 's1', 'engaged', 6, '具体，不吹了。'),
        rx('rp_peer', 's1', 'engaged', 6, '开头就点到真实场景。'),
      ],
    },
    {
      id: 'e2',
      label: '把“赋能百业 + TAM”换成“一个真实客户 + 一个牵引指标”',
      rationale: '用一个付费客户和一条留存/增长曲线替代空泛市场叙事——改的是信号强度。',
      overrides: [
        rx('rp_investor', 's2', 'engaged', 12, '有一个付费客户和留存数字，这才是信号。'),
        rx('rp_investor', 's3', 'engaged', 8, '自下而上的切入市场，靠谱。'),
        rx('rp_skim', 's2', 'engaged', 10, '有客户名字，记住了。'),
        rx('rp_skim', 's3', 'engaged', 6, '看到增长了。'),
        rx('rp_skeptic', 's2', 'engaged', 10, '终于有可核实的牵引。'),
        rx('rp_skeptic', 's3', 'engaged', 6, '自下而上的市场，服。'),
        rx('rp_peer', 's2', 'engaged', 8, '客户和指标都具体。'),
        rx('rp_peer', 's3', 'engaged', 6, '切入点清晰。'),
      ],
    },
    {
      id: 'e3',
      label: '把“团队顶尖 + 改变世界”换成“为什么是我们 + 融资用途”',
      rationale: '讲清 unfair advantage 与这笔钱要达成的里程碑，而不是喊口号——改的是可信度与具体性。',
      overrides: [
        rx('rp_investor', 's4', 'engaged', 8, '讲清了为什么是你们这个团队能做成。'),
        rx('rp_investor', 's5', 'engaged', 6, '融资用途具体，有里程碑。'),
        rx('rp_skim', 's4', 'engaged', 6, '懂了差异化。'),
        rx('rp_skim', 's5', 'engaged', 4, '知道钱怎么花。'),
        rx('rp_skeptic', 's4', 'engaged', 8, 'unfair advantage 说清了。'),
        rx('rp_skeptic', 's5', 'engaged', 4, '用途明确。'),
        rx('rp_peer', 's4', 'engaged', 6, '壁垒具体。'),
        rx('rp_peer', 's5', 'engaged', 4, '里程碑清楚。'),
      ],
    },
  ],
};

export const SAMPLES: SampleData[] = [coldEmail, coverLetter, pitch];
