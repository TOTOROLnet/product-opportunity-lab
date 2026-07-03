import type {
  CandidatePath,
  GraphNode,
  Policy,
  Reversibility,
  RiskCategory,
  RiskResult,
  Scenario,
  ScoredPath,
  Sensitivity,
  Severity,
} from '../types';

// —— 显式、可解释的评分规则（刻意不做黑箱，用户能在 UI 里看到构成）——

const CATEGORY_BASE: Record<RiskCategory, number> = {
  destructive: 46,
  exfiltration: 42,
  financial: 40,
  'internal-spread': 24,
};

const CATEGORY_LABEL: Record<RiskCategory, string> = {
  destructive: '破坏性写入',
  exfiltration: '数据外泄',
  financial: '财务风险',
  'internal-spread': '内部越界扩散',
};

const SENSITIVITY_WEIGHT: Record<Sensitivity, number> = {
  pii: 1.0,
  financial: 0.95,
  internal: 0.55,
  public: 0.2,
};

const REVERSIBILITY_FACTOR: Record<Reversibility, number> = {
  no: 1.0,
  partial: 0.6,
  yes: 0.3,
};

const REVERSIBILITY_LABEL: Record<Reversibility, string> = {
  no: '不可逆',
  partial: '部分可逆',
  yes: '可逆',
};

// 有人类审批在环时，残余风险显著下降（但不归零：审批疲劳/橡皮图章依然存在）。
const GATED_FACTOR = 0.45;
// 存在缺失护栏时的额外放大。
const GUARD_MULTIPLIER = 1.18;

const REVERSIBILITY_RANK: Record<Reversibility, number> = { yes: 0, partial: 1, no: 2 };

function severityOf(score: number): Severity {
  if (score >= 28) return 'high';
  if (score >= 14) return 'medium';
  return 'low';
}

function worstReversibility(tools: GraphNode[]): Reversibility {
  let worst: Reversibility = 'yes';
  for (const t of tools) {
    const r = t.reversibility ?? 'yes';
    if (REVERSIBILITY_RANK[r] > REVERSIBILITY_RANK[worst]) worst = r;
  }
  return worst;
}

function pathLabel(nodes: GraphNode[]): string {
  return nodes.map((n) => n.label).join(' → ');
}

interface Ctx {
  policies: Record<string, Policy>;
  firewalls: Record<string, boolean>;
  nodeById: Map<string, GraphNode>;
}

