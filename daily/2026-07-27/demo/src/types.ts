// 合流 Héliú — 类型定义
// 全部为纯前端 mock 模型：一个 mock 商品目录 + 一批 AI Agent 提交的写操作。
// 引擎是确定性业务规则（非 AI 判断）；AI 核心在于「这批写操作由 Agent 一次性生成」这一前提。

export type Category = '夏装' | '凉鞋' | '配饰' | 'T恤' | '清仓';

/** 批次执行前的商品基态。 */
export interface SkuBase {
  id: string;
  name: string;
  cost: number; // 成本价（元）
  price: number; // 原售价（元）
  inventory: number; // 库存
  category: Category;
}

export type MutationKind =
  | 'promo'
  | 'price'
  | 'shipping'
  | 'inventory'
  | 'category';

export type PromoScope =
  | { type: 'category'; value: Category }
  | { type: 'item'; items: string[] }
  | { type: 'customerGroup'; value: string };

/** AI Agent 提交的单条写操作。每条本身都是「合法」的（逐条预览会通过）。 */
export type Mutation =
  | {
      id: string;
      kind: 'promo';
      label: string;
      scope: PromoScope;
      factor: number; // 折扣系数，如 0.8 = 8 折
      note: string;
    }
  | {
      id: string;
      kind: 'price';
      label: string;
      sku: string;
      from: number;
      to: number;
      note: string;
    }
  | {
      id: string;
      kind: 'shipping';
      label: string;
      freeShipping: boolean;
      prevThreshold: number;
      newThreshold: number;
      note: string;
    }
  | {
      id: string;
      kind: 'inventory';
      label: string;
      sku: string;
      delta?: number;
      setTo?: number;
      note: string;
    }
  | {
      id: string;
      kind: 'category';
      label: string;
      fromCategory: Category;
      toCategory: Category;
      note: string;
    };

/** 作用在某 SKU 上的一条促销（materialize 后的解析结果）。 */
export interface AppliedPromo {
  mutationId: string;
  label: string;
  factor: number;
}

/** 批次物化后，单个 SKU 的结果状态。 */
export interface ResolvedSku {
  id: string;
  name: string;
  cost: number;
  basePrice: number; // 批次前原价
  price: number; // 批次改价后（未含促销）
  inventory: number; // 批次后库存
  category: Category; // 批次后所属品类（可能被迁移）
  originalCategory: Category;
  movedByMutation?: string; // 若被品类迁移，记录来源 mutation id
  promos: AppliedPromo[]; // 叠加在该 SKU 上的所有促销
  freeShipping: boolean;
  finalPrice: number; // 叠加所有促销后的成交价
}

export type Invariant =
  | 'cost-floor' // #1 成本红线：叠加后价格 >= 成本
  | 'stack-depth' // #2 促销叠加深度 <= 上限
  | 'promo-oos' // #3 促销不得覆盖零库存商品
  | 'shipping-margin' // #4 包邮后毛利 >= 0
  | 'unintended-scope'; // #5（提示）常规款被批量迁入促销品类，意外获得折扣资格

export type Severity = '高' | '中' | '低';

export interface Clash {
  id: string;
  invariant: Invariant;
  invariantLabel: string;
  severity: Severity;
  skuId: string;
  skuName: string;
  involvedMutations: string[]; // 参与形成该联动风险的 mutation id（>=1，通常 >=2）
  headline: string; // 一句话结论
  before: string; // 逐条看时的样子
  after: string; // 叠加后的真实后果
}

export interface ValueMetrics {
  totalMutations: number;
  perActionPass: number; // 逐条预览通过数
  clashCount: number; // 合流检出的联动风险总数
  highCount: number;
  lossSkus: string[]; // 照单全批会负毛利/亏损的在售 SKU
  promoOnOos: string[]; // 促销指向零库存的 SKU
  overStack: string[]; // 促销叠加超深度的 SKU
  unintendedScope: string[]; // 常规款被误扫入促销品类
  humanDecisionsPerAction: number; // 逐条模式需人工过目的卡片数
  humanDecisionsPlan: number; // 计划级模式需人工决策的关键项数
}

export interface EngineResult {
  resolved: ResolvedSku[];
  clashes: Clash[];
  metrics: ValueMetrics;
}
