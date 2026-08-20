import type {
  AgentPR,
  CalibrationCase,
  Candidate,
  Decision,
  FlipResult,
  FlipSeverity,
  PrefId,
  ScoredCandidate,
  Summary,
  TasteProfile,
} from './types';
import { isCopyleft } from './labels';

// —— 说明：这是一个「模拟」的确定性选型引擎（纯函数、可解释）。
// 真实产品会用 agent 自己给出的选型理由 + 实时 registry（npm / deps.dev）数据。
// 这里所有数字都是 mock，用于把「按口味重选」这件事讲清楚。

const clamp01 = (x: number): number => Math.max(0, Math.min(1, x));

export const EMPTY_TASTE: TasteProfile = {
  preferNative: 0,
  preferLight: 0,
  preferMaintained: 0,
  preferFewerTransitive: 0,
  denyCopyleft: 0,
  preferTyped: 0,
};

// 每个维度的「好度」0..1（越高越好）
function goodness(c: Candidate, pref: PrefId): number {
  switch (pref) {
    case 'preferLight':
      return clamp01(1 - c.bundleKb / 300);
    case 'preferMaintained':
      return clamp01(1 - c.lastPublishMonths / 36);
    case 'preferFewerTransitive':
      return clamp01(1 - c.transitiveDeps / 30);
    case 'preferTyped':
      return c.typed ? 1 : 0;
    case 'preferNative':
      return c.isNativeApproach ? 1 : 0;
    case 'denyCopyleft':
      return isCopyleft(c.license) ? 0 : 1; // 只作硬规则，不参与加分
    default:
      return 0;
  }
}

const HARD_PENALTY = 1000;

export function scoreCandidate(
  c: Candidate,
  taste: TasteProfile,
): { score: number; disqualified: boolean } {
  let score = 0;
  let disqualified = false;
  (Object.keys(taste) as PrefId[]).forEach((pref) => {
    const w = taste[pref];
    if (w <= 0) return;
    if (pref === 'denyCopyleft') {
      if (isCopyleft(c.license)) {
        disqualified = true;
        score -= HARD_PENALTY;
      }
      return;
    }
    score += w * goodness(c, pref);
  });
  return { score, disqualified };
}

export function scoreDecision(decision: Decision, taste: TasteProfile): ScoredCandidate[] {
  return decision.candidates.map((candidate) => {
    const { score, disqualified } = scoreCandidate(candidate, taste);
    return { candidate, score, disqualified };
  });
}

export const hasActivePrefs = (taste: TasteProfile): boolean =>
  (Object.values(taste) as number[]).some((w) => w > 0);

export function candidateByName(decision: Decision, name: string): Candidate {
  const found = decision.candidates.find((c) => c.name === name);
  if (!found) throw new Error(`candidate not found: ${name}`);
  return found;
}

// 口味下的最佳选择；只有当存在「严格优于」agent 选择的候选时才改判。
// 无任何口味、或没有候选严格更优（含并列）时，尊重 agent 的原选择（不替你改判）。
export function tastePick(decision: Decision, taste: TasteProfile): Candidate {
  const agentPick = candidateByName(decision, decision.pickedName);
  if (!hasActivePrefs(taste)) return agentPick;
  const scored = scoreDecision(decision, taste);
  const agentScore = scored.find((s) => s.candidate.name === agentPick.name)!.score;
  const maxScore = Math.max(...scored.map((s) => s.score));
  if (agentScore >= maxScore) return agentPick; // agent 已是（并列）最优 → 不改判
  const best = [...scored]
    .filter((s) => s.score > agentScore)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (a.candidate.bundleKb !== b.candidate.bundleKb)
        return a.candidate.bundleKb - b.candidate.bundleKb;
      return a.candidate.name.localeCompare(b.candidate.name);
    })[0];
  return best.candidate;
}

