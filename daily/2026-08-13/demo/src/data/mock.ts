import type { Drill, HabitMeta, HabitType, Task } from '../types';

// ── 全部为手工构造的 mock 语料，贴合"中文母语、B1–B2、日常用英文工作"的真实产出 ──
// 无任何真实 API / LLM / 语音 / 网络请求。

export const HABITS: Record<HabitType, HabitMeta> = {
  lexical: {
    id: 'lexical',
    label: '词汇过窄',
    en: 'Weak word choice',
    color: '#f59e0b',
    priority: 'core',
    desc: '用 very+形容词、good/big 等笼统词；母语者用一个自带强度的精准词。',
  },
  calque: {
    id: 'calque',
    label: '语法直译',
    en: 'L1 calque',
    color: '#ef4444',
    priority: 'core',
    desc: '把中文结构直译（although…but / because…so）；英文只留一个连接词。',
  },
  collocation: {
    id: 'collocation',
    label: '缺地道搭配',
    en: 'Missing collocations',
    color: '#8b5cf6',
    priority: 'core',
    desc: '不用 phrasal verbs / 固定搭配（put off / run into / sort out）。',
  },
  pragmatic: {
    id: 'pragmatic',
    label: '语用生硬',
    en: 'Blunt tone',
    color: '#0ea5e9',
    priority: 'core',
    desc: '直接命令 / 指责 / 硬否定；母语者会软化措辞。',
  },
  redundant: {
    id: 'redundant',
    label: '冗余啰嗦',
    en: 'Wordiness',
    color: '#14b8a6',
    priority: 'core',
    desc: 'In my personal opinion I think that maybe… 一句能说完的话拖很长。',
  },
  surface: {
    id: 'surface',
    label: '实例级小错',
    en: 'Surface errors',
    color: '#94a3b8',
    priority: 'low',
    desc: '冠词 / 时态等——Grammarly 的地盘，不是你不地道的根因，本产品刻意降权。',
  },
};

export const CORE_ORDER: HabitType[] = [
  'pragmatic',
  'lexical',
  'collocation',
  'calque',
  'redundant',
  'surface',
];

export const TASKS: Task[] = [
  {
    id: 't1',
    title: '跟同事说今天没法评审他的 PR，改到明天',
    channel: 'Slack',
    prompt: '告诉同事你今天太忙，PR 评审改到明天，请他把链接再发一次。',
    learnerOutput:
      'Hi, I am very busy today and very tired, so although I want to review your PR, but I can not do it today. I will review it tomorrow. Send me the link again.',
    nativeRewrite:
      "Hey! I'm swamped today, so I won't get to your PR until tomorrow — could you drop the link here again? Thanks!",
    spans: [
      {
        learner: 'very busy … very tired',
        native: 'swamped',
        habit: 'lexical',
        note: "两个 'very+形容词' 叠用最暴露非母语；一个自带强度的词 'swamped'（忙翻了）就够。",
      },
      {
        learner: 'although I want to review it, but I can not',
        native: "so I won't get to it until tomorrow",
        habit: 'calque',
        note: "although…but 是中文'虽然…但是…'的直译；英文里 although 和 but 只能留一个。",
      },
      {
        learner: 'I can not do it today',
        native: "I won't get to your PR until tomorrow",
        habit: 'collocation',
        note: "'get to sth' 是地道搭配，比 'do it' 更自然地表达'抽不出空做'。",
      },
      {
        learner: 'Send me the link again.',
        native: 'could you drop the link here again?',
        habit: 'pragmatic',
        note: "祈使句 'Send me' 偏命令；'could you… ?' 更礼貌、更像同事之间的口吻。",
      },
    ],
  },
  {
    id: 't2',
    title: '会上婉拒一个不合理的 deadline',
    channel: '会议',
    prompt: '在会议上表达这个 deadline 不现实、需要更多时间，并希望一起讨论可行方案。',
    learnerOutput:
      "This deadline is impossible. You don't understand our situation. The task is very hard, because we have many things, so we can not finish. We need more time.",
    nativeRewrite:
      "That timeline's going to be really tough on our end. The scope is heavier than it looks, so I'd push for a few more days — can we talk through what's realistic?",
    spans: [
      {
        learner: "This deadline is impossible. You don't understand our situation.",
        native: "That timeline's going to be really tough on our end.",
        habit: 'pragmatic',
        note: "'impossible / You don't understand' 直接否定对方，显得对抗；母语者软化成 'really tough on our end'。",
      },
      {
        learner: 'very hard',
        native: 'heavier than it looks',
        habit: 'lexical',
        note: "'very hard' 笼统；'heavier than it looks'（比看上去更重）更具体、更地道。",
      },
      {
        learner: 'because we have many things, so we can not finish',
        native: 'the scope is heavier than it looks, so …',
        habit: 'calque',
        note: "because…so 直译；英文保留一个连接词即可，且用 'the scope' 让理由更专业。",
      },
      {
        learner: 'We need more time.',
        native: "can we talk through what's realistic?",
        habit: 'collocation',
        note: "'talk through / what's realistic' 是会议里地道的推进说法，比 'need more time' 更有协作感。",
      },
    ],
  },
  {
    id: 't3',
    title: '给下属正面 + 建设性反馈',
    channel: '邮件',
    prompt: '先肯定对方的工作，再指出代码里一个需要改的问题，并提醒别再犯同样的错。',
    learnerOutput:
      'In my personal opinion, I think your work is very good. But there is a big problem in the code that you need to fix it. Also you always make the same mistake, so please be careful next time.',
    nativeRewrite:
      "Really nice work on this! One thing to sort out: the error handling in the payment module — mind taking another pass? It's a pattern worth keeping an eye on going forward.",
    spans: [
      {
        learner: 'In my personal opinion, I think',
        native: '(直接说结论)',
        habit: 'redundant',
        note: "'In my personal opinion, I think' 三重冗余；母语者直接给结论，或只留一个 'I think'。",
      },
      {
        learner: 'very good',
        native: 'Really nice work on this',
        habit: 'lexical',
        note: "'very good' 平淡；'really nice work on this' 更有温度、更像 native 的表扬。",
      },
      {
        learner: 'there is a big problem … You need to fix it.',
        native: 'One thing to sort out … mind taking another pass?',
        habit: 'pragmatic',
        note: "'big problem / you need to' 偏指责；'one thing to sort out / mind taking another pass?' 建设性且不伤人。",
      },
      {
        learner: 'fix it',
        native: 'sort out / take another pass',
        habit: 'collocation',
        note: "'sort out' / 'take a pass' 是地道搭配，比反复用 'fix' 更自然。",
      },
      {
        learner: 'a problem that you need to fix it',
        native: 'a problem to fix',
        habit: 'surface',
        note: "关系从句里多了个 'it'（that…fix it 重复宾语）——实例级小错，Grammarly 会抓，但不是你不地道的根因。",
      },
      {
        learner: 'you always make the same mistake, please be careful',
        native: "it's a pattern worth keeping an eye on going forward",
        habit: 'pragmatic',
        note: "'you always…' 是人身指责；'a pattern worth keeping an eye on' 对事不对人。",
      },
    ],
  },
];

