import type {
  Assumption,
  GatedItem,
  Incident,
  Reconciled,
  ReconcileResult,
  Scenario,
  StepPlan,
  Verdict,
} from '../types';

// 裁决排序，用于取步骤的「最坏」裁决。
const VERDICT_RANK: Record<Verdict, number> = {
  'auto-continue': 0,
  skip: 1,
  confirm: 2,
  replan: 3,
  abort: 4,
};

// 单条假设复核：比较 T0 记得值 与（可能被反事实覆盖的）T1 生效值。
// 这是引擎的第一性逻辑——不是写死结论，而是「值相等→一致，否则按该假设的漂移影响判级」。
function classify(a: Assumption, overriddenAligned: boolean): Reconciled {
  const effectiveValue = overriddenAligned ? a.remembered.value : a.current.value;
  const effectiveLabel = overriddenAligned ? a.remembered.label : a.current.label;
  const aligned = effectiveValue === a.remembered.value;

  if (aligned) {
    return {
      assumption: a,
      overriddenAligned,
      status: 'aligned',
      severity: 'none',
      verdict: 'auto-continue',
      effectiveLabel,
    };
  }
  return {
    assumption: a,
    overriddenAligned,
    status: a.changedStatus,
    severity: a.changedSeverity,
    verdict: a.changedVerdict,
    effectiveLabel,
  };
}

function worst<T extends string>(items: T[], rank: Record<T, number>, fallback: T): T {
  return items.reduce((acc, cur) => (rank[cur] > rank[acc] ? cur : acc), fallback);
}

const VERDICT_TEXT: Record<Verdict, string> = {
  'auto-continue': '自动续',
  skip: '跳过',
  confirm: '人工确认',
  replan: '重规划',
  abort: '中止',
};

export function verdictText(v: Verdict): string {
  return VERDICT_TEXT[v];
}

// 主引擎：给定场景 + 用户的「反事实开关」集合，产出完整复核结果。
// overrides: 被用户强制当作「世界其实没变」的假设 id 集合。
export function reconcile(scenario: Scenario, overrides: Set<string>): ReconcileResult {
  const items = scenario.assumptions.map((a) => classify(a, overrides.has(a.id)));

  const counts = { aligned: 0, drifted: 0, invalidated: 0 };
  const incidents: Incident[] = [];
  const gated: GatedItem[] = [];

  for (const r of items) {
    counts[r.status] += 1;
    if (r.status !== 'aligned') {
      incidents.push({
        assumptionId: r.assumption.id,
        title: r.assumption.title,
        consequence: r.assumption.blindConsequence,
        severity: r.severity,
      });
    }
    gated.push({
      assumptionId: r.assumption.id,
      title: r.assumption.title,
      action: r.assumption.gatedAction,
      verdict: r.verdict,
    });
  }

  // 后续每一步的裁决：汇总所有依赖它的假设，取最坏裁决。
  const firstStep = scenario.pausedAtStep + 1;
  const stepPlans: StepPlan[] = [];
  for (let step = firstStep; step <= scenario.runbookTotal; step += 1) {
    const related = items.filter((r) => r.assumption.dependentSteps.includes(step));
    if (related.length === 0) {
      stepPlans.push({ step, worstVerdict: 'auto-continue', reasons: ['无相关世界假设'] });
      continue;
    }
    const worstVerdict = worst(
      related.map((r) => r.verdict),
      VERDICT_RANK,
      'auto-continue',
    );
    const reasons = related
      .filter((r) => r.verdict !== 'auto-continue')
      .map((r) => r.assumption.title);
    stepPlans.push({
      step,
      worstVerdict,
      reasons: reasons.length ? reasons : ['依赖的世界假设均一致'],
    });
  }

  const attentionSteps = stepPlans.filter((s) => s.worstVerdict !== 'auto-continue').length;
  const autoSteps = stepPlans.length - attentionSteps;

  const nonAligned = items.filter((r) => r.status !== 'aligned');
  const metrics = {
    avoidedHighRisk: nonAligned.filter((r) => r.severity === 'high').length,
    needHuman: nonAligned.filter(
      (r) => r.verdict === 'replan' || r.verdict === 'confirm' || r.verdict === 'abort',
    ).length,
    skipCount: nonAligned.filter((r) => r.verdict === 'skip').length,
    autoContinue: counts.aligned,
    attentionSteps,
    autoSteps,
  };

  const recommendResume = nonAligned.length === 0;
  const verdictHeadline = recommendResume
    ? `归位裁决：世界假设全部一致，${autoSteps} 个后续步骤可安全自动续跑。`
    : `归位裁决：不建议朴素续跑。${scenario.assumptions.length} 条世界假设中 ${nonAligned.length} 条已漂移/失效` +
      `（${metrics.avoidedHighRisk} 条高危）。复跑计划改写为：${autoSteps} 步自动续 · ` +
      `${metrics.needHuman} 项需人工介入 · ${metrics.skipCount} 项跳过。`;

  return {
    items,
    counts,
    metrics,
    incidents,
    gated,
    stepPlans,
    verdictHeadline,
    recommendResume,
  };
}
