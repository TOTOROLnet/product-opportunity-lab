import { AGENTS, CONTRACTS } from '../data/pipeline';
import type { AgentId } from '../types';
import { Pill } from './ui';

export default function DriveView() {
  return (
    <div className="view">
      <div className="panel intro">
        <div className="intro-left">
          <div className="intro-title">🧩 一块共享盘 /drive，三个 agent 靠工件「咬合」协作</div>
          <p className="intro-blurb">
            多个 agent 通过 Blaxel Agent Drive 这类<b>共享文件系统</b>交换中间工件：研究员写{' '}
            <code>findings.json</code>，分析师读它、写 <code>metrics.json</code>，报告员再读它、写{' '}
            <code>report.md</code>。它们靠什么保证彼此读得对？—— 靠<b>接口契约</b>（榫卯的「榫头」对「卯眼」）。
            一旦生产者悄悄改了工件的形状/单位/语义，榫头就对不上卯眼，下游会<b>静默误读</b>。
          </p>
          <div className="mock-note">
            这是纯前端 mock：一条模拟的 3-agent 研究流水线（主题「竞品定价策略」），
            <b>不挂载任何真实文件系统</b>，不接后端/LLM/外部 API。下一页「漂移哨兵」是核心体验。
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h2>生产者 → 消费者依赖链</h2>
          <span className="panel-sub">红木底色的节点 = 本 Demo 里漂移的源头</span>
        </div>
        <div className="pipe">
          {(['researcher', 'analyst', 'reporter'] as AgentId[]).map((id, i) => (
            <PipeNode key={id} id={id} hot={id === 'researcher'} last={i === 2} />
          ))}
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h2>盘上的工件与它们的接口契约</h2>
          <span className="panel-sub">契约 = 字段 / 类型 / 单位 / 取值域 / 谁依赖</span>
        </div>
        <div className="arts">
          {CONTRACTS.map((c) => (
            <div className="art" key={c.file}>
              <div className="art-file">{c.file}</div>
              <div className="art-meta">
                产出：{AGENTS[c.producer].emoji} {AGENTS[c.producer].name.replace(' Agent', '')} ·{' '}
                {c.consumers.length ? `被 ${c.consumers.length} 个下游读取` : '终端工件'}
              </div>
              <div className="art-fields">
                {c.fields.map((f) => (
                  <div className="field" key={f.name}>
                    <span className="field-name">{f.name}</span>
                    <span className="field-type">
                      {f.type}
                      {f.unit ? ` · ${f.unit}` : ''}
                      {f.values ? ` · {${f.values.join(', ')}}` : ''}
                    </span>
                    {f.consumedBy && f.consumedBy.length > 0 && (
                      <span className="field-dep">被下游依赖</span>
                    )}
                  </div>
                ))}
              </div>
              <div>
                <Pill tone="info">契约 v{c.version}</Pill>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PipeNode({ id, hot, last }: { id: AgentId; hot: boolean; last: boolean }) {
  const a = AGENTS[id];
  const outFile =
    id === 'researcher' ? 'findings.json' : id === 'analyst' ? 'metrics.json' : 'report.md';
  return (
    <>
      <div className={`pipe-node ${hot ? 'hot' : ''}`}>
        <div className="pipe-agent">
          <span className="pipe-emoji">{a.emoji}</span>
          {a.name}
        </div>
        <div className="pipe-role">{a.role}</div>
        <div className="pipe-file">写 → {outFile}</div>
      </div>
      {!last && <div className="pipe-arrow">→</div>}
    </>
  );
}
