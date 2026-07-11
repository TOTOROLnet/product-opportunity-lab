// Rootline (根脉) — 类型定义
// 全部为带标注的 mock 数据结构，用于演示「模型原生多智能体调用」的结论溯源与压缩失真审计。
// 不接任何真实模型 / 后端 / 外部 API。

/** 一条承重结论在压缩 + 聚合树中的存续判定 */
export type Survival =
  | 'intact' // 存续：支撑事实穿过压缩层保持完整
  | 'degraded' // 失真：承重细节在压缩中被丢弃/弱化，结论因此具误导性
  | 'broken'; // 断链：结论为根代理综合产物，其支撑证据未在压缩链中存续

/** 子代理树上的一个节点（根 / 子代理 / 叶子代理） */
export interface AgentNode {
  id: string;
  role: string;
  kind: 'root' | 'sub' | 'leaf';
  parentId: string | null;
  /** 该代理消耗的上下文 token（进） */
  tokensIn: number;
  /** 该代理向上汇报的 token（出） */
  tokensOut: number;
  /** 该代理的上下文是否被服务端自动压缩（compaction） */
  compacted: boolean;
  /** 叶子/子代理拿到的原始发现（压缩前） */
  rawFindings: string[];
  /** 压缩后真正向父代理汇报的摘要 */
  reportedUp: string;
  /** 压缩中被丢弃 / 弱化、却可能承重的事实 */
  droppedFacts: string[];
}

/** 最终答案里的一条承重结论 */
export interface Claim {
  id: string;
  /** 结论文本（会在答案下方作为可点击的结论条呈现） */
  text: string;
  /** 最相关的源头叶子/子代理节点 id（用于高亮根脉路径） */
  sourceNodeId: string;
  survival: Survival;
  /** 该结论是否直接影响可执行决策（下单/部署/赔付/发布） */
  affectsAction: boolean;
  /** 根脉审计说明：支撑事实在压缩链中发生了什么 */
  explanation: string;
}

/** 一个完整的多智能体调用场景 */
export interface Scenario {
  id: string;
  title: string;
  /** 触发这次多智能体调用的任务 prompt */
  prompt: string;
  /** 模型返回的最终答案（裸答案态直接呈现，看起来自信可执行） */
  finalAnswer: string;
  /** 子代理树节点 */
  nodes: AgentNode[];
  /** 最终答案里的承重结论 */
  claims: Claim[];
}
