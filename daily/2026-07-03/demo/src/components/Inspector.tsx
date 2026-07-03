import type { GraphNode, Policy } from '../types';

interface Props {
  node: GraphNode | null;
  policies: Record<string, Policy>;
}

const POLICY_LABEL: Record<Policy, string> = {
  always: 'Always allow（全自动）',
  approval: 'Needs approval（人审）',
  blocked: 'Blocked（停用）',
};

const REV_LABEL: Record<string, string> = {
  yes: '可逆',
  partial: '部分可逆',
  no: '不可逆',
};

export default function Inspector({ node, policies }: Props) {
  return (
    <div className="card inspector">
      <h3>节点详情</h3>
      {!node && (
        <div className="empty">
          点击左侧能力图上的任意<b>数据源 / 工具 / 副作用汇</b>查看它的语义、敏感度与当前策略。
          <br />
          <br />
          红/黄流动的线，是系统发现的<b>可被 Agent 组合出的高危链路</b>——切到「风险链路」看排序与解释。
        </div>
      )}
      {node && (
        <>
          <div className="kv">
            <span className="k">名称</span>
            <span className="v">{node.label}</span>
          </div>
          <div className="kv">
            <span className="k">类型</span>
            <span className="v">
              {node.kind === 'source' ? '数据源' : node.kind === 'tool' ? '工具' : '副作用汇'}
            </span>
          </div>
          {node.kind === 'source' && node.sensitivity && (
            <div className="kv">
              <span className="k">数据敏感度</span>
              <span className="v">
                <span className={`tag ${node.sensitivity}`}>{node.sensitivity.toUpperCase()}</span>
              </span>
            </div>
          )}
          {node.kind === 'tool' && (
            <>
              <div className="kv">
                <span className="k">能力</span>
                <span className="v">
                  {node.capability === 'read'
                    ? '读取'
                    : node.capability === 'write'
                      ? '写入'
                      : '外发'}
                </span>
              </div>
              <div className="kv">
                <span className="k">可逆性</span>
                <span className="v">
                  <span className={`tag ${node.reversibility}`}>
                    {REV_LABEL[node.reversibility ?? 'yes']}
                  </span>
                </span>
              </div>
              <div className="kv">
                <span className="k">当前策略</span>
                <span className="v">{POLICY_LABEL[policies[node.id] ?? 'always']}</span>
              </div>
              {node.guardMissing && (
                <div className="kv">
                  <span className="k">缺失护栏</span>
                  <span className="v" style={{ color: 'var(--medium)' }}>
                    ⚠ {node.guardMissing}
                  </span>
                </div>
              )}
            </>
          )}
          {node.kind === 'sink' && (
            <div className="kv">
              <span className="k">位置</span>
              <span className="v">
                <span className={`tag ${node.external ? 'pii' : 'internal'}`}>
                  {node.external ? '组织外部' : '内部系统'}
                </span>
              </span>
            </div>
          )}
          <div className="desc">{node.desc}</div>
        </>
      )}
    </div>
  );
}