function scorePath(path: CandidatePath, ctx: Ctx): ScoredPath {
  const nodes = path.nodeIds.map((id) => ctx.nodeById.get(id)!);
  const tools = nodes.filter((n) => n.kind === 'tool');
  const source = nodes.find((n) => n.kind === 'source')!;
  const sink = nodes.find((n) => n.kind === 'sink')!;
  const label = pathLabel(nodes);
  const sourceSensitivity = source.sensitivity ?? 'public';
  const worstRev = worstReversibility(tools);

  // 1) 是否被某个工具的 Blocked 策略切断
  const blockedTool = tools.find((t) => ctx.policies[t.id] === 'blocked');
  // 2) 是否被防火墙规则切断
  let firewallCut: string | undefined;
  if (
    ctx.firewalls['fw_pii_egress'] &&
    source.sensitivity === 'pii' &&
    sink.external === true
  ) {
    firewallCut = '数据防火墙「PII → 外部」已阻断此链路';
  }
  const guardTool = tools.find((t) => t.guardMissing && t.capability === 'write');
  if (ctx.firewalls['fw_write_guard'] && guardTool) {
    firewallCut = firewallCut ?? `写护栏已把「${guardTool.label}」视为 Blocked，链路消除`;
  }

  if (blockedTool || firewallCut) {
    return {
      id: path.id,
      category: path.category,
      nodeIds: path.nodeIds,
      label,
      active: false,
      inactiveReason:
        firewallCut ?? `「${blockedTool!.label}」已被设为 Blocked，链路无法执行`,
      score: 0,
      severity: 'low',
      sourceSensitivity,
      worstReversibility: worstRev,
      gated: false,
      reasons: [],
      fix: '已被当前策略消除。',
    };
  }

  // 3) 计算残余风险
  const gated = tools.some((t) => ctx.policies[t.id] === 'approval');
  const sensW = SENSITIVITY_WEIGHT[sourceSensitivity];
  const revF = REVERSIBILITY_FACTOR[worstRev];
  const guardMissingTool = tools.find((t) => t.guardMissing);
  const guardF = guardMissingTool ? GUARD_MULTIPLIER : 1.0;
  const autonomyF = gated ? GATED_FACTOR : 1.0;

  const raw = CATEGORY_BASE[path.category] * sensW * revF * guardF * autonomyF;
  const score = Math.min(50, Math.round(raw));

  const reasons: string[] = [
    `类别「${CATEGORY_LABEL[path.category]}」基础分 ${CATEGORY_BASE[path.category]}`,
    `数据敏感度：${sourceSensitivity.toUpperCase()} ×${sensW}`,
    `可逆性：${REVERSIBILITY_LABEL[worstRev]} ×${revF}`,
  ];
  if (guardMissingTool) {
    reasons.push(`缺失护栏（${guardMissingTool.guardMissing}）×${GUARD_MULTIPLIER}`);
  }
  reasons.push(
    gated
      ? `链路含 Needs approval（人类在环）×${GATED_FACTOR} → 残余风险下降`
      : '链路全程 Always allow（全自动）×1.0 → 无人类兜底',
  );

  const fix = buildFix(path.category, gated, guardMissingTool?.label, sink.external);

  return {
    id: path.id,
    category: path.category,
    nodeIds: path.nodeIds,
    label,
    active: true,
    score,
    severity: severityOf(score),
    sourceSensitivity,
    worstReversibility: worstRev,
    gated,
    reasons,
    fix,
  };
}

function buildFix(
  category: RiskCategory,
  gated: boolean,
  guardTool: string | undefined,
  external: boolean | undefined,
): string {
  const tips: string[] = [];
  if (category === 'exfiltration' && external) {
    tips.push('开启「数据防火墙：PII → 外部」从源头切断，或把出口工具改为 Needs approval');
  }
  if (category === 'destructive' && guardTool) {
    tips.push(`给「${guardTool}」加 WHERE/影响行数护栏，或开启「写护栏」规则`);
  }
  if (category === 'financial') {
    tips.push('给退款工具设单笔金额上限，超限自动升级审批');
  }
  if (category === 'internal-spread') {
    tips.push('对含 PII 的 Slack 推送做脱敏，或限定 need-to-know 频道');
  }
  if (!gated) tips.push('把链路上的高危工具从 Always allow 降级为 Needs approval');
  return tips.join('；') || '维持当前策略。';
}

export function computeRisk(
  scenario: Scenario,
  policies: Record<string, Policy>,
  firewalls: Record<string, boolean>,
): RiskResult {
  const nodeById = new Map(scenario.nodes.map((n) => [n.id, n]));
  const ctx: Ctx = { policies, firewalls, nodeById };

  const paths = scenario.candidatePaths
    .map((p) => scorePath(p, ctx))
    .sort((a, b) => b.score - a.score);

  const activePaths = paths.filter((p) => p.active);
  const sum = activePaths.reduce((acc, p) => acc + p.score, 0);
  // 归一化到 0–100：单条最高 50，多条叠加后按 0.72 收敛并封顶，避免线性爆表。
  const totalRisk = Math.min(100, Math.round(sum * 0.72));
  const highCount = activePaths.filter((p) => p.severity === 'high').length;
  const mediumCount = activePaths.filter((p) => p.severity === 'medium').length;

  return { paths, activePaths, totalRisk, highCount, mediumCount };
}

export { CATEGORY_LABEL, REVERSIBILITY_LABEL };