function flipReasons(
  agentPick: Candidate,
  pick: Candidate,
  taste: TasteProfile,
): { reasons: string[]; severity: FlipSeverity } {
  const reasons: string[] = [];
  let severity: FlipSeverity = 'soft';

  if (taste.denyCopyleft > 0 && isCopyleft(agentPick.license)) {
    reasons.push(
      `许可硬伤：${agentPick.name} 是 ${agentPick.license}（copyleft），你的口味禁用；${pick.name} 是 ${pick.license}。`,
    );
    severity = 'hard';
  }
  if (
    taste.preferMaintained > 0 &&
    agentPick.lastPublishMonths >= 24 &&
    pick.lastPublishMonths < agentPick.lastPublishMonths
  ) {
    reasons.push(
      `维护存疑：${agentPick.name} 已 ${agentPick.lastPublishMonths} 个月没发版，${pick.name} 更活跃。`,
    );
    if (severity === 'soft') severity = 'regret';
  }
  if (taste.preferLight > 0 && agentPick.bundleKb - pick.bundleKb >= 30 && agentPick.bundleKb >= 50) {
    reasons.push(`体积过重：${agentPick.name} ${agentPick.bundleKb}KB → ${pick.name} ${pick.bundleKb}KB。`);
    if (severity === 'soft') severity = 'regret';
  }
  if (taste.preferNative > 0 && pick.isNativeApproach && !agentPick.isNativeApproach) {
    reasons.push(`能用原生：${pick.name} 零依赖即可，无需引入 ${agentPick.name}。`);
  }
  if (taste.preferFewerTransitive > 0 && agentPick.transitiveDeps - pick.transitiveDeps >= 3) {
    reasons.push(`供应链更窄：少拖 ${agentPick.transitiveDeps - pick.transitiveDeps} 个传递依赖。`);
  }
  if (taste.preferTyped > 0 && !agentPick.typed && pick.typed) {
    reasons.push(`类型更好：${pick.name} 自带一等 TS 类型。`);
  }
  if (reasons.length === 0) reasons.push(`在你的口味下，${pick.name} 综合更合适。`);
  return { reasons, severity };
}

export function computeFlips(pr: AgentPR, taste: TasteProfile): FlipResult[] {
  return pr.decisions.map((decision) => {
    const agentPick = candidateByName(decision, decision.pickedName);
    const pick = tastePick(decision, taste);
    const flipped = pick.name !== agentPick.name;
    const bundleDelta = agentPick.bundleKb - pick.bundleKb;
    const transitiveDelta = agentPick.transitiveDeps - pick.transitiveDeps;
    const removedDep = flipped && pick.isNativeApproach && !agentPick.isNativeApproach;
    const clearedLicense = flipped && isCopyleft(agentPick.license) && !isCopyleft(pick.license);
    let severity: FlipSeverity = 'soft';
    let reasons: string[] = [];
    if (flipped) {
      const r = flipReasons(agentPick, pick, taste);
      severity = r.severity;
      reasons = r.reasons;
    }
    return {
      decision,
      agentPick,
      tastePick: pick,
      flipped,
      severity,
      reasons,
      bundleDelta,
      transitiveDelta,
      removedDep,
      clearedLicense,
    };
  });
}

export function summarize(flips: FlipResult[]): Summary {
  const flipped = flips.filter((f) => f.flipped);
  const regrets = flipped.filter((f) => f.severity === 'hard' || f.severity === 'regret').length;
  const softFlips = flipped.filter((f) => f.severity === 'soft').length;
  return {
    decisions: flips.length,
    flips: flipped.length,
    regrets,
    softFlips,
    goodPicks: flips.length - flipped.length,
    bundleSavedKb: flipped.reduce((s, f) => s + Math.max(0, f.bundleDelta), 0),
    transitiveSaved: flipped.reduce((s, f) => s + Math.max(0, f.transitiveDelta), 0),
    depsRemoved: flipped.filter((f) => f.removedDep).length,
    licenseIssuesCleared: flipped.filter((f) => f.clearedLicense).length,
  };
}

// 从校准用例里选中的理由 chip 学出一份口味档案（确定性映射）
export function learnTaste(
  selectedChipIds: ReadonlySet<string>,
  cases: CalibrationCase[],
): TasteProfile {
  const taste: TasteProfile = { ...EMPTY_TASTE };
  cases.forEach((cs) => {
    cs.chips.forEach((chip) => {
      if (selectedChipIds.has(chip.id)) {
        const inc = chip.pref === 'denyCopyleft' ? 3 : 2;
        taste[chip.pref] = Math.min(3, taste[chip.pref] + inc);
      }
    });
  });
  return taste;
}
