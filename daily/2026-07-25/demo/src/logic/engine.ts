import type {
  DatasetPreflight,
  FailureKind,
  Lever,
  PortfolioMode,
  PortfolioResult,
  PortfolioSliceResult,
  ROI,
  SliceAnalysis,
  TraceSlice,
  TrainabilityBreakdown,
  Verdict,
} from '../types';

// ---------------------------------------------------------------------------
// 常量：各杠杆的成本 / 延迟 / 返工 / 数据需求（均为演示用的确定性系数）
// ---------------------------------------------------------------------------
const DISTILL_COST_FACTOR = 0.12; // 蒸馏后小模型单价约为前沿的 12%
const DISTILL_LATENCY_FACTOR = 0.42;
const DISTILL_CORR_FACTOR = 1.1; // 小模型返工略升
const DISTILL_QUALITY = 0.96;
const DISTILL_REQ = 2000;
const DISTILL_TRAIN_USD = 220;

const FT_CORR_FACTOR = 0.4; // 微调修复格式/语气漂移，返工降约 60%
const FT_QUALITY = 1.0;
const FT_REQ = 800;
const FT_TRAIN_USD = 70;

// 非训练类杠杆（用于组合模拟）
const RAG_TOKEN_OVERHEAD = 1.12; // 检索使 token 略增
const RAG_CORR_FACTOR = 0.4; // 补齐缺知识后返工大降
const RAG_LATENCY_FACTOR = 1.15;
const PROMPT_CORR_FACTOR = 0.5;
const ROUTING_EASY_FRAC = 0.6; // 60% 简单请求路由到小模型
const ROUTING_CORR_FACTOR = 0.92;

// 「盲目全训」下，对本不该训练的片子强行蒸馏的质量惩罚（返工倍数）
const WRONG_TRAIN_CORR_PENALTY: Record<Lever, number> = {
  RAG: 1.8, // 缺知识：训练加不进新鲜知识
  KEEP_FRONTIER: 2.4, // 硬推理：小模型直接塌
  PROMPT: 1.5, // 指令歧义：训练不解决歧义
  ROUTING: 1.6, // 难度不稳定：小模型覆盖不了长尾
  DISTILL: DISTILL_CORR_FACTOR,
  FINETUNE: FT_CORR_FACTOR,
};

const clamp01 = (x: number): number => Math.max(0, Math.min(1, x));

const FAILURE_LABEL: Record<FailureKind, string> = {
  missingKnowledge: '缺知识',
  ambiguous: '指令歧义',
  formatDrift: '格式/语气漂移',
  reasoning: '硬推理错误',
  expensiveSlow: '正确但太贵/慢',
};

const LEVER_LABEL: Record<Lever, string> = {
  PROMPT: 'Prompt 修正',
  RAG: '接 RAG',
  ROUTING: '难度路由',
  FINETUNE: '微调 LoRA',
  DISTILL: '蒸馏小模型',
  KEEP_FRONTIER: '保持前沿模型',
};

export const failureLabel = (k: FailureKind): string => FAILURE_LABEL[k];
export const leverLabel = (l: Lever): string => LEVER_LABEL[l];

/** 找出占比最高的失败信号 */
export function dominantFailure(s: TraceSlice): FailureKind {
  const entries = Object.entries(s.failureMix) as [FailureKind, number][];
  entries.sort((a, b) => b[1] - a[1]);
  return entries[0][0];
}

