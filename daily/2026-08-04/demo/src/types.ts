// ——— 有数 Yǒushù 数据模型 ———
// 全部为 mock：脚本化的逐次关节数据，模拟「端侧 CV」对每一次 rep 的观测输出。
// 真实产品里这些数由端侧姿态估计给出；Demo 用确定性数据 + 规则引擎复现其判定链路。

// 一次 rep 的可见性（决定端侧 CV 能否可靠判断这一下）。
export type Visibility =
  | 'clear' // 看得清
  | 'angle' // 机位太正/太偏，看不到关键关节角
  | 'occluded' // 器械/肢体遮挡
  | 'fast'; // 动作太快，画面运动模糊

// 达标判定里可能命中的问题项。
export type Issue = 'depth' | 'valgus' | 'tempo';

// 单次 rep 的观测输入（mock CV 输出）。
export interface RepInput {
  // 深度：达到目标深度的百分比（100=充分下蹲到位；>=80 视为达标）。
  depth: number;
  // 膝内扣角度（度，0=不内扣；>10 视为内扣需纠）。
  valgus: number;
  // 下放（离心）用时（秒；<0.8 视为过快）。
  tempo: number;
  // 这一下摄像头看得清不清。
  visibility: Visibility;
}

// 每次 rep 经引擎判定后的结果。
export interface RepResult {
  idx: number; // 1-based 次序
  input: RepInput;
  confidence: number; // 0..1 感知置信度
  seen: boolean; // 置信度是否达到可判定阈值
  verdict: 'good' | 'fix' | 'unseen';
  issue?: Issue;
  quality: number | null; // 0..100 动作质量（unseen 时为 null）
  cue: string; // 教练主提示
  why?: string; // fix：哪块关节/为什么；unseen：为何看不清
  fixTip?: string; // unseen：如何调整机位/节奏
  isStop: boolean; // 这一下触发「该停了」
  afterStop: boolean; // 看清但发生在喊停之后 = 硬撑未计
}

export interface SessionInput {
  id: string;
  exercise: string; // 展示用名称，如「深蹲」
  label: string; // 如「今日 · 深蹲 1 组 ×12」
  reps: RepInput[];
}

export interface SessionResult {
  id: string;
  exercise: string;
  label: string;
  reps: RepResult[];
  attempted: number; // 一共做了几下（讨好型会全数进去）
  seenCount: number; // 看清的次数
  unseenCount: number; // 看不清的次数
  countedGood: number; // 有数计入且达标
  countedFix: number; // 有数计入但有提醒
  counted: number; // 有数计入总数（喊停前的看清次数）
  overexertion: number; // 喊停后仍硬撑的看清次数（未计）
  stopIdx: number | null; // 触发喊停的 rep 次序
  baseline: number; // 质量基线（前 3 次看清的中位数）
}

// 两种教练策略在同一组训练上的对照。
export interface CoachCompare {
  // 讨好型：数满、对看不清的也自信乱纠、从不喊停。
  pleaser: {
    counted: number;
    claimedGood: number;
    blindCorrections: number;
    stoppedAt: number | null;
  };
  // 有数：只认看清的、明说看不清、疲劳喊停。
  yoshu: {
    counted: number;
    verifiedGood: number;
    blindCorrections: number;
    refusedUnseen: number;
    overexertionSkipped: number;
    stoppedAt: number | null;
  };
}

// 一周汇总里每天一行。
export interface DaySummary {
  day: string; // 如「周一」
  exercise: string;
  claimed: number; // 讨好型会报的次数（= attempted）
  trusted: number; // 有数计入的可信次数（= counted）
  medDepth: number; // 当天看清 rep 的深度中位数
  overexertion: number; // 当天硬撑未计次数
}

export interface WeeklyReadout {
  days: DaySummary[];
  totalClaimed: number;
  totalTrusted: number;
  trustPct: number; // 可信次数占比（%）
  depthStart: number; // 首日深度中位数
  depthEnd: number; // 末日深度中位数
  depthDelta: number; // 深度变化（度/百分点）
  fatigueDays: number; // 有硬撑未计的天数
}
