import type {
  FamilyResult,
  Tier,
  Verdict,
  Workload,
  WorkloadResult,
} from '../types';

// ── 模型常量（可解释、确定性）────────────────────────────────────────────
// 取自报告事实：agentOS 头条「冷启动快 92×、内存省 47×、单位执行成本便宜 254×」。
// 本引擎把 254× 当作「native 部分」的单位加速上限，fallback 部分按开销系数计价。
// 这是一次「阿姆达尔式」建模：真实倍数被 fallback 尾巴的硬地板锁死。

export const S_NATIVE = 254; // native 单位成本加速（厂商头条）
export const MOUNT_OVERHEAD = 1.2; // mount：付一台真沙箱 + WASM 编排层，略贵于基线
export const BLOCKED_OVERHEAD = 1.35; // blocked：必须常驻专用真沙箱 + 拆栈失去整合，明显贵于基线

export const COLD_BASELINE_MS = 850; // 旧 microVM 冷启动
export const COLD_NATIVE_MS = 9; // WASM native 冷启动（≈ 850/92）
export const COLD_MOUNT_MS = 850; // 按需 mount 一台真沙箱 = 又回到沙箱冷启动尖峰
export const COLD_BLOCKED_MS = 25; // blocked 常驻沙箱 = 保持温热，几乎无冷启动

function coldFor(tier: Tier): number {
  if (tier === 'native') return COLD_NATIVE_MS;
  if (tier === 'mount') return COLD_MOUNT_MS;
  return COLD_BLOCKED_MS;
}

function wasmUnitFactor(tier: Tier): number {
  // 相对基线单位成本的倍率
  if (tier === 'native') return 1 / S_NATIVE;
  if (tier === 'mount') return MOUNT_OVERHEAD;
  return BLOCKED_OVERHEAD;
}

export function classifyVerdict(honestMultiplier: number): Verdict {
  if (honestMultiplier >= 20) return 'migrate';
  if (honestMultiplier >= 4) return 'cautious';
  if (honestMultiplier >= 1.3) return 'refactor';
  return 'avoid';
}

/** 核心：把一个负载灌进风洞，算出 before/after 成本、真实倍数、兼容占比与判定。 */
export function analyze(workload: Workload): WorkloadResult {
  const families: FamilyResult[] = workload.families.map((f) => {
    const baselineCost = f.calls * f.unitCost;
    const wasmCost = baselineCost * wasmUnitFactor(f.tier);
    return { ...f, baselineCost, wasmCost, coldMs: coldFor(f.tier) };
  });

  const totalCalls = families.reduce((s, f) => s + f.calls, 0);
  const baselineTotal = families.reduce((s, f) => s + f.baselineCost, 0);
  const wasmTotal = families.reduce((s, f) => s + f.wasmCost, 0);

  const nativeBaseline = families
    .filter((f) => f.tier === 'native')
    .reduce((s, f) => s + f.baselineCost, 0);
  const fallbackCalls = families
    .filter((f) => f.tier !== 'native')
    .reduce((s, f) => s + f.calls, 0);

  const honestMultiplier = wasmTotal > 0 ? baselineTotal / wasmTotal : 0;

  // WASM 冷启动 P99：只要负载里存在需 mount 的调用，尾延迟就被真沙箱冷启动尖峰拉回。
  const hasMount = families.some((f) => f.tier === 'mount' && f.calls > 0);
  const wasmColdP99 = hasMount ? COLD_MOUNT_MS : COLD_NATIVE_MS;

  return {
    families,
    totalCalls,
    baselineTotal,
    wasmTotal,
    honestMultiplier,
    headlineMultiplier: S_NATIVE,
    nativeCostShare: baselineTotal > 0 ? nativeBaseline / baselineTotal : 0,
    fallbackCallShare: totalCalls > 0 ? fallbackCalls / totalCalls : 0,
    baselineColdP99: COLD_BASELINE_MS,
    wasmColdP99,
    verdict: classifyVerdict(honestMultiplier),
  };
}

