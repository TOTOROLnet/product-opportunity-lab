import type { Scenario } from '../types'

// 全部为 mock 数据：口述独白为预写脚本，思路单元的类型 / 置信度 / 矛盾对均为
// 「示例分析结果」（预标注），用于演示产品的核心交互，而非真实模型实时推理。
// 独白刻意包含跑题、重复与「改主意」，以展示 Untangle 的差异化能力。

export const SCENARIOS: Scenario[] = [
  {
    id: 'freelance',
    emoji: '💼',
    title: '要不要接这个外包项目',
    context: '朋友介绍了一个私活，钱不少但时间很赶，边走边想理不清。',
    segments: [
      { id: 'f1', text: '这个外包我其实挺想接的，钱不少，能覆盖两个月房租。', aiType: 'decision', confidence: 0.52 },
      { id: 'f2', text: '对方要得挺急，说下周就要开始动工。', aiType: 'context', confidence: 0.9 },
      { id: 'f3', text: '等一下，下周我不是还得交那门课的结项吗，时间根本撞一起了。', aiType: 'open', confidence: 0.7 },
      { id: 'f4', text: '算了，钱再多也不值得把自己搞垮，我不接了。', aiType: 'decision', confidence: 0.82 },
      { id: 'f5', text: '不过……要是能把结项往后拖一周，好像也不是完全不行。', aiType: 'open', confidence: 0.58 },
      { id: 'f6', text: '我得先去问问导师，结项到底能不能延期。', aiType: 'action', confidence: 0.9 },
      { id: 'f7', text: '还有个事，这种私活到底要不要报税，我一直没搞明白。', aiType: 'open', confidence: 0.84 },
      { id: 'f8', text: '先别急着拍板，问清楚导师那边再决定吧。', aiType: 'decision', confidence: 0.72 },
    ],
    contradictions: [
      { id: 'fc1', fromId: 'f1', toId: 'f4', topic: '到底接不接这个项目' },
      { id: 'fc2', fromId: 'f4', toId: 'f8', topic: '是「直接拒绝」还是「先问清楚再定」' },
    ],
  },
  {
    id: 'team',
    emoji: '🗓️',
    title: '给团队安排下周的活',
    context: '下周既要上线新版本，又答应给客户做 demo，脑子里排不过来。',
    segments: [
      { id: 't1', text: '下周重点肯定是把新版本上线搞定，这个不能拖。', aiType: 'decision', confidence: 0.85 },
      { id: 't2', text: '小李负责后端联调，小张这边做前端。', aiType: 'action', confidence: 0.9 },
      { id: 't3', text: '哦对，还有那个客户 demo，周三得给他们演示。', aiType: 'context', confidence: 0.8 },
      { id: 't4', text: '我在想，上线和 demo 撞在同一周会不会太赶了。', aiType: 'open', confidence: 0.7 },
      { id: 't5', text: '要不 demo 就用现在的老版本演示算了，别硬赶新版。', aiType: 'decision', confidence: 0.66 },
      { id: 't6', text: '不行，客户就是冲着新功能来的，老版本 demo 没意义。', aiType: 'decision', confidence: 0.78 },
      { id: 't7', text: '那就把上线提前到周二，周三 demo 正好用上新版。', aiType: 'decision', confidence: 0.72 },
      { id: 't8', text: '记得让小李周一先把测试环境准备好。', aiType: 'action', confidence: 0.9 },
      { id: 't9', text: '还有招聘的事，这周得面两个人，别给忘了。', aiType: 'action', confidence: 0.6 },
    ],
    contradictions: [
      { id: 'tc1', fromId: 't5', toId: 't7', topic: 'demo 用老版本还是提前上线用新版' },
    ],
  },
  {
    id: 'call',
    emoji: '📞',
    title: '复盘刚跟客户的通话',
    context: '刚挂电话，趁热把感受和下一步理一理，但当时说的话现在有点后悔。',
    segments: [
      { id: 'c1', text: '刚跟客户聊完，整体感觉还行，他们对产品挺感兴趣。', aiType: 'context', confidence: 0.8 },
      { id: 'c2', text: '但价格他们明显觉得贵，提了两次说预算有限。', aiType: 'open', confidence: 0.82 },
      { id: 'c3', text: '我当时脱口说可以给个折扣，现在想想有点冲动。', aiType: 'open', confidence: 0.6 },
      { id: 'c4', text: '折扣这事我得收回，不能一被压价就降，会显得产品不值钱。', aiType: 'decision', confidence: 0.82 },
      { id: 'c5', text: '他们真正在意的其实是上线速度，不是价格本身。', aiType: 'context', confidence: 0.75 },
      { id: 'c6', text: '所以下一步应该主打我们的交付速度，而不是纠结在价格上。', aiType: 'decision', confidence: 0.8 },
      { id: 'c7', text: '我要在明天之前发一份带时间线的方案给他们。', aiType: 'action', confidence: 0.9 },
      { id: 'c8', text: '对了，他们提的那个集成需求，我还没确认我们到底能不能做。', aiType: 'open', confidence: 0.72 },
    ],
    contradictions: [
      { id: 'cc1', fromId: 'c3', toId: 'c4', topic: '到底给不给客户折扣' },
    ],
  },
]
