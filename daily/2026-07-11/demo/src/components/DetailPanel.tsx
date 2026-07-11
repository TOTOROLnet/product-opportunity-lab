import type { AgentNode, Claim, Scenario } from '../types';
import { SURVIVAL_META, indexNodes, rootPath } from '../logic/rootline';

interface DetailPanelProps {
  scenario: Scenario;
  selectedClaim: Claim | undefined;
  selectedNode: AgentNode | undefined;
  onSelectNode: (id: string) => void;
}

function NodeDetail({ node }: { node: AgentNode }) {
  const hasLoss = node.droppedFacts.length > 0;
  return (
    <div className="node-detail">
      <div className="detail-head">
        <span className="detail-kicker">节点 · 压缩前后</span>
        <h3>{node.role}</h3>
      </div>

      <div className="diff-block raw">
        <span className="diff-label">原始发现（压缩前）</span>
        <ul>
          {node.rawFindings.map((f, i) => {
            const dropped = node.droppedFacts.some((d) => d === f || f.includes(d) || d.includes(f));
            return (
              <li key={i} className={dropped ? 'dropped' : ''}>
                {dropped && <span className="strike-flag">丢弃</span>}
                {f}
              </li>
            );
          })}
        </ul>
      </div>

      <div className="diff-arrow" aria-hidden="true">↓ 服务端 compaction</div>

      <div className="diff-block reported">
        <span className="diff-label">压缩后向上汇报</span>
        <p>{node.reportedUp}</p>
      </div>

      {hasLoss ? (
        <div className="diff-block lost">
          <span className="diff-label">⚠ 被压缩丢弃的承重事实</span>
          <ul>
            {node.droppedFacts.map((d, i) => (
              <li key={i}>{d}</li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="diff-block nolost">该节点未丢弃承重事实。</div>
      )}
    </div>
  );
}

function ClaimTrace({
  scenario,
  claim,
  onSelectNode,
}: {
  scenario: Scenario;
  claim: Claim;
  onSelectNode: (id: string) => void;
}) {
  const meta = SURVIVAL_META[claim.survival];
  const byId = indexNodes(scenario.nodes);
  // 根脉：自底向上（源头→根）；展示时反过来，从根到源头更直观。
  const path = rootPath(scenario.nodes, claim.sourceNodeId).slice().reverse();

  return (
    <div className="claim-trace">
      <div className="detail-head">
        <span className="detail-kicker">根脉溯源</span>
        <h3>「{claim.text}」</h3>
        <span className={`survival-tag big tone-${meta.tone}`}>{meta.label} · {meta.short}</span>
      </div>

      <p className="trace-explain">{claim.explanation}</p>

      <div className="trace-hops">
        <span className="diff-label">根脉逐跳（根 → 源头，红条＝该跳压缩丢弃的承重事实）</span>
        {path.map((node, idx) => {
          const isSource = node.id === claim.sourceNodeId;
          return (
            <div key={node.id} className="hop">
              <button className="hop-node" onClick={() => onSelectNode(node.id)}>
                <span className="hop-idx">{idx + 1}</span>
                <span className="hop-role">{node.role}</span>
                {isSource && <span className="source-flag">源头</span>}
                {node.compacted && <span className="hop-compact">⚠ 已压缩</span>}
              </button>
              <div className="hop-reported">上报：{byId[node.id].reportedUp}</div>
              {node.droppedFacts.length > 0 && (
                <ul className="hop-dropped">
                  {node.droppedFacts.map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function DetailPanel({ scenario, selectedClaim, selectedNode, onSelectNode }: DetailPanelProps) {
  return (
    <div className="detail-panel">
      {selectedNode ? (
        <NodeDetail node={selectedNode} />
      ) : selectedClaim ? (
        <ClaimTrace scenario={scenario} claim={selectedClaim} onSelectNode={onSelectNode} />
      ) : (
        <div className="detail-empty">
          <div className="detail-empty-icon">🧭</div>
          <p>
            点右侧一条<strong>承重结论</strong>，追它穿过子代理树的<strong>证据根脉</strong>；
            或点树上任意节点，看它<strong>压缩前后</strong>丢了什么。
          </p>
        </div>
      )}
    </div>
  );
}
