import type { Fix, Intent, Tool, Verdict } from '../types';

export const TOPK = 4;
export const COMFORTABLE_GAP = 2; // 最优 - 次优 >= 2 视为「稳」

export interface Candidate {
  tool: Tool;
  score: number;
  rank: number; // 1-based，在所有 score>0 的候选里
}

export interface IntentResult {
  intent: Intent;
  candidates: Candidate[]; // score>0，按分降序、同分按 id 升序
  topK: Candidate[];
  picked: Tool | null;
  correct: Tool;
  correctRank: number | null; // 在全部候选里的名次；null 表示 0 分（完全召不回）
  correctInTopK: boolean;
  gap: number; // 榜首与次席的分差
  verdict: Verdict;
  reason: string;
}

export interface Summary {
  total: number;
  unique: number;
  ambiguous: number;
  dangerous: number;
  blindspot: number;
  matchRate: number; // 唯一正确率，0..1
}

function scoreTool(intent: Intent, tool: Tool): number {
  // 加了确认闸的工具：意图必须显式含其一关键词，否则不参与检索。
  if (tool.guard && !tool.guard.some((k) => intent.keywords.includes(k))) {
    return -1;
  }
  let s = 0;
  for (const kw of intent.keywords) {
    if (tool.tags.includes(kw)) s += 2;
  }
  return s;
}

/** 模拟 lazy-discovery 检索器：对全工具面打分、排序、取 TopK。 */
export function analyzeIntent(intent: Intent, tools: Tool[]): IntentResult {
  const scored = tools
    .map((tool) => ({ tool, score: scoreTool(intent, tool) }))
    .filter((c) => c.score > 0)
    .sort((a, b) => (b.score - a.score) || (a.tool.id < b.tool.id ? -1 : 1));

  const candidates: Candidate[] = scored.map((c, i) => ({ ...c, rank: i + 1 }));
  const topK = candidates.slice(0, TOPK);
  const correct = tools.find((t) => t.id === intent.correctToolId)!;
  const correctCand = candidates.find((c) => c.tool.id === intent.correctToolId) ?? null;
  const correctRank = correctCand ? correctCand.rank : null;
  const correctInTopK = topK.some((c) => c.tool.id === intent.correctToolId);

  const picked = topK.length > 0 ? topK[0].tool : null;
  const gap = topK.length >= 2 ? topK[0].score - topK[1].score : topK.length === 1 ? topK[0].score : 0;

  let verdict: Verdict;
  let reason: string;

  if (!picked) {
    // 完全没有工具匹配：Agent 无从下手。
    verdict = 'blindspot';
    reason = '没有任何工具匹配这条意图——Agent 只能放弃或胡乱变通。';
  } else if (picked.id === intent.correctToolId) {
    // 选对了：看它稳不稳。
    if (gap >= COMFORTABLE_GAP) {
      verdict = 'unique';
      reason = `意图稳落到 ${picked.name}，与次席分差 ${gap}，选择可靠。`;
    } else {
      const nearHarmful = topK.slice(1).find((c) => c.tool.harmful && topK[0].score - c.score < COMFORTABLE_GAP);
      verdict = 'ambiguous';
      reason = nearHarmful
        ? `虽然这次选对了 ${picked.name}，但危险工具 ${nearHarmful.tool.name} 仅差 ${topK[0].score - nearHarmful.score} 分——一次 embedding 抖动就可能翻车。`
        : `${picked.name} 险胜，次席仅差 ${gap} 分，选择靠运气、不稳定。`;
    }
  } else if (picked.harmful) {
    // 选到了会造成真实损害的错误工具：最高优先级——Agent 会「做坏事」。
    verdict = 'dangerous';
    reason = `Agent 会选中危险近邻 ${picked.name}（${picked.effect ?? '有真实副作用'}），而正确的是 ${correct.name}。`;
  } else if (!correctInTopK) {
    // 选到无害但不对的工具，且正确工具压根没被召回。
    verdict = 'blindspot';
    reason = correctRank
      ? `正确工具 ${correct.name} 只排到第 ${correctRank} 位，被挤出前 ${TOPK} 的检索窗口；Agent 只会将就地选中无关的 ${picked.name}。`
      : `正确工具 ${correct.name} 完全召不回（0 分）——Agent 看不到它，只能将就选 ${picked.name}。`;
  } else {
    // 选到无害但不对的工具，正确工具其实在候选里却被选偏。
    verdict = 'ambiguous';
    reason = `Agent 会选到 ${picked.name}（无害但不对），正确的是 ${correct.name}——语义重叠导致选偏。`;
  }

  return { intent, candidates, topK, picked, correct, correctRank, correctInTopK, gap, verdict, reason };
}

