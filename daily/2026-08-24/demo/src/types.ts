export type ArchId = 'self-vps' | 'local' | 'cloud-persistent' | 'edge-ondemand';

export type StressAxis = 'mau' | 'idleRatio' | 'whaleAmplify';

export interface WorkloadProfile {
  mau: number;
  tasksPerUserPerDay: number;
  avgTaskMinutes: number;
  idleRatio: number;
  burstMultiplier: number;
  whaleRatio: number;
  whaleAmplify: number;
  pricePerMonth: number;
}

export interface Architecture {
  id: ArchId;
  name: string;
  tagline: string;
  refProduct: string;
  costBearer: string;
  isolation: number;
  reliability: number;
  costEfficiency: number;
  coldStartMs: number;
  lockInNote: string;
  deliversAutonomy: boolean;
  opsRiskPenalty: number;
  capabilityGap?: string;
}

export interface ArchResult {
  arch: Architecture;
  infraCost: number;
  tokenCost: number;
  computeCost: number;
  revenue: number;
  grossProfit: number;
  marginPct: number;
  costPerActiveUser: number;
  recommendationScore: number;
  isSweetSpot: boolean;
}

export interface UsageDerived {
  totalTasks: number;
  totalBusyHours: number;
  openHours: number;
  avgConcurrentSessions: number;
  peakConcurrentSessions: number;
}

export interface ScenarioPreset {
  id: string;
  name: string;
  blurb: string;
  profile: WorkloadProfile;
}
