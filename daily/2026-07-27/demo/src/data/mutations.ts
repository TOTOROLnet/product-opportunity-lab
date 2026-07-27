import type { Mutation } from '../types';

// 商家对电商运营 Agent 说：
// 「为夏季清仓大促做准备：过季夏装打折、爆款加量、统一包邮门槛、清理断码 SKU。」
// Agent 一次性生成下面 12 条写操作。每条本身都合法（逐条预览会全部通过）。
export const MUTATIONS: Mutation[] = [
  {
    id: 'M1',
    kind: 'promo',
    label: '「夏装」品类 8 折',
    scope: { type: 'category', value: '夏装' },
    factor: 0.8,
    note: '过季夏装清仓打折，覆盖亚麻衬衫、碎花连衣裙。',
  },
  {
    id: 'M2',
    kind: 'promo',
    label: '「凉鞋」品类 7.5 折',
    scope: { type: 'category', value: '凉鞋' },
    factor: 0.75,
    note: '凉鞋换季清仓。',
  },
  {
    id: 'M3',
    kind: 'promo',
    label: '单品爆款（草编帽 / 碎花连衣裙）满 2 件 9 折',
    scope: { type: 'item', items: ['HAT', 'DRESS'] },
    factor: 0.9,
    note: '给爆款单品加一层满件促销，冲销量。',
  },
  {
    id: 'M4',
    kind: 'shipping',
    label: '全店包邮门槛 ¥99 → ¥0（无条件包邮）',
    freeShipping: true,
    prevThreshold: 99,
    newThreshold: 0,
    note: '大促期间统一无条件包邮，运费由商家承担（均摊 ¥12/单）。',
  },
  {
    id: 'M5',
    kind: 'price',
    label: '「草编帽」售价 ¥89 → ¥69',
    sku: 'HAT',
    from: 89,
    to: 69,
    note: '草编帽降价冲量（69 > 成本 62，单看合法）。',
  },
  {
    id: 'M6',
    kind: 'price',
    label: '「亚麻衬衫」售价 ¥159 → ¥129',
    sku: 'SHIRT',
    from: 159,
    to: 129,
    note: '衬衫降价（129 > 成本 88，单看合法）。',
  },
  {
    id: 'M7',
    kind: 'inventory',
    label: '「断码印花 T 恤」库存 → 0（下架）',
    sku: 'TEE07',
    setTo: 0,
    note: '断码清理，下架该 SKU。',
  },
  {
    id: 'M8',
    kind: 'category',
    label: '把「T 恤」品类全部 SKU 迁至「清仓」品类',
    fromCategory: 'T恤',
    toCategory: '清仓',
    note: '一刀切把 T 恤都归到清仓专区，方便集中促销。',
  },
  {
    id: 'M9',
    kind: 'inventory',
    label: '「草编帽」补货 +500',
    sku: 'HAT',
    delta: 500,
    note: '爆款加量备货。',
  },
  {
    id: 'M10',
    kind: 'promo',
    label: 'VIP 客群额外 95 折（全场叠加）',
    scope: { type: 'customerGroup', value: 'VIP' },
    factor: 0.95,
    note: '给 VIP 再让一点，全场叠加。',
  },
  {
    id: 'M11',
    kind: 'inventory',
    label: '「凉鞋 · 38 码」库存 → 0（清库）',
    sku: 'SANDAL38',
    setTo: 0,
    note: '把 38 码库存清零。',
  },
  {
    id: 'M12',
    kind: 'promo',
    label: '「清仓」品类额外 85 折',
    scope: { type: 'category', value: '清仓' },
    factor: 0.85,
    note: '清仓专区再打一层折。',
  },
];

// 推荐剔除集合：这几条「全局 / 一刀切」操作与其它定向操作叠加后制造了全部联动风险。
export const RECOMMENDED_EXCLUDE = ['M4', 'M8', 'M10', 'M11'];