export const DRILLS: Drill[] = [
  {
    id: 'd-lex-1',
    habit: 'lexical',
    promptCn: "别用 'very'，换一个自带强度的精准词",
    stem: 'After the release, I was very tired.',
    hint: '想想 exhausted / wiped / drained',
    accept: ['exhausted', 'wiped', 'drained', 'spent', 'worn out', 'beat', 'shattered', 'knackered'],
    reject: ['very'],
    sample: 'After the release, I was completely wiped.',
    explain: "母语者很少说 'very tired'，而用一个自带强度的词（exhausted / wiped）。",
  },
  {
    id: 'd-lex-2',
    habit: 'lexical',
    promptCn: '把叠用的 very+形容词换成一个精准形容词',
    stem: 'The bug is very big and very bad.',
    hint: '试试 nasty / serious / major / critical',
    accept: ['nasty', 'serious', 'major', 'critical', 'gnarly', 'huge'],
    reject: ['very'],
    sample: "That's a nasty, serious bug.",
    explain: '叠用 very+形容词最暴露非母语；换成一个精准形容词即可。',
  },
  {
    id: 'd-col-1',
    habit: 'collocation',
    promptCn: '用 phrasal verb 让它更地道',
    stem: "Let's postpone the sync to Friday.",
    hint: 'postpone → put ___ ',
    accept: ['put off', 'put it off', 'push back', 'push the sync'],
    sample: "Let's put off the sync to Friday.",
    explain: "'put off' 是地道口语搭配；正式词 postpone 没错，但日常沟通 phrasal verb 更自然。",
  },
  {
    id: 'd-col-2',
    habit: 'collocation',
    promptCn: '别反复用 fix，换个地道搭配',
    stem: 'I need to fix this problem before Monday.',
    hint: 'fix → sort ___ / iron ___',
    accept: ['sort out', 'sort it out', 'sort this out', 'iron out'],
    sample: 'I need to sort this out before Monday.',
    explain: "反复用 fix 会单调；'sort out / iron out' 更像 native。",
  },
  {
    id: 'd-cal-1',
    habit: 'calque',
    promptCn: '去掉多余的连接词（中式让步直译）',
    stem: "Although it works, but it's slow.",
    hint: 'although 和 but 只能留一个',
    accept: ["although it works, it's slow", 'although it works its slow', "it works, but it's slow", 'it works but its slow'],
    reject: ['although it works, but', 'although it works but'],
    sample: "Although it works, it's slow.（或：It works, but it's slow.）",
    explain: "中文'虽然…但是…'两个都要；英文只能留一个连接词。",
  },
  {
    id: 'd-prag-1',
    habit: 'pragmatic',
    promptCn: '把命令改成礼貌请求',
    stem: 'Send me the report.',
    hint: 'Could you … when you … ?',
    accept: ['could you', 'would you', 'can you', 'mind sending', 'do you mind', 'when you get a chance', 'when you have a sec'],
    sample: 'Could you send me the report when you get a chance?',
    explain: "祈使句在英文里偏命令；'Could you… ? / when you get a chance' 更礼貌自然。",
  },
  {
    id: 'd-red-1',
    habit: 'redundant',
    promptCn: '删掉冗余，一句说清',
    stem: 'In my personal opinion, I think that maybe we should possibly try this.',
    hint: '结论说一次就够',
    accept: ['i think we should try this', 'we should try this', "let's try this", 'i would try this', 'id try this'],
    sample: 'I think we should try this.',
    explain: "'In my personal opinion, I think that maybe…possibly' 层层堆叠，母语者直接给结论。",
  },
];

// 展示用的静态进度（mock）：连续练习天数。
export const MOCK_STREAK_DAYS = 5;

export const LEARNER_PROFILE = {
  name: '你（示例学习者）',
  level: 'CEFR B1–B2',
  context: '在跨国团队每天用英文写 Slack / 邮件、开会发言的中文母语者',
};
