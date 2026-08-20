import type { CalibrationCase } from '../types';

// 校准用例：这些是「另外几次」agent 选型的小例子（不是本次 PR 本身），
// 用来从你的判断里学出一份可复用的「选型口味档案」。
// 点选「为什么不满意」的理由，就等于教会我们你的口味。
export const CALIBRATION_CASES: CalibrationCase[] = [
  {
    id: 'c1',
    context: '给一行日志加个时间戳',
    agentPick: 'moment（72KB）',
    detail: 'agent 为了给日志打个时间戳，装了 72KB、已进入维护模式的 moment。',
    chips: [
      { id: 'c1a', label: '太重了（72KB）', pref: 'preferLight' },
      { id: 'c1b', label: '原生 Intl 就够', pref: 'preferNative' },
      { id: 'c1c', label: '已进入维护模式', pref: 'preferMaintained' },
    ],
  },
  {
    id: 'c2',
    context: '判断一个字符串是否为空',
    agentPick: 'is-empty',
    detail: 'agent 为「判断字符串是否为空」装了一个专门的小包。',
    chips: [
      { id: 'c2a', label: '一行原生就行', pref: 'preferNative' },
      { id: 'c2b', label: '没必要的小包', pref: 'preferLight' },
    ],
  },
  {
    id: 'c3',
    context: '生成 PDF 报表',
    agentPick: '某 AGPL-3.0 的 PDF 库',
    detail: 'agent 选了一个功能强、但许可是 AGPL-3.0 的 PDF 库。',
    chips: [{ id: 'c3a', label: 'AGPL 许可用不了（copyleft）', pref: 'denyCopyleft' }],
  },
  {
    id: 'c4',
    context: '做数据校验',
    agentPick: '一个下载量很高的校验库',
    detail: 'agent 选了个很流行、但拖了 20 个传递依赖、且不带一等类型的校验库。',
    chips: [
      { id: 'c4a', label: '传递依赖太多', pref: 'preferFewerTransitive' },
      { id: 'c4b', label: '没有一等类型', pref: 'preferTyped' },
    ],
  },
];
