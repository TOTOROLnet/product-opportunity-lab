// 对味 Duìwèi — 类型定义
// 全部为 mock 结构；真实产品会从 agent 自己的选型理由 + 实时 registry（npm / deps.dev）数据里取。

export type LicenseKind =
  | 'MIT'
  | 'Apache-2.0'
  | 'ISC'
  | 'BSD-3-Clause'
  | 'GPL-3.0'
  | 'AGPL-3.0'
  | 'none'; // 原生 / 无第三方许可

// 一个可选项：agent 选中的那个，或它（本应）考虑过的替代。
export interface Candidate {
  name: string;
  version: string;
  bundleKb: number; // 约算 min+gzip 体积（原生方案为 0）
  weeklyDownloads: number; // mock 流行度
  lastPublishMonths: number; // 距上次发版的月数（衡量维护度；原生方案记 0）
  transitiveDeps: number; // 拖进来的传递依赖数量（原生方案为 0）
  license: LicenseKind;
  typed: boolean; // 是否一等公民 TS 类型（靠 @types 记 false）
  isNativeApproach: boolean; // 是否是「不加依赖、用语言/运行时原生能力」的方案
  note: string; // 一句人话点评
}

// agent 在这次 PR 里做的一个「选型决定」。
export interface Decision {
  id: string;
  subGoal: string; // 这个依赖服务于哪个子目标
  agentRationale: string; // agent 自己给出的选型理由
  pickedName: string; // agent 选中的 candidate.name
  candidates: Candidate[]; // 选中的 + 替代方案（都可比较）
  seniorFlag: string; // 资深工程师会挑刺的点（选得好则为空串）
}

export interface AgentPR {
  id: string;
  title: string;
  branch: string;
  agent: string;
  task: string;
  filesChanged: number;
  decisions: Decision[];
}

// —— 口味档案 ——
export type PrefId =
  | 'preferNative'
  | 'preferLight'
  | 'preferMaintained'
  | 'preferFewerTransitive'
  | 'denyCopyleft'
  | 'preferTyped';

export interface PrefMeta {
  id: PrefId;
  label: string;
  desc: string;
  hard: boolean; // 硬规则：违反即记为「后悔」，与分数无关
}

// prefId -> 权重 0..3；0 = 关闭
export type TasteProfile = Record<PrefId, number>;

// —— 校准用例（教口味） ——
export interface ReasonChip {
  id: string;
  label: string;
  pref: PrefId;
}

export interface CalibrationCase {
  id: string;
  context: string; // 一句话场景
  agentPick: string; // agent 装了什么
  detail: string; // 补充点评
  chips: ReasonChip[]; // 可选的「为什么不满意」理由（点了就学到对应口味）
}

// —— 引擎输出 ——
export interface ScoredCandidate {
  candidate: Candidate;
  score: number;
  disqualified: boolean; // 触发硬规则（如 copyleft）被排除
}

export type FlipSeverity = 'hard' | 'regret' | 'soft';

export interface FlipResult {
  decision: Decision;
  agentPick: Candidate;
  tastePick: Candidate;
  flipped: boolean;
  severity: FlipSeverity; // 仅在 flipped 时有意义
  reasons: string[]; // 为什么翻盘 / 为什么后悔
  bundleDelta: number; // agentPick.bundleKb - tastePick.bundleKb
  transitiveDelta: number;
  removedDep: boolean; // 是否整包移除（换成原生）
  clearedLicense: boolean; // 是否清掉了一个 copyleft 许可问题
}

export interface Summary {
  decisions: number;
  flips: number;
  regrets: number; // severity hard|regret
  softFlips: number;
  goodPicks: number; // agent 选得对味、无需改判
  bundleSavedKb: number;
  transitiveSaved: number;
  depsRemoved: number;
  licenseIssuesCleared: number;
}
