import type { Shot, DirectorNote } from '../types';

// ---------------------------------------------------------------------------
// 全 mock 数据：一条 ~32 秒的「AI 健身餐规划 App」口播短视频初稿。
// 想象它由某个 brief→成片 agent（如报告里的 Vizard Agent）根据一句 brief 自动产出，
// 「说戏」是坐在它之上的改稿层——这里只保存镜头的文本/元数据，不含任何真实视频。
// ---------------------------------------------------------------------------

export const VIDEO_BRIEF =
  '为「一款拍冰箱照片就能生成三天健身餐 + 购物清单的 App」做一条 30 秒竖屏口播广告，钩子要狠、结尾引导下载。';

export const DRAFT_SHOTS: Shot[] = [
  {
    id: 's1',
    index: 1,
    label: '开场钩子',
    emoji: '🥶',
    color: '#3b4a6b',
    script: '你有没有发现，每天最累的其实不是健身，是想今天到底该吃什么。',
    durationSec: 5,
    pace: 'keep',
    energy: 3,
    visualNote: '一个人对着打开的空冰箱发呆',
    fillers: ['你有没有发现，', '其实', '到底'],
    keyPhrase: '不是健身',
    hookPrefix: '先问你一句——',
  },
  {
    id: 's2',
    index: 2,
    label: '痛点',
    emoji: '🍔',
    color: '#6b3b4a',
    script: '打开外卖，全是高热量；自己做，又不知道怎么搭配才够营养。',
    durationSec: 5,
    pace: 'keep',
    energy: 3,
    visualNote: '外卖盒堆满桌子 / 一堆生食材无从下手',
    fillers: ['全是'],
    keyPhrase: '不知道怎么搭配',
    hookPrefix: '说白了——',
  },
  {
    id: 's3',
    index: 3,
    label: '方案登场',
    emoji: '🤖',
    color: '#3b6b5a',
    script: '所以我们做了一个 AI 营养师，它比你自己更懂你的身体。',
    durationSec: 4,
    pace: 'keep',
    energy: 4,
    visualNote: 'App 界面亮起，营养师形象出现',
    fillers: ['所以'],
    keyPhrase: '比你自己更懂你的身体',
    hookPrefix: '关键是——',
  },
  {
    id: 's4',
    index: 4,
    label: '核心功能',
    emoji: '📸',
    color: '#5a5a3b',
    script:
      '你只要拍一张冰箱照片，它就能根据你的健身目标，规划出接下来三天的每一餐，连购物清单都替你列好，你几乎什么都不用想，跟着做就行。',
    durationSec: 9,
    pace: 'slow',
    energy: 3,
    visualNote: '手机拍冰箱 → 界面滚动生成三天餐单与购物清单',
    fillers: ['你只要', '就能', '接下来', '几乎', '什么都不用想，'],
    keyPhrase: '拍一张冰箱照片',
    hookPrefix: '重点来了——',
  },
  {
    id: 's5',
    index: 5,
    label: '社会证明',
    emoji: '📉',
    color: '#3b5a6b',
    script: '已经有超过十万人在用它，把自己的体脂率降了下来。',
    durationSec: 4,
    pace: 'keep',
    energy: 4,
    visualNote: '用户前后对比 + 数字滚动',
    fillers: ['自己的'],
    keyPhrase: '超过十万人',
    hookPrefix: '而且——',
  },
  {
    id: 's6',
    index: 6,
    label: '行动号召',
    emoji: '📲',
    color: '#5a3b6b',
    script: '如果感兴趣的话，可以去应用商店随便搜一下我们的名字。',
    durationSec: 5,
    pace: 'keep',
    energy: 2,
    visualNote: 'App 图标 + 下载按钮',
    fillers: ['如果', '的话', '可以', '随便', '一下'],
    keyPhrase: '我们的名字',
    hookPrefix: '别等了——',
  },
];

// 空白说戏（默认状态）：既未锁定也未给意图。
export function emptyNote(shotId: string): DirectorNote {
  return {
    shotId,
    locked: false,
    text: '',
    pace: 'keep',
    energyDelta: 0,
    emphasize: false,
    tone: '',
  };
}

// ---------------------------------------------------------------------------
// 「一键填充导演意图」预置：演示一个真实改稿场景——
// 锁定已认可的痛点/方案/社会证明 3 镜，只对钩子/核心功能/CTA 3 镜说戏重生成。
// ---------------------------------------------------------------------------
export const PRESET_NOTES: Record<string, DirectorNote> = {
  s1: {
    shotId: 's1',
    locked: false,
    text: '钩子太温了，前两秒直接抛冲突，别铺垫',
    pace: 'fast',
    energyDelta: 1,
    emphasize: true,
    tone: '',
  },
  s2: { ...emptyNote('s2'), locked: true },
  s3: { ...emptyNote('s3'), locked: true },
  s4: {
    shotId: 's4',
    locked: false,
    text: '这段太啰嗦，砍到最有冲击力的功能点，节奏快一点',
    pace: 'fast',
    energyDelta: 1,
    emphasize: true,
    tone: '',
  },
  s5: { ...emptyNote('s5'), locked: true },
  s6: {
    shotId: 's6',
    locked: false,
    text: 'CTA 语气太软，改得更直接、更有紧迫感',
    pace: 'fast',
    energyDelta: 1,
    emphasize: true,
    tone: '更有紧迫感',
  },
};

export const TONE_OPTIONS = ['', '更口语', '更专业', '更热情', '更有紧迫感'];
