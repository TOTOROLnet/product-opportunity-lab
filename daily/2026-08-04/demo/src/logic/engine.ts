import type {
  CoachCompare,
  DaySummary,
  Issue,
  RepInput,
  RepResult,
  SessionInput,
  SessionResult,
  Visibility,
  WeeklyReadout,
} from '../types';

// ——— 阈值（真实产品由标定得到；Demo 里显式写死，便于复现与自测）———
export const CONF_THRESHOLD = 0.6; // 低于此置信度 = 看不清，不计数、不纠正
export const DEPTH_TARGET = 80; // 深度达标线（%）
export const VALGUS_LIMIT = 10; // 膝内扣容忍上限（度）
export const TEMPO_MIN = 0.8; // 下放最短用时（秒）
export const FATIGUE_RATIO = 0.82; // 质量跌到基线的此比例以下即算「垮」
export const BASELINE_N = 3; // 用前 N 次看清 rep 建立质量基线

// 不同可见性对应的感知置信度（真实产品由姿态估计的不确定性给出）。
const CONF_BY_VIS: Record<Visibility, number> = {
  clear: 0.93,
  angle: 0.42,
  occluded: 0.3,
  fast: 0.5,
};

// 看不清时，如实说明「为什么看不清」与「怎么调」。
const UNSEEN_TEXT: Record<Exclude<Visibility, 'clear'>, { why: string; fixTip: string }> = {
  angle: {
    why: '机位太正，看不到膝盖的侧向角度',
    fixTip: '把手机放到身体侧面约 45°、与髋同高',
  },
  occluded: {
    why: '器械/手臂挡住了膝和髋',
    fixTip: '让镜头能完整看到髋、膝、踝三点',
  },
  fast: {
    why: '这一下太快，画面运动模糊',
    fixTip: '下放放慢到约 1 秒，给镜头看清的时间',
  },
};

export function confidenceFor(vis: Visibility): number {
  return CONF_BY_VIS[vis];
}

// 动作质量：满分 100，按深度/内扣/节奏扣分（仅对看清的 rep 计算）。
export function formQuality(r: RepInput): number {
  let q = 100;
  if (r.depth < DEPTH_TARGET) q -= (DEPTH_TARGET - r.depth) * 1.1;
  if (r.valgus > VALGUS_LIMIT) q -= (r.valgus - VALGUS_LIMIT) * 2.2;
  if (r.tempo < TEMPO_MIN) q -= (TEMPO_MIN - r.tempo) * 40;
  return Math.max(0, Math.min(100, q));
}

// 命中的首要问题（用于生成教练提示）。
function primaryIssue(r: RepInput): { issue: Issue; why: string; cue: string } | null {
  const issues: { issue: Issue; sev: number; why: string; cue: string }[] = [];
  if (r.depth < DEPTH_TARGET) {
    issues.push({
      issue: 'depth',
      sev: (DEPTH_TARGET - r.depth) * 1.1,
      why: `深度只到 ${Math.round(r.depth)}%（目标 ${DEPTH_TARGET}%）`,
      cue: '再往下沉一点，深度不够',
    });
  }
  if (r.valgus > VALGUS_LIMIT) {
    issues.push({
      issue: 'valgus',
      sev: (r.valgus - VALGUS_LIMIT) * 2.2,
      why: `膝盖内扣约 ${Math.round(r.valgus)}°`,
      cue: '膝盖别内扣，往外顶、对准脚尖',
    });
  }
  if (r.tempo < TEMPO_MIN) {
    issues.push({
      issue: 'tempo',
      sev: (TEMPO_MIN - r.tempo) * 40,
      why: `下放只用了 ${r.tempo.toFixed(1)}s`,
      cue: '太快了，下放慢一点更受力',
    });
  }
  if (issues.length === 0) return null;
  issues.sort((a, b) => b.sev - a.sev);
  const top = issues[0];
  return { issue: top.issue, why: top.why, cue: top.cue };
}

