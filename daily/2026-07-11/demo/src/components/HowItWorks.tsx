import { useState } from 'react';

export function HowItWorks() {
  const [open, setOpen] = useState(false);
  return (
    <section className="how">
      <button className="how-toggle" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        {open ? '▾' : '▸'} 它如何工作 / 方法论（含 mock 声明）
      </button>
      {open && (
        <div className="how-body">
          <h4>为什么需要 Rootline</h4>
          <p>
            2026-07-11：OpenAI GPT-5.6（<code>multi_agent</code> beta）与 Meta Muse Spark 1.1 同日把
            「多智能体编排」从应用脚手架下沉为模型 / API 原语——根代理在<strong>一次调用内</strong>
            spawn 一棵子代理树，彼此 message / wait，并由服务端<strong>自动压缩（compaction）</strong>
            分别管理各代理上下文。能力上移的同时，过程变成<strong>原子黑盒</strong>，开发者对中间步骤的
            控制点（预算、审批、可观测）被抽走了。
          </p>
          <h4>被忽略的新失效模式</h4>
          <p>
            压缩是<strong>有损</strong>的：叶子代理只把「摘要」上报，父代理再压缩再上报，根代理最终基于
            「<strong>摘要的摘要</strong>」作答。一个本可推翻结论的关键约束 / 数字 / 前提，可能在深层子树被
            悄悄压掉，而根代理<strong>从未见过它</strong>，却照样自信作答。Rootline 就是给每条承重结论
            追一条穿过压缩层的<strong>证据根脉</strong>，判定它：
          </p>
          <ul>
            <li><strong>存续</strong>：支撑事实穿过压缩层保持完整。</li>
            <li><strong>失真</strong>：承重细节被压缩丢弃 / 弱化，结论具误导性。</li>
            <li><strong>断链</strong>：结论是根代理的综合产物，其支撑证据未在压缩链中存续。</li>
          </ul>
          <h4>关于数据</h4>
          <p className="how-mock">
            ⚠️ 本页所有子代理树、原始发现、压缩后上报、被丢弃事实与判定结果均为<strong>人工构造的 mock</strong>，
            用于证明产品价值主张。Demo <strong>不调用任何真实模型（OpenAI / Meta）</strong>、不接后端 /
            数据库 / 密钥。真实落地需从模型侧拿到子代理过程数据与压缩前后差异（详见 opportunity.md 的风险讨论）。
          </p>
        </div>
      )}
    </section>
  );
}
