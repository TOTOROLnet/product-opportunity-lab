import type { GraphEdge, GraphNode, ScoredPath, Severity } from '../types';

const NODE_W = 152;
const NODE_H = 46;

interface Props {
  nodes: GraphNode[];
  edges: GraphEdge[];
  activePaths: ScoredPath[];
  focusPathId: string | null;
  selectedNode: string | null;
  onSelectNode: (id: string | null) => void;
}

const SEV_RANK: Record<Severity, number> = { low: 0, medium: 1, high: 2 };

function edgeKey(a: string, b: string): string {
  return `${a}__${b}`;
}

export default function CapabilityGraph({
  nodes,
  edges,
  activePaths,
  focusPathId,
  selectedNode,
  onSelectNode,
}: Props) {
  const nodeById = new Map(nodes.map((n) => [n.id, n]));

  // 决定哪些路径要高亮：若选中了某条 → 只亮它；否则亮全部活跃链路。
  const highlighted = focusPathId
    ? activePaths.filter((p) => p.id === focusPathId)
    : activePaths;

  // 每条边的最高严重度（用于着色）；节点是否落在高亮链路上。
  const hotEdge = new Map<string, Severity>();
  const onPath = new Set<string>();
  for (const p of highlighted) {
    p.nodeIds.forEach((id) => onPath.add(id));
    for (let i = 0; i < p.nodeIds.length - 1; i++) {
      const k = edgeKey(p.nodeIds[i], p.nodeIds[i + 1]);
      const prev = hotEdge.get(k);
      if (prev === undefined || SEV_RANK[p.severity] > SEV_RANK[prev]) {
        hotEdge.set(k, p.severity);
      }
    }
  }

  function edgePath(from: GraphNode, to: GraphNode): string {
    const x1 = from.x + NODE_W;
    const y1 = from.y + NODE_H / 2;
    const x2 = to.x;
    const y2 = to.y + NODE_H / 2;
    const dx = Math.max(40, (x2 - x1) / 2);
    return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
  }

  return (
    <div className="graph-wrap">
      <svg className="graph" viewBox="0 0 872 580" preserveAspectRatio="xMidYMin meet">
        <text className="col-label" x="90" y="24">
          数据源
        </text>
        <text className="col-label" x="400" y="24">
          工具（已授予 Agent）
        </text>
        <text className="col-label" x="700" y="24">
          外部 · 系统副作用
        </text>

        {/* edges */}
        {edges.map((e) => {
          const from = nodeById.get(e.from)!;
          const to = nodeById.get(e.to)!;
          const sev = hotEdge.get(edgeKey(e.from, e.to));
          const cls = sev ? `edge hot ${sev}` : 'edge';
          return <path key={edgeKey(e.from, e.to)} className={cls} d={edgePath(from, to)} />;
        })}

        {/* nodes */}
        {nodes.map((n) => {
          const classes = ['node', n.kind];
          if (n.id === selectedNode) classes.push('selected');
          if (onPath.has(n.id)) classes.push('on-path');
          return (
            <g
              key={n.id}
              className={classes.join(' ')}
              transform={`translate(${n.x}, ${n.y})`}
              onClick={() => onSelectNode(n.id === selectedNode ? null : n.id)}
            >
              <rect width={NODE_W} height={NODE_H} rx={9} />
              <text x={12} y={20}>
                {n.label}
              </text>
              <text className="sub" x={12} y={36}>
                {n.kind === 'source'
                  ? `数据源 · ${(n.sensitivity ?? '').toUpperCase()}`
                  : n.kind === 'tool'
                    ? `工具 · ${capLabel(n.capability)}`
                    : n.external
                      ? '外部出口'
                      : '内部系统'}
              </text>
              {n.guardMissing && (
                <text className="badge-guard" x={NODE_W - 16} y={16}>
                  ⚠
                </text>
              )}
            </g>
          );
        })}
      </svg>

      <div className="legend">
        <span>
          <span className="dot" style={{ background: 'var(--source)' }} />
          数据源
        </span>
        <span>
          <span className="dot" style={{ background: 'var(--tool)' }} />
          工具
        </span>
        <span>
          <span className="dot" style={{ background: 'var(--sink)' }} />
          副作用汇
        </span>
        <span>
          <span className="dot" style={{ background: 'var(--high)' }} />
          高危链路
        </span>
        <span>
          <span className="dot" style={{ background: 'var(--medium)' }} />
          中危链路
        </span>
        <span>⚠ = 缺失护栏</span>
      </div>
    </div>
  );
}

function capLabel(c: GraphNode['capability']): string {
  if (c === 'read') return '读取';
  if (c === 'write') return '写入';
  if (c === 'egress') return '外发';
  return '';
}
