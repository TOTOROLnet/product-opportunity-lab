// 风洞 WindTunnel — 类型定义。全部为纯前端 mock 结构，无后端 / 外部 API。

/** 工具族在 WASM 进程内运行时里的兼容分层。 */
export type Tier = 'native' | 'mount' | 'blocked';

/** 一个工具族（agent 会调用的一类命令/能力）。 */
export interface ToolFamily {
  /** 工具名，如 bash / ffmpeg / 无头 chromium 抓取 */
  name: string;
  /** 归类，仅用于展示 */
  category: string;
  /** 每日调用次数（mock） */
  calls: number;
  /** 单次调用的相对成本（∝ 时长 × 内存占用，mock 归一化单位） */
  unitCost: number;
  /** 兼容分层 */
  tier: Tier;
  /** 为什么是这个 tier（可解释原因，mock 知识） */
  reason: string;
}

/** 一个代表性负载（一类 agent 的真实工具调用画像）。 */
export interface Workload {
  id: string;
  name: string;
  blurb: string;
  families: ToolFamily[];
}

/** 单个工具族经引擎计算后的成本明细。 */
export interface FamilyResult extends ToolFamily {
  baselineCost: number; // 旧 microVM 基线：本族总成本
  wasmCost: number; // WASM 运行时：本族总成本
  coldMs: number; // 该 tier 下单次冷启动毫秒
}

/** 出厂判定等级。 */
export type Verdict = 'migrate' | 'cautious' | 'refactor' | 'avoid';

/** 一个负载经引擎计算后的整体结果。 */
export interface WorkloadResult {
  families: FamilyResult[];
  totalCalls: number;
  baselineTotal: number;
  wasmTotal: number;
  /** 你的真实成本倍数 = baselineTotal / wasmTotal */
  honestMultiplier: number;
  /** 厂商头条倍数（native 单位加速），用于对照 */
  headlineMultiplier: number;
  /** native 成本占基线总成本的比例 0–1 */
  nativeCostShare: number;
  /** 掉进 fallback（mount+blocked）的调用占比 0–1 */
  fallbackCallShare: number;
  /** 基线冷启动 P99（ms） */
  baselineColdP99: number;
  /** WASM 冷启动 P99（ms）——只要有 mount 就被拉回沙箱冷启动 */
  wasmColdP99: number;
  verdict: Verdict;
}