/** 核心：由主导失败信号（+稳定性）决定杠杆 */
export function decideLever(s: TraceSlice): { lever: Lever; dominant: FailureKind; reason: string } {
  const dominant = dominantFailure(s);
  const pct = Math.round(s.failureMix[dominant] * 100);
  switch (dominant) {
    case 'missingKnowledge':
      return {
        lever: 'RAG',
        dominant,
        reason: `${pct}% 失败是「缺知识」：微调加不进新鲜/专有事实，应接检索而非训练。`,
      };
    case 'ambiguous':
      return {
        lever: 'PROMPT',
        dominant,
        reason: `${pct}% 失败是「指令歧义」：先修 prompt/澄清模板，训练不解决歧义。`,
      };
    case 'reasoning':
      return {
        lever: 'KEEP_FRONTIER',
        dominant,
        reason: `${pct}% 失败是「硬推理」且高风险：小模型会塌，保持前沿或换更强模型。`,
      };
    case 'formatDrift':
      return {
        lever: 'FINETUNE',
        dominant,
        reason: `${pct}% 失败是「格式/语气漂移」且较稳定：微调 LoRA 把风格固化，性价比最高。`,
      };
    case 'expensiveSlow':
    default:
      if (s.stability >= 0.7) {
        return {
          lever: 'DISTILL',
          dominant,
          reason: `${pct}% 是「正确但太贵/慢」且高度稳定（stability ${s.stability.toFixed(2)}）：蒸馏成小模型直降成本/延迟。`,
        };
      }
      return {
        lever: 'ROUTING',
        dominant,
        reason: `${pct}% 是「正确但太贵/慢」但难度不稳定（stability ${s.stability.toFixed(2)}）：难度路由把简单请求分流，训练难泛化。`,
      };
  }
}

export const isTrainingLever = (l: Lever): boolean => l === 'DISTILL' || l === 'FINETUNE';

/** 数据集预检：从 gold 样本扣除重复 / PII / 泄漏后得到可用样本 */
export function datasetPreflight(s: TraceSlice, lever: Lever): DatasetPreflight {
  const removedDup = Math.round(s.goldExamples * s.hygiene.dupRate);
  const afterDup = s.goldExamples - removedDup;
  const removedPii = Math.round(afterDup * s.hygiene.piiRate);
  const afterPii = afterDup - removedPii;
  const removedLeak = Math.round(afterPii * s.hygiene.leakRate);
  const usable = afterPii - removedLeak;
  const required = lever === 'DISTILL' ? DISTILL_REQ : FT_REQ;
  const gap = Math.max(0, required - usable);
  return {
    gold: s.goldExamples,
    usable,
    required,
    enough: usable >= required,
    gap,
    removedDup,
    removedPii,
    removedLeak,
  };
}

const monthlyBaseUSD = (s: TraceSlice): number =>
  (s.monthlyCalls * (s.avgInTok + s.avgOutTok)) / 1_000_000 * s.frontierCostPer1M;

/** 训练类杠杆的 ROI 投影 */
export function computeROI(s: TraceSlice, lever: Lever): ROI {
  const base = monthlyBaseUSD(s);
  const frontierMonthly = base * (1 + s.correctionRate);

  let newCostPer1MFactor: number;
  let newCorr: number;
  let newLatency: number;
  let quality: number;
  let trainingCost: number;
  if (lever === 'DISTILL') {
    newCostPer1MFactor = DISTILL_COST_FACTOR;
    newCorr = s.correctionRate * DISTILL_CORR_FACTOR;
    newLatency = s.frontierLatencyMs * DISTILL_LATENCY_FACTOR;
    quality = DISTILL_QUALITY;
    trainingCost = DISTILL_TRAIN_USD;
  } else {
    // FINETUNE：同尺寸模型，单价不变，靠减少返工省钱 + 提升一致性
    newCostPer1MFactor = 1.0;
    newCorr = s.correctionRate * FT_CORR_FACTOR;
    newLatency = s.frontierLatencyMs;
    quality = FT_QUALITY;
    trainingCost = FT_TRAIN_USD;
  }

  const newMonthly = base * newCostPer1MFactor * (1 + newCorr);
  const monthlySavings = frontierMonthly - newMonthly;
  const savingsPct = frontierMonthly > 0 ? monthlySavings / frontierMonthly : 0;
  const latencyDropPct =
    s.frontierLatencyMs > 0 ? (s.frontierLatencyMs - newLatency) / s.frontierLatencyMs : 0;
  const breakEvenDays = monthlySavings > 0 ? Math.ceil(trainingCost / (monthlySavings / 30)) : -1;

  return {
    frontierMonthlyUSD: frontierMonthly,
    newMonthlyUSD: newMonthly,
    monthlySavingsUSD: monthlySavings,
    savingsPct,
    frontierLatencyMs: s.frontierLatencyMs,
    newLatencyMs: newLatency,
    latencyDropPct,
    qualityRetention: quality,
    trainingCostUSD: trainingCost,
    breakEvenDays,
  };
}

