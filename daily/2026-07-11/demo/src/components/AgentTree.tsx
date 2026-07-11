import type { AgentNode, Claim } from '../types';
import { childrenOf, isOnPath } from '../logic/rootline';

interface AgentTreeProps {
  nodes: AgentNode[];
  selectedClaim: Claim | undefined;
  selectedNodeId: string | null;
  onSelectNode: (id: string) => void;
}

const KIND_LABEL: Record<AgentNode['kind'], string> = {
  root: '根',
  sub: '子代理',
  leaf: '叶子',
};

interface NodeItemProps extends AgentTreeProps {
  node: AgentNode;
}

function NodeItem({ node, nodes, selectedClaim, selectedNodeId, onSelectNode }: NodeItemProps) {
  const kids = childrenOf(nodes, node.id);
  const onPath = selectedClaim ? isOnPath(nodes, selectedClaim.sourceNodeId, node.id) : false;
  const isSource = selectedClaim?.sourceNodeId === node.id;
  const isSelected = selectedNodeId === node.id;
  const hasLoss = node.droppedFacts.length > 0;

  const cls = [
    'tree-node',
    `kind-${node.kind}`,
    onPath ? 'on-path' : '',
    isSelected ? 'selected' : '',
    isSource ? 'is-source' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <li>
      <button className={cls} onClick={() => onSelectNode(node.id)}>
        <span className="node-head">
          <span className={`kind-badge kind-${node.kind}`}>{KIND_LABEL[node.kind]}</span>
          <span className="node-role">{node.role}</span>
          {isSource && <span className="source-flag">根脉源头</span>}
        </span>
        <span className="node-meta">
          <span className="token-chip" title="上下文 token 进 / 出">
            {node.tokensIn.toLocaleString()}↓ / {node.tokensOut.toLocaleString()}↑ tok
          </span>
          {node.compacted ? (
            <span className={`compact-chip${hasLoss ? ' lossy' : ''}`}>
              ⚠ 已压缩{hasLoss ? ` · 丢 ${node.droppedFacts.length} 事实` : ''}
            </span>
          ) : (
            <span className="compact-chip none">未压缩</span>
          )}
        </span>
      </button>
      {kids.length > 0 && (
        <ul className="tree-children">
          {kids.map((k) => (
            <NodeItem
              key={k.id}
              node={k}
              nodes={nodes}
              selectedClaim={selectedClaim}
              selectedNodeId={selectedNodeId}
              onSelectNode={onSelectNode}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export function AgentTree(props: AgentTreeProps) {
  const roots = childrenOf(props.nodes, null);
  return (
    <div className="agent-tree">
      <div className="panel-title">
        子代理树 <span className="panel-sub">（一次 multi_agent 调用内 spawn 的黑盒树 · 点节点看压缩前后）</span>
      </div>
      <ul className="tree-root">
        {roots.map((r) => (
          <NodeItem key={r.id} node={r} {...props} />
        ))}
      </ul>
    </div>
  );
}
