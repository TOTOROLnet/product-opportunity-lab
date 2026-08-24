import type {
  ArchId,
  ArchResult,
  Architecture,
  StressAxis,
  UsageDerived,
  WorkloadProfile,
} from '../types';
import { ARCHITECTURES } from '../data/architectures';

// ---- 建模假设常量（非真实云报价；见方法论页透明声明）----
const HOURS_PER_MONTH = 720;
const DAYS_PER_MONTH = 30;

// 模型 token 成本：与「电脑放在哪」正交，四架构按真实忙碌时长同等计费；
// 刻意设为温和基线，让「计算/机器成本结构」成为架构间的主要差异项（这正是本工具的论点）。
const TOKEN_COST_PER_BUSY_HOUR = 0.15;

// 自建 VPS：按峰值并发预置的小实例月租；一台实例可承载的并发会话数。
const VPS_MONTHLY_PER_INSTANCE = 40;
const SESSIONS_PER_INSTANCE = 2;

// 本地客户端：厂商每用户每月的控制面/分发成本（算力在用户设备）。
const LOCAL_CONTROL_PLANE_PER_USER = 0.25;

// 云端常驻：会话开着（忙+闲）就按小时计费的热机单价。
const CLOUD_HOURLY = 0.12;

// 边缘按需：只按真实忙碌小时计费（弹性溢价略高）+ 每会话极小的对象常开开销。
const EDGE_BUSY_HOURLY = 0.18;
const EDGE_PER_SESSION_OVERHEAD = 0.0006;

export function deriveUsage(p: WorkloadProfile): UsageDerived {
  const whaleUsers = p.mau * clamp01(p.whaleRatio);
  const normalUsers = Math.max(p.mau - whaleUsers, 0);
  const tasksPerUserMonth = p.tasksPerUserPerDay * DAYS_PER_MONTH;

  // 鲸鱼「来了不回」：任务量按放大倍数放大，直接推高用量驱动的成本。
  const activityNormal = normalUsers * tasksPerUserMonth;
  const activityWhale = whaleUsers * tasksPerUserMonth * Math.max(p.whaleAmplify, 1);
  const totalTasks = activityNormal + activityWhale;

  const totalBusyHours = (totalTasks * p.avgTaskMinutes) / 60;

  // 闲置比 = 会话开着但没在 tool-call 的时间占比；只有常驻类架构为此付费。
  const idle = clamp(p.idleRatio, 0, 0.95);
  const openHours = totalBusyHours / (1 - idle);

  const avgConcurrentSessions = openHours / HOURS_PER_MONTH;
  const peakConcurrentSessions = avgConcurrentSessions * Math.max(p.burstMultiplier, 1);

  return {
    totalTasks,
    totalBusyHours,
    openHours,
    avgConcurrentSessions,
    peakConcurrentSessions,
  };
}

function infraCostFor(
  arch: Architecture,
  p: WorkloadProfile,
  u: UsageDerived,
): { compute: number; token: number } {
  const token = u.totalBusyHours * TOKEN_COST_PER_BUSY_HOUR;
  let compute = 0;

  switch (arch.id) {
    case 'self-vps': {
      // 按峰值并发预置实例，24/7 常驻，闲置与峰值余量全由厂商买单。
      const instances = Math.max(1, Math.ceil(u.peakConcurrentSessions / SESSIONS_PER_INSTANCE));
      compute = instances * VPS_MONTHLY_PER_INSTANCE;
      break;
    }
    case 'local': {
      // 算力在用户设备，厂商基础设施成本≈仅控制面（按用户数）。
      compute = p.mau * LOCAL_CONTROL_PLANE_PER_USER;
      break;
    }
    case 'cloud-persistent': {
      // 会话开着的整段（忙+闲）都按热机小时计费——闲置比越高越烧钱。
      compute = u.openHours * CLOUD_HOURLY;
      break;
    }
    case 'edge-ondemand': {
      // 只按真实忙碌小时计费 + 每会话极小常开开销；闲置几乎不花钱。
      compute = u.totalBusyHours * EDGE_BUSY_HOURLY + u.totalTasks * EDGE_PER_SESSION_OVERHEAD;
      break;
    }
  }
  return { compute, token };
}

function marginOf(arch: Architecture, p: WorkloadProfile): number {
  const u = deriveUsage(p);
  const { compute, token } = infraCostFor(arch, p, u);
  const revenue = p.mau * p.pricePerMonth;
  if (revenue <= 0) return -100;
  return ((revenue - compute - token) / revenue) * 100;
}