export function analyzeAll(intents: Intent[], tools: Tool[]): IntentResult[] {
  return intents.map((it) => analyzeIntent(it, tools));
}

export function summarize(results: IntentResult[]): Summary {
  const s: Summary = { total: results.length, unique: 0, ambiguous: 0, dangerous: 0, blindspot: 0, matchRate: 0 };
  for (const r of results) {
    if (r.verdict === 'unique') s.unique++;
    else if (r.verdict === 'ambiguous') s.ambiguous++;
    else if (r.verdict === 'dangerous') s.dangerous++;
    else s.blindspot++;
  }
  s.matchRate = s.total ? s.unique / s.total : 0;
  return s;
}

/** 应用「正名」提案：返回一份被修正过的工具面（不改原数组）。 */
export function applyFixes(tools: Tool[], fixes: Fix[]): Tool[] {
  const byId = new Map(tools.map((t) => [t.id, { ...t, tags: [...t.tags] } as Tool]));
  for (const fix of fixes) {
    for (const op of fix.ops) {
      const t = byId.get(op.toolId);
      if (!t) continue;
      if (op.removeTags) t.tags = t.tags.filter((tag) => !op.removeTags!.includes(tag));
      if (op.addTags) for (const tag of op.addTags) if (!t.tags.includes(tag)) t.tags.push(tag);
      if (op.rename) t.name = op.rename;
      if (op.guard) t.guard = op.guard;
    }
  }
  return tools.map((t) => byId.get(t.id)!);
}

// ── 影子雷达：工具面的结构性诊断 ───────────────────────────

export interface NameCollision {
  name: string;
  tools: Tool[];
}

/** 同一个 name 出现在 >1 个 server 上 = 命名冲突。 */
export function nameCollisions(tools: Tool[]): NameCollision[] {
  const byName = new Map<string, Tool[]>();
  for (const t of tools) {
    const arr = byName.get(t.name) ?? [];
    arr.push(t);
    byName.set(t.name, arr);
  }
  const out: NameCollision[] = [];
  for (const [name, arr] of byName) {
    const servers = new Set(arr.map((t) => t.server));
    if (servers.size > 1) out.push({ name, tools: arr });
  }
  return out.sort((a, b) => b.tools.length - a.tools.length || (a.name < b.name ? -1 : 1));
}

export interface Cluster {
  capability: string;
  tools: Tool[];
}

/** 同一能力域下 >=2 个工具 = 语义重叠簇。 */
export function overlapClusters(tools: Tool[]): Cluster[] {
  const byCap = new Map<string, Tool[]>();
  for (const t of tools) {
    const arr = byCap.get(t.capability) ?? [];
    arr.push(t);
    byCap.set(t.capability, arr);
  }
  const out: Cluster[] = [];
  for (const [capability, arr] of byCap) {
    if (arr.length >= 2) out.push({ capability, tools: arr });
  }
  return out.sort((a, b) => b.tools.length - a.tools.length || (a.capability < b.capability ? -1 : 1));
}

export const CAPABILITY_LABELS: Record<string, string> = {
  search: '检索', 'create-item': '建条目', vcs: '代码/分支', access: '权限',
  notify: '通知', file: '文件', 'db-write': '写库', 'db-read': '读库',
  email: '邮件', calendar: '日程', payment: '支付/财务', incident: '事故', workflow: '流转',
};
