import type {
  AuditEntry,
  Category,
  Metrics,
  Outcome,
  Proposal,
  Strategy,
} from '../types';
import { CATEGORIES, SCENARIO } from '../data/scenario';

// ── 常量与查表 ─────────────────────────────────────────────────────────────
const ORDER: Proposal[] = [...SCENARIO].sort(
  (a, b) => a.tick - b.tick || a.id.localeCompare(b.id),
);
const CAT: Record<string, Category> = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c]),
);
const ELIGIBLE_TOTAL = SCENARIO.filter((p) => CAT[p.categoryId].autoEligible).length;
const MINUTES_PER_REVIEW = 1.5; // 每条人工审阅的模拟耗时
const REVERSAL_DELAY = 2; // 自动放行的坏动作在被消费 N 条后暴露并触发反转

export const MAX_RUNG = 5;

export function categoryOf(p: Proposal): Category {
  return CAT[p.categoryId];
}

// ── 会话状态（审阅台 / 信任阶梯共用同一台状态机）─────────────────────────────
export interface SessionState {
  cursor: number;
  rungs: Record<string, number>;
  evidence: Record<string, number>;
  autoOn: Record<string, boolean>;
  audit: AuditEntry[];
  pendingReversal: { catId: string; proposalId: string; stepsLeft: number } | null;
  reversalBanner: { catId: string; proposalId: string; summary: string } | null;
  done: boolean;
  stats: {
    humanReviews: number;
    autoHandled: number;
    escalated: number;
    rejected: number;
    reversed: number;
  };
}

function blankState(): SessionState {
  const rungs: Record<string, number> = {};
  const evidence: Record<string, number> = {};
  const autoOn: Record<string, boolean> = {};
  for (const c of CATEGORIES) {
    rungs[c.id] = 0;
    evidence[c.id] = 0;
    autoOn[c.id] = false;
  }
  return {
    cursor: 0,
    rungs,
    evidence,
    autoOn,
    audit: [],
    pendingReversal: null,
    reversalBanner: null,
    done: false,
    stats: { humanReviews: 0, autoHandled: 0, escalated: 0, rejected: 0, reversed: 0 },
  };
}

function clone(s: SessionState): SessionState {
  return {
    cursor: s.cursor,
    rungs: { ...s.rungs },
    evidence: { ...s.evidence },
    autoOn: { ...s.autoOn },
    audit: [...s.audit],
    pendingReversal: s.pendingReversal ? { ...s.pendingReversal } : null,
    reversalBanner: s.reversalBanner ? { ...s.reversalBanner } : null,
    done: s.done,
    stats: { ...s.stats },
  };
}

function pushAudit(s: SessionState, p: Proposal, outcome: Outcome, note: string) {
  s.audit.push({
    proposalId: p.id,
    tick: p.tick,
    agent: p.agent,
    categoryId: p.categoryId,
    summary: p.summary,
    outcome,
    note,
    rungAfter: s.rungs[p.categoryId],
  });
}

function fireReversalIfDue(s: SessionState) {
  const pr = s.pendingReversal;
  if (!pr || pr.stepsLeft > 0) return;
  const cat = CAT[pr.catId];
  s.rungs[pr.catId] = Math.max(0, s.rungs[pr.catId] - 1);
  s.autoOn[pr.catId] = false;
  s.evidence[pr.catId] = 0;
  s.stats.reversed += 1;
  const src = ORDER.find((p) => p.id === pr.proposalId)!;
  s.audit.push({
    proposalId: pr.proposalId,
    tick: src.tick,
    agent: src.agent,
    categoryId: pr.catId,
    summary: src.summary,
    outcome: 'reversed',
    note: `被反转：${cat.label} 的自动放行动作事后出问题，信任降 1 阶并暂停自动放行`,
    rungAfter: s.rungs[pr.catId],
  });
  s.reversalBanner = { catId: pr.catId, proposalId: pr.proposalId, summary: src.summary };
  s.pendingReversal = null;
}

function tickReversal(s: SessionState) {
  if (s.pendingReversal) s.pendingReversal.stepsLeft -= 1;
}

// 从 cursor 起，自动放行所有 autoOn 类目的动作，直到遇到需人工的动作或结束。
function autoConsume(s: SessionState) {
  // eslint-disable-next-line no-constant-condition
  while (true) {
    fireReversalIfDue(s);
    if (s.cursor >= ORDER.length) {
      s.done = true;
      // 收尾：若仍有未触发的反转，强制结算。
      if (s.pendingReversal) {
        s.pendingReversal.stepsLeft = 0;
        fireReversalIfDue(s);
      }
      return;
    }
    const p = ORDER[s.cursor];
    const c = CAT[p.categoryId];
    if (c.autoEligible && s.autoOn[p.categoryId]) {
      s.stats.autoHandled += 1;
      pushAudit(s, p, 'auto-approved', '按已提升的自动放行策略执行（未经人工）');
      if (p.groundTruthBad) {
        s.pendingReversal = { catId: p.categoryId, proposalId: p.id, stepsLeft: REVERSAL_DELAY };
      }
      s.cursor += 1;
      tickReversal(s);
      continue;
    }
    return; // 需人工，停下。
  }
}

