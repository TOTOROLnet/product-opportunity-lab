import type { BacklogItem } from '../types';

// Mock：你的"稍后读/稍后看"积压。刻意混入存了很久的老条目，体现"积压坟场"。
// 真实产品里这些来自 Pocket / Readwise / 浏览器书签 / YouTube 稍后看，Demo 全部为 mock。
export const BACKLOG: BacklogItem[] = [
  {
    id: 'a1',
    title: '注意力是如何被设计成"停不下来"的',
    source: 'The Atlantic',
    kind: 'article',
    savedDaysAgo: 213,
    minutes: 9,
    excerpt:
      '无限滚动没有天然的结束点——它移除了"停下来"的那个自然停顿。设计师深知：一旦给用户一个"读完了"的信号，会话时长就会下降。于是产品刻意抹掉了终点……',
    tags: ['注意力', '产品设计'],
  },
  {
    id: 'a2',
    title: '我把 500 条稍后读清了个底，然后发现一个残酷事实',
    source: 'personal blog',
    kind: 'article',
    savedDaysAgo: 141,
    minutes: 6,
    excerpt:
      '真正有用的不到 8%。收藏这个动作本身给了我"我会读的"的错觉，于是我心安理得地不读。收藏，成了一种精致的拖延……',
    tags: ['稍后读', '习惯'],
  },
  {
    id: 'a3',
    title: '有限游戏与无限游戏（重读笔记）',
    source: 'Readwise Highlights',
    kind: 'article',
    savedDaysAgo: 88,
    minutes: 5,
    excerpt:
      '有限游戏为了取胜而玩、有明确的结束；无限游戏为了延续而玩。今天的大多数 App 都想把你拖进一场无限游戏——而你需要的，往往是一个能赢、能结束的有限游戏……',
    tags: ['哲学', '框架'],
  },
  {
    id: 'a4',
    title: 'DJ 已死？不，DJ 正在回来——只是换了形态',
    source: 'Pitchfork',
    kind: 'article',
    savedDaysAgo: 34,
    minutes: 7,
    excerpt:
      '算法能给你"更多相似的歌"，但给不了"为什么现在放这首"。策展的价值不在推荐，而在编排与语境——把一堆东西排出一条有起伏的线……',
    tags: ['策展', '音乐'],
  },
  {
    id: 'a5',
    title: '通勤 20 分钟，我想被"讲"点东西，而不是自己刷',
    source: 'Substack',
    kind: 'article',
    savedDaysAgo: 12,
    minutes: 4,
    excerpt:
      '播客的好，是有人替你决定了顺序和节奏，你只要跟着走。而信息流把所有决策都甩回给你——选什么、看多久、什么时候停，全是你的事，累……',
    tags: ['播客', '通勤'],
  },
  {
    id: 'a6',
    title: '慢媒体宣言：少而经过编辑，胜过多而无尽',
    source: 'slow-media.net',
    kind: 'article',
    savedDaysAgo: 57,
    minutes: 5,
    excerpt:
      '慢媒体不是读得慢，而是有编辑立场：有人替你筛过、排过、给出理由。它尊重你的时间是有限的这一事实……',
    tags: ['慢媒体', '编辑'],
  },
  {
    id: 'v1',
    title: '【收藏了半年没看】一个关于"完成感"的 12 分钟演讲',
    source: 'YouTube · Watch Later',
    kind: 'video',
    savedDaysAgo: 187,
    minutes: 12,
    excerpt:
      '大脑对"未完成"的事有持续的后台占用（蔡格尼克效应）。你那 300 条没看的收藏，正在悄悄占用你的心智带宽……',
    tags: ['心理学', '完成感'],
  },
  {
    id: 'v2',
    title: '为什么老式电台的"收播"让人安心',
    source: 'YouTube · Watch Later',
    kind: 'video',
    savedDaysAgo: 45,
    minutes: 8,
    excerpt:
      '过去电视台每晚会"收播"——放国歌、彩条、然后是雪花点。那是一个明确的"今天到此为止"。我们弄丢了这个信号……',
    tags: ['媒介史', '仪式感'],
  },
  {
    id: 'v3',
    title: '短视频的"再来一条"是怎么劫持你的多巴胺的',
    source: 'YouTube · Watch Later',
    kind: 'video',
    savedDaysAgo: 9,
    minutes: 10,
    excerpt:
      '可变奖励 + 无终点 = 最强的行为循环。破解它不靠意志力，靠给这个循环装一个"外部的结束点"……',
    tags: ['神经科学', '成瘾'],
  },
  {
    id: 't1',
    title: '一条被点赞 4 万的推：我删掉了所有 feed，只留一个"每日精选"',
    source: 'X thread',
    kind: 'thread',
    savedDaysAgo: 21,
    minutes: 3,
    excerpt:
      '把无限流换成一份每天固定、会结束的精选后，我读完的东西反而多了，焦虑少了。关键词是：会结束……',
    tags: ['注意力', '实践'],
  },
  {
    id: 't2',
    title: '关于"信息囤积"：为什么我们存了却不看',
    source: 'X thread',
    kind: 'thread',
    savedDaysAgo: 103,
    minutes: 3,
    excerpt:
      '存 = 一种缓解焦虑的动作，而不是消费的前奏。理解这一点，才能设计出真的帮你消费而不是继续囤积的产品……',
    tags: ['行为', '囤积'],
  },
  {
    id: 'a7',
    title: '编辑之死与编辑的回归：AI 时代谁替你做减法',
    source: 'Nieman Lab',
    kind: 'article',
    savedDaysAgo: 30,
    minutes: 6,
    excerpt:
      '生成式 AI 让"内容更多"变得几乎免费，于是稀缺的不再是内容，而是"替你做减法、给你顺序和理由"的编辑判断……',
    tags: ['AI', '编辑', '策展'],
  },
  {
    id: 'a8',
    title: '我不需要更多推荐，我需要有人替我决定今晚看什么',
    source: 'Medium',
    kind: 'article',
    savedDaysAgo: 66,
    minutes: 4,
    excerpt:
      '选择过载是当代之痛。Netflix 给我一千个选项，我在首页刷了 40 分钟然后关掉电视。我要的是一个替我拍板的主持人……',
    tags: ['选择过载', '策展'],
  },
  {
    id: 'a9',
    title: '把"待办的阅读"当项目管理，是我犯的最大错误',
    source: 'personal blog',
    kind: 'article',
    savedDaysAgo: 5,
    minutes: 5,
    excerpt:
      '我用看板管理稍后读，结果它变成第二个永远清不完的待办清单。阅读不该是任务，而该像被人请去听一档节目……',
    tags: ['稍后读', '反思'],
  },
  {
    id: 'a10',
    title: '"少即是多"在信息消费上其实很难卖',
    source: 'Stratechery（免费篇）',
    kind: 'article',
    savedDaysAgo: 74,
    minutes: 7,
    excerpt:
      '商业模式的引力总是把产品拖向"更多、更久、更停不下来"。任何主打"会结束"的产品，都要先回答：你靠什么活下来？……',
    tags: ['商业模式', '批判'],
  },
  {
    id: 'v4',
    title: '一位电台主持人讲：串场词的三个作用',
    source: 'YouTube · Watch Later',
    kind: 'video',
    savedDaysAgo: 118,
    minutes: 9,
    excerpt:
      '串场不是废话：承上启下、给下一首一个理由、给听众一个喘息。好的主持让一堆歌变成一段旅程，而不是一个播放列表……',
    tags: ['主持', '策展'],
  },
];

export const backlogById = (id: string): BacklogItem | undefined =>
  BACKLOG.find((b) => b.id === id);
