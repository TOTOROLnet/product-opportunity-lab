import type { PrefId, PrefMeta, LicenseKind } from './types';

export const PREF_META: PrefMeta[] = [
  {
    id: 'preferNative',
    label: '能用原生就别加依赖',
    desc: '一行原生 / 运行时自带能力能搞定的事，不引入第三方包。',
    hard: false,
  },
  {
    id: 'preferLight',
    label: '偏好轻量（控体积）',
    desc: '同等能力下选更小、更 tree-shake 友好的包。',
    hard: false,
  },
  {
    id: 'preferMaintained',
    label: '偏好在维护',
    desc: '避免长期没发版 / 进入维护模式的包。',
    hard: false,
  },
  {
    id: 'preferFewerTransitive',
    label: '偏好少传递依赖',
    desc: '控制供应链广度，减少被拖进来的间接依赖。',
    hard: false,
  },
  {
    id: 'denyCopyleft',
    label: '禁用 copyleft 许可（硬规则）',
    desc: 'GPL / AGPL 对闭源 SaaS 有传染性，一律不用。开启即为硬规则。',
    hard: true,
  },
  {
    id: 'preferTyped',
    label: '偏好一等 TS 类型',
    desc: '优先自带类型定义的包，而非靠 @types 补。',
    hard: false,
  },
];

export const PREF_BY_ID: Record<PrefId, PrefMeta> = PREF_META.reduce(
  (acc, m) => {
    acc[m.id] = m;
    return acc;
  },
  {} as Record<PrefId, PrefMeta>,
);

export const COPYLEFT: LicenseKind[] = ['GPL-3.0', 'AGPL-3.0'];

export function isCopyleft(license: LicenseKind): boolean {
  return COPYLEFT.includes(license);
}

// 预设口味档案
export const PRESETS: { id: string; label: string; note: string; profile: Record<PrefId, number> }[] = [
  {
    id: 'balanced',
    label: '均衡起步',
    note: '大多数团队的合理默认：轻量 + 在维护 + 禁 copyleft。',
    profile: {
      preferNative: 2,
      preferLight: 2,
      preferMaintained: 2,
      preferFewerTransitive: 1,
      denyCopyleft: 3,
      preferTyped: 1,
    },
  },
  {
    id: 'minimalist',
    label: '极简主义',
    note: '能不加依赖就不加，重原生、重轻量。',
    profile: {
      preferNative: 3,
      preferLight: 3,
      preferMaintained: 2,
      preferFewerTransitive: 3,
      denyCopyleft: 3,
      preferTyped: 2,
    },
  },
  {
    id: 'compliance',
    label: '合规优先',
    note: '许可与维护是底线，体积其次。',
    profile: {
      preferNative: 1,
      preferLight: 1,
      preferMaintained: 3,
      preferFewerTransitive: 2,
      denyCopyleft: 3,
      preferTyped: 2,
    },
  },
  {
    id: 'off',
    label: '全部关闭',
    note: '不设定任何口味——尊重 agent 的原始选择，不替你改判。',
    profile: {
      preferNative: 0,
      preferLight: 0,
      preferMaintained: 0,
      preferFewerTransitive: 0,
      denyCopyleft: 0,
      preferTyped: 0,
    },
  },
];