export function initSession(): SessionState {
  const s = blankState();
  autoConsume(s);
  return s;
}

export function currentProposal(s: SessionState): Proposal | null {
  if (s.done || s.cursor >= ORDER.length) return null;
  return ORDER[s.cursor];
}

export function canPromote(s: SessionState, catId: string): boolean {
  const c = CAT[catId];
  return c.autoEligible && !s.autoOn[catId] && s.rungs[catId] >= c.promoteThreshold;
}

export function suggestions(s: SessionState): string[] {
  return CATEGORIES.filter((c) => canPromote(s, c.id)).map((c) => c.id);
}

export type HumanDecision = 'approve' | 'edit-approve' | 'reject' | 'escalate';

export function decide(prev: SessionState, decision: HumanDecision): SessionState {
  const s = clone(prev);
  const p = currentProposal(s);
  if (!p) return s;
  const c = CAT[p.categoryId];

  s.stats.humanReviews += 1;
  if (decision === 'approve' || decision === 'edit-approve') {
    if (c.autoEligible) {
      s.rungs[p.categoryId] = Math.min(MAX_RUNG, s.rungs[p.categoryId] + 1);
      s.evidence[p.categoryId] += 1;
    }
    pushAudit(
      s,
      p,
      decision === 'edit-approve' ? 'edited-approved' : 'approved-manual',
      decision === 'edit-approve' ? '人工修改后批准' : '人工批准',
    );
  } else if (decision === 'reject') {
    if (c.autoEligible) {
      s.rungs[p.categoryId] = Math.max(0, s.rungs[p.categoryId] - 1);
      s.evidence[p.categoryId] = 0;
    }
    pushAudit(s, p, 'rejected', '人工拒绝，该类目信任回落');
  } else {
    s.stats.escalated += 1;
    pushAudit(s, p, 'escalated', '升级：交由人工/专业判断，不建立自动化证据');
  }

  s.cursor += 1;
  tickReversal(s);
  autoConsume(s);
  return s;
}

export function promote(prev: SessionState, catId: string): SessionState {
  const s = clone(prev);
  if (!canPromote(s, catId)) return s;
  s.autoOn[catId] = true;
  autoConsume(s);
  return s;
}

export function recallAuto(prev: SessionState, catId: string): SessionState {
  const s = clone(prev);
  if (!s.autoOn[catId]) return s;
  s.autoOn[catId] = false;
  s.evidence[catId] = 0;
  return s;
}

export function clearReversalBanner(prev: SessionState): SessionState {
  const s = clone(prev);
  s.reversalBanner = null;
  return s;
}

// ── 确定性两策略回放（价值对比页用）───────────────────────────────────────
function operatorDecision(p: Proposal): HumanDecision {
  const c = CAT[p.categoryId];
  if (p.redFlag) return 'escalate'; // 尽责的人能从红旗看出端倪
  if (!c.autoEligible) return 'escalate';
  return 'approve';
}

// 给审阅台「推荐下一步」用的建议决策。
export function recommend(p: Proposal): HumanDecision {
  return operatorDecision(p);
}

function toMetrics(strategy: Strategy, s: SessionState): Metrics {
  const highStakesAutoApproved = s.audit.filter(
    (a) => a.outcome === 'auto-approved' && !CAT[a.categoryId].autoEligible,
  ).length;
  const reversibleSlipped = s.audit.filter((a) => {
    if (a.outcome !== 'auto-approved') return false;
    const src = ORDER.find((p) => p.id === a.proposalId);
    return !!src?.groundTruthBad;
  }).length;
  return {
    strategy,
    total: ORDER.length,
    humanReviews: s.stats.humanReviews,
    autoHandled: s.stats.autoHandled,
    escalated: s.stats.escalated,
    reversed: s.stats.reversed,
    highStakesAutoApproved,
    reversibleSlipped,
    autoCoveragePct: Math.round((s.stats.autoHandled / ELIGIBLE_TOTAL) * 100),
    humanMinutes: Math.round(s.stats.humanReviews * MINUTES_PER_REVIEW * 10) / 10,
  };
}

export function simulate(strategy: Strategy): Metrics {
  let s = initSession();
  let guard = 0;
  while (!s.done && guard < 1000) {
    guard += 1;
    if (strategy === 'trustladder') {
      for (const catId of suggestions(s)) s = promote(s, catId);
    }
    const p = currentProposal(s);
    if (!p) break;
    s = decide(s, operatorDecision(p));
  }
  return toMetrics(strategy, s);
}

export function runFullSession(): SessionState {
  // 供审计流「全脚本」展示（信任阶梯页用 trustladder 回放的审计历史）。
  let s = initSession();
  let guard = 0;
  while (!s.done && guard < 1000) {
    guard += 1;
    for (const catId of suggestions(s)) s = promote(s, catId);
    const p = currentProposal(s);
    if (!p) break;
    s = decide(s, operatorDecision(p));
  }
  return s;
}

export { CATEGORIES, SCENARIO, ELIGIBLE_TOTAL };