/** 可训练性评分（0–100）：量 × 省幅 × 稳定性 × 数据充足度 */
export function trainability(
  s: TraceSlice,
  dataset: DatasetPreflight,
  roi: ROI | null,
): TrainabilityBreakdown {
  const volume = clamp01(s.monthlyCalls / 150_000);
  const saving = roi ? clamp01(roi.savingsPct) : 0;
  const stability = clamp01(s.stability);
  const data = clamp01(dataset.usable / dataset.required);
  const score = Math.round(100 * (0.3 * volume + 0.25 * saving + 0.25 * stability + 0.2 * data));
  return { volume, saving, stability, data, score };
}

/** 单片完整分析 */
export function analyzeSlice(s: TraceSlice): SliceAnalysis {
  const { lever, dominant, reason } = decideLever(s);
  const isTraining = isTrainingLever(lever);
  const dataset = datasetPreflight(s, isTraining ? lever : 'FINETUNE');
  const roi = isTraining ? computeROI(s, lever) : null;
  const tb = trainability(s, dataset, roi);

  let verdict: Verdict;
  let verdictNote: string;
  if (!isTraining) {
    verdict = 'NO_TRAIN';
    verdictNote = `训练不是这片的杠杆——建议「${LEVER_LABEL[lever]}」，把预算省下来。`;
  } else if (!dataset.enough) {
    verdict = 'NEED_DATA';
    verdictNote = `值得训，但可用样本 ${dataset.usable} < 所需 ${dataset.required}，需再攒 ${dataset.gap} 条再动手。`;
  } else if (tb.score >= 60 && roi && roi.monthlySavingsUSD > 0) {
    verdict = 'GO';
    verdictNote = `建议训练：可训练性 ${tb.score}/100，每月约省 $${Math.round(
      roi.monthlySavingsUSD,
    )}，约 ${roi.breakEvenDays} 天回本。`;
  } else {
    verdict = 'NOT_WORTH';
    verdictNote = `虽可训，但性价比不足（评分 ${tb.score}/100），不建议投入。`;
  }

  return {
    slice: s,
    dominant,
    lever,
    reason,
    isTraining,
    dataset,
    trainability: tb,
    roi,
    verdict,
    verdictNote,
  };
}

// ---------------------------------------------------------------------------
// 组合模拟：frontier（全前沿）/ recommended（按火候建议）/ trainAll（盲目全训）
// ---------------------------------------------------------------------------
function simulateSlice(s: TraceSlice, mode: PortfolioMode): PortfolioSliceResult {
  const base = monthlyBaseUSD(s);
  const { lever } = decideLever(s);

  let costFactor = 1;
  let corr = s.correctionRate;
  let latency = s.frontierLatencyMs;

  if (mode === 'frontier') {
    costFactor = 1;
    corr = s.correctionRate;
    latency = s.frontierLatencyMs;
  } else if (mode === 'recommended') {
    switch (lever) {
      case 'DISTILL':
        costFactor = DISTILL_COST_FACTOR;
        corr = s.correctionRate * DISTILL_CORR_FACTOR;
        latency = s.frontierLatencyMs * DISTILL_LATENCY_FACTOR;
        break;
      case 'FINETUNE':
        costFactor = 1;
        corr = s.correctionRate * FT_CORR_FACTOR;
        latency = s.frontierLatencyMs;
        break;
      case 'RAG':
        costFactor = RAG_TOKEN_OVERHEAD;
        corr = s.correctionRate * RAG_CORR_FACTOR;
        latency = s.frontierLatencyMs * RAG_LATENCY_FACTOR;
        break;
      case 'PROMPT':
        costFactor = 1;
        corr = s.correctionRate * PROMPT_CORR_FACTOR;
        latency = s.frontierLatencyMs;
        break;
      case 'ROUTING':
        costFactor = ROUTING_EASY_FRAC * DISTILL_COST_FACTOR + (1 - ROUTING_EASY_FRAC) * 1;
        corr = s.correctionRate * ROUTING_CORR_FACTOR;
        latency =
          s.frontierLatencyMs *
          (ROUTING_EASY_FRAC * DISTILL_LATENCY_FACTOR + (1 - ROUTING_EASY_FRAC) * 1);
        break;
      case 'KEEP_FRONTIER':
      default:
        costFactor = 1;
        corr = s.correctionRate;
        latency = s.frontierLatencyMs;
        break;
    }
  } else {
    // trainAll：无脑把每片都蒸馏成小模型
    costFactor = DISTILL_COST_FACTOR;
    latency = s.frontierLatencyMs * DISTILL_LATENCY_FACTOR;
    corr = s.correctionRate * WRONG_TRAIN_CORR_PENALTY[lever];
  }

  const monthlyUSD = base * costFactor * (1 + corr);
  return { id: s.id, name: s.name, monthlyUSD, latencyMs: latency, correctionRate: corr };
}

