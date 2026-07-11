import type { AgentNode, Claim, Scenario, Survival } from '../types';

/** 存续判定的展示元信息（颜色/中文标签/短描述） */
export const SURVIVAL_META: Record<
  Survival,
  { label: string; tone: string; short: string }
> = {
  intact: { label: '存续', tone: 'ok', short: '支撑事实穿过压缩层保持完整' },
  degraded: {
    label: '失真',
    tone: 'warn',
    short: '承重细节在压缩中被丢弃/弱化，结论具误导性',
  },
  broken: {
    label: '断链',
    tone: 'bad',
    short: '结论为根代理综合产物，支撑证据未在压缩链中存续',
  },
};

/** 以 id 建索引，便于查节点 */
export function indexNodes(nodes: AgentNode[]): Record<string, AgentNode> {
  return nodes.reduce<Record<string, AgentNode>>((acc, n) => {
    acc[n.id] = n;
    return acc;
  }, {});
}

/** 取某节点的直接子节点 */
export function childrenOf(nodes: AgentNode[], parentId: string | null): AgentNode[] {
  return nodes.filter((n) => n.parentId === parentId);
}

/**
 * 计算一条「根脉」：从源头节点一路向上到根代理的路径（含源头与根）。
 * 返回自底向上的节点数组（[源头, ..., 根]）。
 */
export function rootPath(nodes: AgentNode[], sourceNodeId: string): AgentNode[] {
  const byId = indexNodes(nodes);
  const path: AgentNode[] = [];
  let cur: AgentNode | undefined = byId[sourceNodeId];
  const guard = new Set<string>();
  while (cur && !guard.has(cur.id)) {
    guard.add(cur.id);
    path.push(cur);
    cur = cur.parentId ? byId[cur.parentId] : undefined;
  }
  return path;
}

/** 判断某节点是否在选中结论的根脉路径上 */
export function isOnPath(
  nodes: AgentNode[],
  sourceNodeId: string,
  nodeId: string,
): boolean {
  return rootPath(nodes, sourceNodeId).some((n) => n.id === nodeId);
}

/** 一条根脉上，每一跳的压缩损失（用于逐跳 diff 展示） */
export interface HopLoss {
  node: AgentNode;
  droppedFacts: string[];
}

/** 沿根脉收集每一跳被压缩丢弃的承重事实（自底向上） */
export function pathLosses(nodes: AgentNode[], sourceNodeId: string): HopLoss[] {
  return rootPath(nodes, sourceNodeId).map((node) => ({
    node,
    droppedFacts: node.droppedFacts,
  }));
}

export interface ScenarioSummary {
  total: number;
  intact: number;
  degraded: number;
  broken: number;
  /** 受压缩影响（失真+断链）的承重结论数 */
  affected: number;
  /** 其中直接影响可执行决策的数量 */
  actionRisk: number;
  /** compaction 丢弃的承重事实总条数 */
  droppedFactCount: number;
  /** 整体是否可照答案直接执行 */
  safeToAct: boolean;
  /** 一句话结论 */
  verdict: string;
}

/** 汇总一个场景的根脉审计结果（供真相计使用） */
export function summarize(scenario: Scenario): ScenarioSummary {
  const { claims, nodes } = scenario;
  const total = claims.length;
  const intact = claims.filter((c) => c.survival === 'intact').length;
  const degraded = claims.filter((c) => c.survival === 'degraded').length;
  const broken = claims.filter((c) => c.survival === 'broken').length;
  const affected = degraded + broken;
  const actionRisk = claims.filter(
    (c) => c.survival !== 'intact' && c.affectsAction,
  ).length;
  const droppedFactCount = nodes.reduce(
    (sum, n) => sum + n.droppedFacts.length,
    0,
  );
  const safeToAct = affected === 0;

  let verdict: string;
  if (safeToAct) {
    verdict = `全部 ${total} 条承重结论存续，压缩链中无承重事实丢失——根脉背书该答案，可放心采用。`;
  } else if (actionRisk > 0) {
    verdict = `${total} 条承重结论中 ${affected} 条被压缩降级（失真 ${degraded} / 断链 ${broken}），其中 ${actionRisk} 条直接影响可执行决策——不可照此答案直接执行。`;
  } else {
    verdict = `${total} 条承重结论中 ${affected} 条被压缩降级（失真 ${degraded} / 断链 ${broken}），暂不影响可执行动作，但引用前需复核。`;
  }

  return {
    total,
    intact,
    degraded,
    broken,
    affected,
    actionRisk,
    droppedFactCount,
    safeToAct,
    verdict,
  };
}

/** 便捷：按 id 取结论 */
export function findClaim(scenario: Scenario, claimId: string | null): Claim | undefined {
  if (!claimId) return undefined;
  return scenario.claims.find((c) => c.id === claimId);
}
