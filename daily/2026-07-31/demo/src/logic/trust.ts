import type { Memory, Scenario, TrustBreakdown, GateVerdict } from '../types';
import { NOW, TRUST_THRESHOLD } from '../data/memories';

const MS_PER_DAY = 1000 * 60 * 60 * 24;

// 易变记忆衰减快（tau≈60 天），耐久记忆几乎不衰减（tau≈1500 天）。
const TAU_VOLATILE = 60;
const TAU_DURABLE = 1500;

export function ageDaysOf(dateStr: string): number {
  const d = new Date(dateStr).getTime();
  return Math.max(0, Math.round((NOW.getTime() - d) / MS_PER_DAY));
}

export function freshnessFactor(m: Memory): number {
  if (m.pinned) return 1; // pin = 用户背书、耐久化、停止衰减
  const age = ageDaysOf(m.lastConfirmedAt);
  const tau = m.category === 'durable' ? TAU_DURABLE : TAU_VOLATILE;
  return clamp01(Math.exp(-age / tau));
}

// confirm 次数越多越可信；3 次即封顶。
export function confirmationFactor(n: number): number {
  if (n <= 0) return 0.15;
  return clamp01(Math.log(1 + n) / Math.log(4));
}

// 取最强来源的权威度（政策 doc 高、随口 chat 低）。
export function authorityFactor(m: Memory): number {
  if (m.sources.length === 0) return 0.3;
  return clamp01(Math.max(...m.sources.map((s) => s.authority)));
}

function memAuthority(m: Memory): number {
  return authorityFactor(m);
}

// 两条矛盾记忆谁"赢"：先比来源权威度，再比最近确认时间。
function winsAgainst(a: Memory, b: Memory): boolean {
  const aa = memAuthority(a);
  const ba = memAuthority(b);
  if (Math.abs(aa - ba) > 0.05) return aa > ba;
  return new Date(a.lastConfirmedAt).getTime() >= new Date(b.lastConfirmedAt).getTime();
}

export function computeTrust(m: Memory, all: Memory[]): TrustBreakdown {
  const freshness = freshnessFactor(m);
  const confirmation = confirmationFactor(m.confirmations);
  const authority = authorityFactor(m);
  const ageDays = ageDaysOf(m.lastConfirmedAt);

  // 找出当前仍生效（双方都未退役）的矛盾对手。
  const activeConflicts = m.conflictsWith
    .map((id) => all.find((x) => x.id === id))
    .filter((x): x is Memory => !!x && !x.retired);

  let losesConflict = false;
  let conflictPenalty = 0;
  if (!m.retired && activeConflicts.length > 0) {
    losesConflict = activeConflicts.some((c) => !winsAgainst(m, c));
    conflictPenalty = losesConflict ? 0.6 : 0.12; // 被更新/更权威的记忆推翻 → 重罚；仅"存在未消解噪声" → 轻罚
  }

  const score = m.retired
    ? 0
    : clamp01(freshness * confirmation * authority * (1 - conflictPenalty));

  return {
    freshness,
    confirmation,
    authority,
    conflictPenalty,
    ageDays,
    score,
    activeConflictIds: activeConflicts.map((c) => c.id),
    losesConflict,
  };
}

export interface GateResult {
  verdict: GateVerdict;
  headline: string;
  reasons: string[];
  reliedId: string;
  reliedTrust: number;
  policyId: string | null;
  policyViolated: boolean;
  naiveRecalledIds: string[]; // 朴素检索召回
  augmentedIds: string[]; // 忆证 额外追加的矛盾/治理记忆
  contactChannel: string; // 由 m2/m5 的信任推导出的"如何通知住客"
}