// ── 阿姆达尔滑杆：抽象负载（重活占比 → 真实倍数）────────────────────────────
// heavyShare ∈ [0,1] 表示「WASM 跑不了/需 fallback 的重活」占总成本的比例。
// 真实成本（相对基线=1）= native部分/254 + heavy部分×开销；真实倍数 = 1 / 该值。
export function multiplierForHeavyShare(
  heavyShare: number,
  heavyOverhead = MOUNT_OVERHEAD,
): number {
  const h = Math.min(Math.max(heavyShare, 0), 1);
  const nativeShare = 1 - h;
  const cost = nativeShare / S_NATIVE + h * heavyOverhead;
  return cost > 0 ? 1 / cost : 0;
}

/** 生成一条「重活占比 → 真实倍数」的曲线采样点，供 SVG 绘制。 */
export function amdahlCurve(steps = 41, heavyOverhead = MOUNT_OVERHEAD) {
  const pts: { heavy: number; mult: number }[] = [];
  for (let i = 0; i < steps; i++) {
    const heavy = i / (steps - 1); // 0..1
    pts.push({ heavy, mult: multiplierForHeavyShare(heavy, heavyOverhead) });
  }
  return pts;
}

// ── 展示辅助 ───────────────────────────────────────────────────────────────
export function fmtMultiplier(m: number): string {
  if (m >= 100) return `${Math.round(m)}×`;
  if (m >= 10) return `${m.toFixed(1)}×`;
  return `${m.toFixed(2)}×`;
}

export function fmtPct(x: number): string {
  return `${(x * 100).toFixed(x >= 0.1 ? 0 : 1)}%`;
}

export const VERDICT_META: Record<
  Verdict,
  { label: string; tone: string; headline: string; hint: string }
> = {
  migrate: {
    label: '值得迁移',
    tone: 'v-green',
    headline: '收益大，直接迁',
    hint: '负载近乎全 native，进程内运行时能吃到大部分红利。',
  },
  cautious: {
    label: '谨慎迁移',
    tone: 'v-amber',
    headline: '收益中等，先堵漏水点',
    hint: '主体 native，但有 fallback 尾巴在吃掉收益，先处理它。',
  },
  refactor: {
    label: '先改造再评估',
    tone: 'v-orange',
    headline: '收益有限，别急着迁',
    hint: 'fallback 占了成本大头，不改造直接迁基本白忙。',
  },
  avoid: {
    label: '不建议迁移',
    tone: 'v-red',
    headline: '几乎不省，甚至更差',
    hint: '重活无法进 WASM，迁过去反而多一层编排——继续用专用沙箱。',
  },
};

// 每个负载的逐项改造建议（诚实、可执行）。
export const REMEDIATIONS: Record<string, string[]> = {
  coding: [
    '近乎全 native，是进程内运行时的理想负载——主路径直接迁，收益最大。',
    '唯一漏水点是偶发的无头浏览器 e2e：把它拆到独立的按需沙箱池，不占主路径成本。',
    '注意：即便如此，真实倍数也远低于 254× 头条——因为极少量 mount 调用按成本加权后仍设下地板。',
  ],
  data: [
    'duckdb / sqlite / arrow 都是 native，收益中等偏上，值得迁。',
    '把 pandas/numpy 的原生扩展热路径尽量改用 duckdb SQL 或 arrow 计算下推，减少 mount。',
    'GPU 打分保留在专用真沙箱，不要试图塞进 WASM；把它隔离后真实倍数可继续往上抬。',
  ],
  scraping: [
    '无头 chromium 抓取是最大漏水点，占了 WASM 成本的大头——它决定了你的真实倍数。',
    '能用 native fetch + cheerio 覆盖的静态站点先全部移过去；只对必须渲染 JS 的站点走按需浏览器沙箱。',
    'x86 代理轮换二进制换成 WASM 友好实现或纯 JS，可去掉一处 mount。',
  ],
  media: [
    'ffmpeg 转码 + GPU 推理占了 ~95% 成本且都无法进 WASM——进程内运行时对你几乎无用。',
    '不要迁移主链路：继续用专门的媒体 / GPU 沙箱，迁过去只会多一层编排、反而更贵。',
    '只有少量 bash/sqlite 元数据操作值得放进 native，但省下的钱可以忽略不计。',
  ],
};
