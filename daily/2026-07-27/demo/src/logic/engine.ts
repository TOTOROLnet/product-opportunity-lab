import type {
  AppliedPromo,
  Clash,
  EngineResult,
  Invariant,
  Mutation,
  ResolvedSku,
  Severity,
  SkuBase,
  ValueMetrics,
} from '../types';
import { CATALOG, MAX_STACK, SHIP_COST } from '../data/catalog';
import { MUTATIONS, RECOMMENDED_EXCLUDE } from '../data/mutations';

const INVARIANT_LABEL: Record<Invariant, string> = {
  'cost-floor': '成本红线：叠加后价格 ≥ 成本',
  'stack-depth': `促销叠加深度 ≤ ${MAX_STACK}`,
  'promo-oos': '促销不得覆盖零库存商品',
  'shipping-margin': '包邮后毛利 ≥ 0',
  'unintended-scope': '品类迁移不得让常规款意外获得促销资格',
};

const SEVERITY_BY_INVARIANT: Record<Invariant, Severity> = {
  'cost-floor': '高',
  'shipping-margin': '高',
  'stack-depth': '中',
  'promo-oos': '中',
  'unintended-scope': '低',
};

export function yuan(n: number): string {
  return `¥${n.toFixed(1)}`;
}

/** 把一批「被启用」的 mutation 物化成每个 SKU 的结果状态。 */
export function materialize(
  base: SkuBase[],
  mutations: Mutation[],
  activeIds: Set<string>,
): ResolvedSku[] {
  const active = mutations.filter((m) => activeIds.has(m.id));

  return base.map((sku) => {
    let price = sku.price;
    let inventory = sku.inventory;
    let category = sku.category;
    let movedByMutation: string | undefined;
    let freeShipping = false;
    const promos: AppliedPromo[] = [];

    // 1) 改价
    for (const m of active) {
      if (m.kind === 'price' && m.sku === sku.id) price = m.to;
    }
    // 2) 库存
    for (const m of active) {
      if (m.kind === 'inventory' && m.sku === sku.id) {
        if (m.setTo !== undefined) inventory = m.setTo;
        if (m.delta !== undefined) inventory += m.delta;
      }
    }
    // 3) 品类迁移（必须在解析品类促销之前）
    for (const m of active) {
      if (m.kind === 'category' && m.fromCategory === sku.category) {
        category = m.toCategory;
        movedByMutation = m.id;
      }
    }
    // 4) 包邮
    for (const m of active) {
      if (m.kind === 'shipping' && m.freeShipping) freeShipping = true;
    }
    // 5) 解析所有作用于该 SKU 的促销（基于迁移后的品类）
    for (const m of active) {
      if (m.kind !== 'promo') continue;
      const hit =
        (m.scope.type === 'category' && m.scope.value === category) ||
        (m.scope.type === 'item' && m.scope.items.includes(sku.id)) ||
        m.scope.type === 'customerGroup';
      if (hit) promos.push({ mutationId: m.id, label: m.label, factor: m.factor });
    }

    const finalPrice = promos.reduce((p, pr) => p * pr.factor, price);

    return {
      id: sku.id,
      name: sku.name,
      cost: sku.cost,
      basePrice: sku.price,
      price,
      inventory,
      category,
      originalCategory: sku.category,
      movedByMutation,
      promos,
      freeShipping,
      finalPrice,
    };
  });
}

