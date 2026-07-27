import type { SkuBase } from '../types';

// 批次执行前的商品基态（全部为 mock，不接真实后端）。
export const CATALOG: SkuBase[] = [
  { id: 'HAT', name: '草编帽', cost: 62, price: 89, inventory: 40, category: '配饰' },
  { id: 'SHIRT', name: '亚麻衬衫', cost: 88, price: 159, inventory: 60, category: '夏装' },
  { id: 'DRESS', name: '碎花连衣裙', cost: 79, price: 169, inventory: 30, category: '夏装' },
  { id: 'SANDAL38', name: '凉鞋 · 38 码', cost: 78, price: 120, inventory: 3, category: '凉鞋' },
  { id: 'SANDAL39', name: '凉鞋 · 39 码', cost: 78, price: 120, inventory: 25, category: '凉鞋' },
  { id: 'TEE07', name: '断码印花 T 恤', cost: 25, price: 59, inventory: 2, category: 'T恤' },
  { id: 'TEEA', name: '基础款纯棉 T 恤', cost: 30, price: 69, inventory: 80, category: 'T恤' },
];

// 均摊到每单的运费成本（商家在无条件包邮时承担）。
export const SHIP_COST = 12;
// 促销最大叠加深度（超过视为定价失控风险）。
export const MAX_STACK = 2;