export function portfolio(slices: TraceSlice[], mode: PortfolioMode): PortfolioResult {
  const perSlice = slices.map((s) => simulateSlice(s, mode));
  const totalMonthlyUSD = perSlice.reduce((a, r) => a + r.monthlyUSD, 0);
  const totalCalls = slices.reduce((a, s) => a + s.monthlyCalls, 0);
  const weightedLatencyMs =
    perSlice.reduce((a, r, i) => a + r.latencyMs * slices[i].monthlyCalls, 0) / totalCalls;
  const overallCorrectionRate =
    perSlice.reduce((a, r, i) => a + r.correctionRate * slices[i].monthlyCalls, 0) / totalCalls;

  let oneTimeTrainingUSD = 0;
  for (const s of slices) {
    const { lever } = decideLever(s);
    if (mode === 'recommended') {
      if (lever === 'DISTILL') oneTimeTrainingUSD += DISTILL_TRAIN_USD;
      else if (lever === 'FINETUNE') oneTimeTrainingUSD += FT_TRAIN_USD;
    } else if (mode === 'trainAll') {
      oneTimeTrainingUSD += DISTILL_TRAIN_USD; // 盲目全训：每片都付一次训练费
    }
  }

  return {
    mode,
    perSlice,
    totalMonthlyUSD,
    weightedLatencyMs,
    overallCorrectionRate,
    oneTimeTrainingUSD,
  };
}

/** 生成「训练清单」——只把该训的片子导出成可交给训练平台的 TOML 预览 */
export function trainingPlanToml(slices: TraceSlice[]): string {
  const lines: string[] = ['# 火候 Huohou — 训练清单（仅含建议训练的分片）', ''];
  let n = 0;
  for (const s of slices) {
    const a = analyzeSlice(s);
    if (!a.isTraining) continue;
    n += 1;
    const method = a.lever === 'DISTILL' ? 'distill' : 'lora_sft';
    lines.push(`[[job]]`);
    lines.push(`slice = "${s.id}"            # ${s.name}`);
    lines.push(`method = "${method}"`);
    lines.push(`dataset_size = ${a.dataset.usable}   # 清洗后可用样本`);
    lines.push(`ready = ${a.dataset.enough ? 'true' : 'false'}${a.dataset.enough ? '' : `   # 还差 ${a.dataset.gap} 条`}`);
    if (a.roi) {
      lines.push(`est_monthly_savings_usd = ${Math.round(a.roi.monthlySavingsUSD)}`);
      lines.push(`break_even_days = ${a.roi.breakEvenDays}`);
    }
    lines.push('');
  }
  if (n === 0) lines.push('# （无分片达到训练标准）');
  return lines.join('\n');
}