/** 对物化后的状态做联动风险（涌现冲突）检测。 */
export function detectClashes(resolved: ResolvedSku[]): Clash[] {
  const clashes: Clash[] = [];
  const push = (
    invariant: Invariant,
    sku: ResolvedSku,
    involved: string[],
    headline: string,
    before: string,
    after: string,
  ) => {
    clashes.push({
      id: `${invariant}:${sku.id}`,
      invariant,
      invariantLabel: INVARIANT_LABEL[invariant],
      severity: SEVERITY_BY_INVARIANT[invariant],
      skuId: sku.id,
      skuName: sku.name,
      involvedMutations: involved,
      headline,
      before,
      after,
    });
  };

  for (const s of resolved) {
    const promoIds = s.promos.map((p) => p.mutationId);
    const inStock = s.inventory > 0;

    // #3 促销覆盖零库存（不区分是否在售，OOS 优先，避免与 #1/#4 重复标记）
    if (!inStock && s.promos.length > 0) {
      const invMut = involvedInventoryMut(s);
      push(
        'promo-oos',
        s,
        dedupe([...invMut, ...promoIds, ...(s.movedByMutation ? [s.movedByMutation] : [])]),
        `${s.name} 库存被本批置零，却仍在促销范围内 → 把流量 / 广告导向无货商品`,
        `单看：置零库存合法；设促销也合法。`,
        `叠加后：${s.name} 库存 0，但仍命中促销「${s.promos.map((p) => p.label).join(' + ')}」。`,
      );
      continue; // 无货商品不再评估成本/毛利（无销售损失）
    }

    // #1 成本红线（仅对在售 SKU）
    if (inStock && s.finalPrice < s.cost) {
      push(
        'cost-floor',
        s,
        dedupe([...priceMutOf(s), ...promoIds]),
        `${s.name} 叠加促销后成交价 ${yuan(s.finalPrice)} < 成本 ${yuan(s.cost)} → 每件净亏 ${yuan(s.cost - s.finalPrice)}`,
        `单看：改价 ${yuan(s.price)} > 成本 ${yuan(s.cost)}，每层促销也都合法。`,
        `叠加后：${yuan(s.price)}${s.promos.map((p) => ` × ${p.factor}`).join('')} = ${yuan(s.finalPrice)}，跌破成本。`,
      );
      continue;
    }

    // #4 包邮后毛利（仅对在售、且未跌破成本的 SKU）
    if (inStock && s.freeShipping) {
      const netMargin = s.finalPrice - s.cost - SHIP_COST;
      if (netMargin < 0) {
        push(
          'shipping-margin',
          s,
          dedupe([...shippingMut(), ...promoIds]),
          `${s.name} 促销价 ${yuan(s.finalPrice)}，扣成本 ${yuan(s.cost)} 与包邮运费 ${yuan(SHIP_COST)} 后毛利 ${yuan(netMargin)} < 0`,
          `单看：促销后 ${yuan(s.finalPrice)} 仍高于成本 ${yuan(s.cost)}（毛利 ${yuan(s.finalPrice - s.cost)}）。`,
          `叠加无条件包邮：再扣 ${yuan(SHIP_COST)} 运费 → 每单净亏 ${yuan(-netMargin)}。`,
        );
      }
    }

    // #2 促销叠加深度（对在售 SKU）
    if (inStock && s.promos.length > MAX_STACK) {
      push(
        'stack-depth',
        s,
        dedupe(promoIds),
        `${s.name} 同时命中 ${s.promos.length} 层促销（上限 ${MAX_STACK}）→ 定价失控风险`,
        `单看：每一层促销都合法。`,
        `叠加后：${s.promos.map((p) => p.label).join(' + ')} 共 ${s.promos.length} 层同时生效。`,
      );
    }

    // #5 常规款被批量迁入促销品类，意外获得折扣资格（提示）
    if (inStock && s.movedByMutation && s.promos.some((p) => isCategoryPromoOf(p.mutationId, s.category))) {
      push(
        'unintended-scope',
        s,
        dedupe([s.movedByMutation, ...promoIds]),
        `${s.name}（常规在售款）被一刀切迁入「${s.category}」，意外获得清仓促销资格`,
        `单看：品类迁移合法；清仓促销也合法。`,
        `叠加后：常规款库存 ${s.inventory} 被扫进「${s.category}」促销范围，本不该打折。`,
      );
    }
  }

  // 排序：高 > 中 > 低
  const rank: Record<Severity, number> = { 高: 0, 中: 1, 低: 2 };
  return clashes.sort((a, b) => rank[a.severity] - rank[b.severity]);
}

function priceMutOf(s: ResolvedSku): string[] {
  return MUTATIONS.filter((m) => m.kind === 'price' && m.sku === s.id).map((m) => m.id);
}
function involvedInventoryMut(s: ResolvedSku): string[] {
  return MUTATIONS.filter(
    (m) => m.kind === 'inventory' && m.sku === s.id && (m.setTo === 0 || (m.delta ?? 0) < 0),
  ).map((m) => m.id);
}
function shippingMut(): string[] {
  return MUTATIONS.filter((m) => m.kind === 'shipping' && m.freeShipping).map((m) => m.id);
}
function isCategoryPromoOf(mutationId: string, category: string): boolean {
  const m = MUTATIONS.find((x) => x.id === mutationId);
  return !!m && m.kind === 'promo' && m.scope.type === 'category' && m.scope.value === category;
}
function dedupe(arr: string[]): string[] {
  return Array.from(new Set(arr)).sort();
}

function computeMetrics(clashes: Clash[], activeCount: number): ValueMetrics {
  const by = (inv: Invariant) => clashes.filter((c) => c.invariant === inv).map((c) => c.skuName);
  return {
    totalMutations: MUTATIONS.length,
    perActionPass: activeCount, // 逐条预览：每条各自合法，全部通过
    clashCount: clashes.length,
    highCount: clashes.filter((c) => c.severity === '高').length,
    lossSkus: [...by('cost-floor'), ...by('shipping-margin')],
    promoOnOos: by('promo-oos'),
    overStack: by('stack-depth'),
    unintendedScope: by('unintended-scope'),
    humanDecisionsPerAction: activeCount, // 逐条模式：要过目每一张卡
    humanDecisionsPlan: RECOMMENDED_EXCLUDE.length, // 计划级：只需对推荐处置的少数关键操作做决策
  };
}

/** 主入口：给定启用的 mutation 集合，返回物化状态 + 联动风险 + 价值指标。 */
export function runEngine(activeIds?: Set<string>): EngineResult {
  const ids = activeIds ?? new Set(MUTATIONS.map((m) => m.id));
  const resolved = materialize(CATALOG, MUTATIONS, ids);
  const clashes = detectClashes(resolved);
  const metrics = computeMetrics(clashes, ids.size);
  return { resolved, clashes, metrics };
}

export const ALL_MUTATION_IDS = MUTATIONS.map((m) => m.id);