export function evaluate(p: WorkloadProfile): {
  usage: UsageDerived;
  results: ArchResult[];
  sweetSpotId: ArchId | null;
  sweetSpotProfitable: boolean;
} {
  const usage = deriveUsage(p);
  const revenue = p.mau * p.pricePerMonth;

  const results: ArchResult[] = ARCHITECTURES.map((arch) => {
    const { compute, token } = infraCostFor(arch, p, usage);
    const infraCost = compute + token;
    const grossProfit = revenue - infraCost;
    const marginPct = revenue > 0 ? (grossProfit / revenue) * 100 : -100;
    return {
      arch,
      infraCost,
      tokenCost: token,
      computeCost: compute,
      revenue,
      grossProfit,
      marginPct,
      costPerActiveUser: p.mau > 0 ? infraCost / p.mau : 0,
      // 风险调整推荐分 = 毛利率 − 运维/风险惩罚项（对 solo founder 而言运维负担是真实成本）。
      recommendationScore: marginPct - arch.opsRiskPenalty,
      isSweetSpot: false,
    };
  });

  // 甜点：在「真正能交付自治（离开时继续干活）」的架构里，选风险调整推荐分最高者。
  // 本地客户端因不满足自治，展示但不入选甜点（诚实反映权衡，而非只看最便宜）。
  const eligible = results.filter((r) => r.arch.deliversAutonomy);
  let sweetSpotId: ArchId | null = null;
  let sweetSpotProfitable = false;
  if (eligible.length > 0) {
    const best = eligible.reduce((a, b) => (b.recommendationScore > a.recommendationScore ? b : a));
    sweetSpotId = best.arch.id;
    best.isSweetSpot = true;
    sweetSpotProfitable = best.marginPct >= 0;
  }

  return { usage, results, sweetSpotId, sweetSpotProfitable };
}

// ---- 压力扫描：沿某个压力维度扫描，画毛利曲线并找「转负点」----
export const AXIS_META: Record<
  StressAxis,
  { label: string; unit: string; logX: boolean; fmt: (x: number) => string }
> = {
  mau: { label: '活跃用户数', unit: '人', logX: true, fmt: (x) => Math.round(x).toLocaleString('en-US') },
  idleRatio: { label: '闲置比', unit: '', logX: false, fmt: (x) => `${Math.round(x * 100)}%` },
  whaleAmplify: { label: '鲸鱼用量放大', unit: '×', logX: false, fmt: (x) => `${x.toFixed(1)}×` },
};

function axisSamples(axis: StressAxis, p: WorkloadProfile): number[] {
  if (axis === 'mau') return logRange(Math.max(20, Math.round(p.mau / 8)), Math.max(p.mau * 8, 4000), 26);
  if (axis === 'idleRatio') return linRange(0, 0.9, 19);
  return linRange(1, 15, 29);
}

function withAxis(p: WorkloadProfile, axis: StressAxis, v: number): WorkloadProfile {
  return { ...p, [axis]: v };
}

export function stressScan(
  p: WorkloadProfile,
  axis: StressAxis,
): { xs: number[]; marginByArch: Record<ArchId, number[]>; crossing: Record<ArchId, number | null> } {
  const xs = axisSamples(axis, p);
  const marginByArch: Record<ArchId, number[]> = {
    'self-vps': [],
    local: [],
    'cloud-persistent': [],
    'edge-ondemand': [],
  };
  const crossing: Record<ArchId, number | null> = {
    'self-vps': null,
    local: null,
    'cloud-persistent': null,
    'edge-ondemand': null,
  };

  for (const arch of ARCHITECTURES) {
    let prev = Infinity;
    xs.forEach((x, i) => {
      const m = marginOf(arch, withAxis(p, axis, x));
      marginByArch[arch.id].push(m);
      if (crossing[arch.id] == null) {
        if (m < 0 && (prev >= 0 || i === 0)) crossing[arch.id] = x;
      }
      prev = m;
    });
  }
  return { xs, marginByArch, crossing };
}

function logRange(min: number, max: number, count: number): number[] {
  const out: number[] = [];
  const lmin = Math.log10(Math.max(min, 1));
  const lmax = Math.log10(Math.max(max, min * 10));
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    out.push(Math.round(Math.pow(10, lmin + (lmax - lmin) * t)));
  }
  return Array.from(new Set(out));
}
function linRange(min: number, max: number, count: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < count; i++) out.push(min + ((max - min) * i) / (count - 1));
  return out;
}

function clamp(x: number, lo: number, hi: number): number {
  return Math.min(Math.max(x, lo), hi);
}
function clamp01(x: number): number {
  return clamp(x, 0, 1);
}

export function fmtMoney(x: number): string {
  if (!isFinite(x)) return '—';
  if (Math.abs(x) >= 1000) return `$${(x / 1000).toFixed(1)}k`;
  return `$${x.toFixed(0)}`;
}
export function fmtPct(x: number): string {
  if (!isFinite(x)) return '—';
  return `${x.toFixed(0)}%`;
}
export function fmtInt(x: number): string {
  return Math.round(x).toLocaleString('en-US');
}
