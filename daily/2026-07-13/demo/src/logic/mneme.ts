// Mneme (记衡) — 调阅治理核心逻辑
// 纯函数：输入 recall 命中的候选记忆 + 接入工具 + 用户裁决 -> 输出逐条裁决与摘要。
// 不接任何真实存储/检索，全部在前端对 mock 数据推理，用于价值可视化。

import type {
  ConnectingTool,
  GovernedItem,
  MemoryItem,
  RecallSummary,
  Scenario,
  Scope,
  Verdict,
} from '../types';

export type Decision = 'confirmed' | 'retired' | 'kept';
export type DecisionMap = Record<string, Decision>;

export const SCOPE_LABEL: Record<Scope, string> = {
  travel: '出行',
  personal: '个人',
  work: '工作',
  health: '健康',
  finance: '财务',
  secret: '密钥',
};

export function originLabel(m: MemoryItem): string {
  return m.origin === 'user-stated' ? '用户陈述' : 'agent 推断';
}

// 单条记忆的"基础裁决"（未考虑用户交互决定）：
// 作用域是硬防火墙 -> 越界即拦截；其次投毒 > 过期 > 矛盾 > 放行。
export function classifyBase(
  m: MemoryItem,
  tool: ConnectingTool,
): { verdict: Verdict; reason: string } {
  if (!tool.allowedScopes.includes(m.scope)) {
    return {
      verdict: 'blocked-scope',
      reason: `越界：${SCOPE_LABEL[m.scope]}类记忆不在「${tool.name}」的授权作用域内，裸调阅会把它泄漏进该工具`,
    };
  }
  if (m.status === 'unconfirmed') {
    return {
      verdict: 'held-poison',
      reason: `疑似投毒：由 ${m.source.agent ?? m.source.tool} 自动写入的推断，未经你确认，一旦注入会扩散到所有工具`,
    };
  }
  if (m.status === 'stale') {
    return {
      verdict: 'held-stale',
      reason: `过期：${m.note ?? '该事实可能已失效'}`,
    };
  }
  if (m.contradictsId) {
    return {
      verdict: 'held-conflict',
      reason: '矛盾：与另一条同主题记忆相互冲突，需你裁决保留哪条',
    };
  }
  return {
    verdict: 'inject',
    reason: `${originLabel(m)}·新鲜·在授权作用域内`,
  };
}

// 治理模式：对每条记忆施加用户裁决，得到最终裁决。
export function governRecall(scenario: Scenario, decisions: DecisionMap): GovernedItem[] {
  return scenario.recalled.map((m) => {
    const base = classifyBase(m, scenario.tool);

    // 越界是硬防火墙，用户不可在 Demo 中一键放行（least-privilege）
    if (base.verdict === 'blocked-scope') {
      return { memory: m, verdict: 'blocked-scope', reason: base.reason, resolved: false };
    }

    // 无问题：直接放行
    if (base.verdict === 'inject') {
      return { memory: m, verdict: 'inject', reason: base.reason, resolved: true };
    }

    // held-*：根据用户裁决决定
    const d = decisions[m.id];
    if (d === 'retired') {
      return { memory: m, verdict: base.verdict, reason: '已退休：本次不注入', resolved: true };
    }
    if (d === 'confirmed' || d === 'kept') {
      return {
        memory: m,
        verdict: 'inject',
        reason: d === 'confirmed' ? '你已确认为可信事实 -> 放行注入' : '你已裁决保留此条 -> 放行注入',
        resolved: true,
      };
    }
    // 未裁决：扣留
    return { memory: m, verdict: base.verdict, reason: base.reason, resolved: false };
  });
}

export interface RiskCounts {
  leak: number;
  stale: number;
  conflict: number;
  poison: number;
}

// 裸调阅：不做任何过滤/治理，全部注入；仅统计"暴露的风险"用于对比。
export function nakedRisks(scenario: Scenario): RiskCounts {
  const r: RiskCounts = { leak: 0, stale: 0, conflict: 0, poison: 0 };
  for (const m of scenario.recalled) {
    const base = classifyBase(m, scenario.tool);
    if (base.verdict === 'blocked-scope') r.leak++;
    else if (base.verdict === 'held-poison') r.poison++;
    else if (base.verdict === 'held-stale') r.stale++;
    else if (base.verdict === 'held-conflict') r.conflict++;
  }
  return r;
}

export function nakedSummary(scenario: Scenario): RecallSummary {
  const total = scenario.recalled.length;
  const r = nakedRisks(scenario);
  const totalRisk = r.leak + r.stale + r.conflict + r.poison;
  if (totalRisk === 0) {
    return {
      injected: total,
      blocked: 0,
      held: 0,
      total,
      leakPrevented: 0,
      bannerTone: 'safe',
      bannerText: `裸调阅：${total} 条全部注入，本次恰好无风险项（治理层与否结果相同）`,
    };
  }
  return {
    injected: total,
    blocked: 0,
    held: 0,
    total,
    leakPrevented: 0,
    bannerTone: 'risk',
    bannerText: `裸调阅：${total} 条被照单注入 —— 其中越界泄漏 ${r.leak}·投毒 ${r.poison}·过期 ${r.stale}·矛盾 ${r.conflict}，无一经过治理`,
  };
}

export function governedSummary(items: GovernedItem[], scenario: Scenario): RecallSummary {
  const total = items.length;
  const injected = items.filter((i) => i.verdict === 'inject').length;
  const blocked = items.filter((i) => i.verdict === 'blocked-scope').length;
  const outstanding = items.filter((i) => i.verdict.startsWith('held') && !i.resolved).length;
  const leakPrevented = blocked;

  let bannerTone: RecallSummary['bannerTone'];
  let bannerText: string;

  if (scenario.tool.isControl && blocked === 0 && outstanding === 0) {
    bannerTone = 'safe';
    bannerText = `全部放行 · 无需干预 ✓ —— ${injected} 条均在作用域内、新鲜、无矛盾，记衡不逢事就拦`;
  } else if (outstanding > 0) {
    bannerTone = 'review';
    bannerText = `记衡已拦截 ${blocked} 项越界泄漏；另有 ${outstanding} 项（投毒/过期/矛盾）待你裁决后才会决定是否注入`;
  } else {
    bannerTone = 'safe';
    bannerText = `治理完成：放行注入 ${injected} 条 · 拦截 ${blocked} 项越界泄漏 · 其余已由你裁决处理`;
  }

  return { injected, blocked, held: outstanding, total, leakPrevented, bannerTone, bannerText };
}

export const VERDICT_LABEL: Record<Verdict, string> = {
  inject: '放行注入',
  'blocked-scope': '越界拦截',
  'held-poison': '扣留·疑似投毒',
  'held-stale': '扣留·过期',
  'held-conflict': '扣留·矛盾待裁决',
};