function median(nums: number[]): number {
  if (nums.length === 0) return 0;
  const s = [...nums].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

// ——— 核心：对一组训练做诚实判定 ———
export function analyzeSession(input: SessionInput): SessionResult {
  // 第一遍：置信度 + 看清判定 + 质量。
  const pre: RepResult[] = input.reps.map((r, i) => {
    const confidence = confidenceFor(r.visibility);
    const seen = confidence >= CONF_THRESHOLD;
    if (!seen) {
      const t = UNSEEN_TEXT[r.visibility as Exclude<Visibility, 'clear'>];
      return {
        idx: i + 1,
        input: r,
        confidence,
        seen: false,
        verdict: 'unseen',
        quality: null,
        cue: '这一下我看不清，不瞎数也不瞎纠',
        why: t.why,
        fixTip: t.fixTip,
        isStop: false,
        afterStop: false,
      } satisfies RepResult;
    }
    const q = formQuality(r);
    const pi = primaryIssue(r);
    return {
      idx: i + 1,
      input: r,
      confidence,
      seen: true,
      verdict: pi ? 'fix' : 'good',
      issue: pi?.issue,
      quality: q,
      cue: pi ? pi.cue : '到位，稳住这个模式',
      why: pi?.why,
      isStop: false,
      afterStop: false,
    } satisfies RepResult;
  });

  // 第二遍：疲劳喊停。基线 = 前 BASELINE_N 次看清 rep 的质量中位数；
  // 连续两次看清 rep 质量都跌到基线 * FATIGUE_RATIO 以下 → 在第一次那里喊停。
  const seenResults = pre.filter((r) => r.seen);
  const baseQ = seenResults.slice(0, BASELINE_N).map((r) => r.quality as number);
  const baseline = median(baseQ);
  const floor = baseline * FATIGUE_RATIO;

  let stopIdx: number | null = null;
  for (let k = BASELINE_N; k < seenResults.length; k++) {
    const cur = seenResults[k].quality as number;
    const prev = seenResults[k - 1].quality as number;
    if (cur < floor && prev < floor) {
      stopIdx = seenResults[k - 1].idx;
      break;
    }
  }

  // 标注喊停 + 喊停后的硬撑。
  for (const r of pre) {
    if (stopIdx !== null && r.idx === stopIdx) r.isStop = true;
    if (stopIdx !== null && r.seen && r.idx > stopIdx) r.afterStop = true;
  }

  const attempted = pre.length;
  const seenCount = seenResults.length;
  const unseenCount = attempted - seenCount;
  const counted = pre.filter((r) => r.seen && !r.afterStop).length;
  const countedGood = pre.filter((r) => r.seen && !r.afterStop && r.verdict === 'good').length;
  const countedFix = pre.filter((r) => r.seen && !r.afterStop && r.verdict === 'fix').length;
  const overexertion = pre.filter((r) => r.afterStop).length;

  return {
    id: input.id,
    exercise: input.exercise,
    label: input.label,
    reps: pre,
    attempted,
    seenCount,
    unseenCount,
    countedGood,
    countedFix,
    counted,
    overexertion,
    stopIdx,
    baseline,
  };
}

// ——— 两种教练策略对照 ———
export function coachCompare(s: SessionResult): CoachCompare {
  return {
    pleaser: {
      counted: s.attempted, // 全数进去
      claimedGood: s.attempted, // 一律「great job」
      blindCorrections: s.unseenCount, // 对看不清的也自信乱纠
      stoppedAt: null, // 从不喊停
    },
    yoshu: {
      counted: s.counted, // 只认喊停前看清的
      verifiedGood: s.countedGood, // 敢担保的达标
      blindCorrections: 0, // 看不清就明说，绝不瞎纠
      refusedUnseen: s.unseenCount,
      overexertionSkipped: s.overexertion,
      stoppedAt: s.stopIdx,
    },
  };
}

// ——— 一周汇总 + 诚实读数 ———
export function weeklyReadout(sessions: SessionInput[], dayNames: string[]): WeeklyReadout {
  const days: DaySummary[] = sessions.map((inp, i) => {
    const s = analyzeSession(inp);
    const seenDepths = s.reps.filter((r) => r.seen).map((r) => r.input.depth);
    return {
      day: dayNames[i] ?? `第${i + 1}天`,
      exercise: s.exercise,
      claimed: s.attempted,
      trusted: s.counted,
      medDepth: Math.round(median(seenDepths)),
      overexertion: s.overexertion,
    };
  });

  const totalClaimed = days.reduce((a, d) => a + d.claimed, 0);
  const totalTrusted = days.reduce((a, d) => a + d.trusted, 0);
  const trustPct = totalClaimed ? Math.round((totalTrusted / totalClaimed) * 100) : 0;
  const depthStart = days[0]?.medDepth ?? 0;
  const depthEnd = days[days.length - 1]?.medDepth ?? 0;
  const depthDelta = depthEnd - depthStart;
  const fatigueDays = days.filter((d) => d.overexertion > 0).length;

  return {
    days,
    totalClaimed,
    totalTrusted,
    trustPct,
    depthStart,
    depthEnd,
    depthDelta,
    fatigueDays,
  };
}
