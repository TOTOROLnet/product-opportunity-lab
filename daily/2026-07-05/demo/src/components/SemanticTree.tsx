import type { Scenario, SemanticNode } from '../types';

interface Props {
  scenario: Scenario;
  activeNodeId: string | null;
  onSelectNode: (id: string) => void;
}

const CHANGE_BADGE: Record<SemanticNode['change'], { sym: string; label: string }> = {
  added: { sym: '+', label: '新增' },
  removed: { sym: '−', label: '删除' },
  modified: { sym: '~', label: '修改' },
  unchanged: { sym: '·', label: '未变' },
};

function NodeRow({
  node,
  depth,
  activeNodeId,
  onSelectNode,
}: {
  node: SemanticNode;
  depth: number;
  activeNodeId: string | null;
  onSelectNode: (id: string) => void;
}) {
  const badge = CHANGE_BADGE[node.change];
  const isActive = node.id === activeNodeId;
  return (
    <>
      <div
        id={`node-${node.id}`}
        className={`tree-node change-${node.change} ${isActive ? 'active' : ''}`}
        style={{ marginLeft: depth * 18 }}
        onClick={() => onSelectNode(node.id)}
      >
        <span className={`change-badge cb-${node.change}`}>{badge.sym}</span>
        <span className="node-kind">{node.kind}</span>
        <span className="node-label">{node.label}</span>
        {node.detail && <span className="node-detail">{node.detail}</span>}
        {(node.before || node.after) && (
          <span className="node-delta">
            {node.before && <span className="delta-before">{node.before}</span>}
            {node.before && node.after && <span className="delta-arrow">→</span>}
            {node.after && <span className="delta-after">{node.after}</span>}
          </span>
        )}
      </div>
      {node.children?.map((c) => (
        <NodeRow key={c.id} node={c} depth={depth + 1} activeNodeId={activeNodeId} onSelectNode={onSelectNode} />
      ))}
    </>
  );
}

export function SemanticTree({ scenario, activeNodeId, onSelectNode }: Props) {
  return (
    <div className="panel tree-panel">
      <div className="panel-head">
        <h3>语义 diff</h3>
        <span className="panel-sub">产物被解析成实体 / 关系 / 约束，改动标注在语义结构上（不是行）</span>
      </div>
      <div className="tree">
        {scenario.tree.map((n) => (
          <NodeRow key={n.id} node={n} depth={0} activeNodeId={activeNodeId} onSelectNode={onSelectNode} />
        ))}
      </div>
      <div className="tree-legend">
        <span><span className="lg lg-added">+</span> 新增</span>
        <span><span className="lg lg-removed">−</span> 删除</span>
        <span><span className="lg lg-modified">~</span> 修改</span>
        <span><span className="lg lg-unchanged">·</span> 未变</span>
      </div>
    </div>
  );
}