// 忆证 的核心：在动作执行前，综合"依据记忆是否可信 + 是否违反治理政策"给出 gate 结论。
export function computeGate(
  memories: Memory[],
  scenario: Scenario,
  managerApproved: boolean,
): GateResult {
  const byId = (id: string) => memories.find((m) => m.id === id);
  const relied = byId(scenario.reliesOn);
  const reliedTrust = relied ? computeTrust(relied, memories).score : 0;
  const reliedRetired = !relied || relied.retired;

  // 朴素检索召回；忆证 再顺着 conflictsWith 追加被漏掉的矛盾/治理记忆。
  const naive = scenario.recalledIds.filter((id) => !byId(id)?.retired);
  const augmentedSet = new Set<string>();
  for (const id of scenario.recalledIds) {
    const m = byId(id);
    if (!m || m.retired) continue;
    for (const cId of m.conflictsWith) {
      const c = byId(cId);
      if (c && !c.retired && !scenario.recalledIds.includes(cId)) augmentedSet.add(cId);
    }
  }
  const augmented = [...augmentedSet];

  // 治理政策：未退役、有 doc 来源、权威度高、且与"依据记忆"矛盾的耐久记忆。
  const policy = memories.find(
    (m) =>
      !m.retired &&
      m.category === 'durable' &&
      authorityFactor(m) >= 0.85 &&
      m.sources.some((s) => s.type === 'doc') &&
      m.conflictsWith.includes(scenario.reliesOn),
  );
  const policyViolated = !!policy && scenario.amount > scenario.policyThreshold;

  // 由联系偏好记忆（m2 邮件 vs m5 WhatsApp）推导"如何通知"。
  const contactCandidates = memories
    .filter((m) => !m.retired && /(邮件|WhatsApp|电话)/.test(m.statement))
    .map((m) => ({ m, t: computeTrust(m, memories).score }))
    .sort((a, b) => b.t - a.t);
  let contactChannel = '（无可信联系偏好，建议先确认）';
  if (contactCandidates.length > 0 && contactCandidates[0].t > 0.2) {
    const top = contactCandidates[0].m.statement;
    if (top.includes('WhatsApp')) contactChannel = 'WhatsApp';
    else if (top.includes('邮件')) contactChannel = '邮件';
    else if (top.includes('电话')) contactChannel = '电话';
  }

  const reasons: string[] = [];
  let verdict: GateVerdict;
  let headline: string;

  if (policyViolated && !managerApproved) {
    verdict = 'BLOCK';
    headline = '拦截 · 动作违反治理政策，转经理审批';
    reasons.push(
      `动作金额 $${scenario.amount} 超过政策阈值 $${scenario.policyThreshold}，而政策记忆「${policy!.statement}」明确要求经理审批。`,
    );
    if (reliedRetired) {
      reasons.push('agent 原本依据的记忆已被退役，动作失去可信依据。');
    } else {
      reasons.push(
        `agent 依据的记忆 ${relied!.id}（trust=${Math.round(reliedTrust * 100)}）已被更新/更权威的政策记忆推翻，不能作为放行理由。`,
      );
    }
  } else if (policyViolated && managerApproved) {
    verdict = 'PROCEED';
    headline = '放行 · 已补齐经理审批';
    reasons.push('政策要求的经理审批已在忆证中补齐，动作可继续执行（人已在回路里）。');
  } else if (reliedRetired) {
    verdict = 'HOLD';
    headline = '暂缓 · 依据记忆已退役，需重新确认';
    reasons.push('agent 依据的记忆已被退役，缺少可信依据，需人工确认后再执行。');
  } else if (reliedTrust < TRUST_THRESHOLD) {
    verdict = 'HOLD';
    headline = '暂缓 · 依据记忆信任不足，需人工确认';
    reasons.push(
      `依据记忆 ${relied!.id} 的 trust=${Math.round(reliedTrust * 100)} 低于阈值 ${Math.round(
        TRUST_THRESHOLD * 100,
      )}（过期 / 单一来源 / 存在矛盾）。`,
    );
  } else {
    verdict = 'PROCEED';
    headline = '放行 · 依据记忆可信、无政策冲突';
    reasons.push('依据记忆信任达标且未触发治理政策，动作可执行。');
  }

  // 附带矛盾提示
  if (augmented.length > 0) {
    reasons.push(
      `忆证 额外拉入了朴素检索漏掉的 ${augmented.length} 条矛盾/治理记忆（${augmented.join('、')}）。`,
    );
  }

  return {
    verdict,
    headline,
    reasons,
    reliedId: scenario.reliesOn,
    reliedTrust,
    policyId: policy ? policy.id : null,
    policyViolated,
    naiveRecalledIds: naive,
    augmentedIds: augmented,
    contactChannel,
  };
}

export function trustColor(score: number): string {
  if (score >= TRUST_THRESHOLD) return 'var(--ok)';
  if (score >= 0.3) return 'var(--warn)';
  return 'var(--bad)';
}

export function trustLabel(score: number): string {
  if (score >= TRUST_THRESHOLD) return '可信';
  if (score >= 0.3) return '存疑';
  return '不可信';
}

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}
