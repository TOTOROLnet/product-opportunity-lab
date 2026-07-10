export function HowItWorks() {
  return (
    <section className="how">
      <h2>它是怎么判断的？</h2>
      <p className="how-lead">
        生成式 UI 的界面是模型在运行时现造的——按钮、数字、对比表都是模型输出。Pane
        不与它比谁生成得更漂亮，而是给每个生成的元素附加三样元数据，并据此判定可信度：
      </p>
      <div className="how-grid">
        <div className="how-card">
          <div className="how-tag verified">已核实 Verified</div>
          <p>元素有明确来源与抓取时间，可交叉复核。Pane 为其背书（绿）。</p>
        </div>
        <div className="how-card">
          <div className="how-tag guessed">模型推测 Guessed</div>
          <p>数字/结论由模型自行估算或编造，未与任何来源核对，甚至可能与已核实明细矛盾（黄）。</p>
        </div>
        <div className="how-card">
          <div className="how-tag placeholder">占位·未绑定 Placeholder</div>
          <p>模型为"界面完整"生成的展示元素（尤其是按钮），并未绑定任何真实能力（灰）。</p>
        </div>
      </div>
      <ol className="how-steps">
        <li>
          <b>溯源</b>：点任意元素即可看到它的来源、抓取时间与判定理由。
        </li>
        <li>
          <b>预检</b>：点动作按钮先给出明文"它实际会做什么"；真花钱的动作需显式确认，未绑定能力的占位按钮直接标注。
        </li>
        <li>
          <b>度量</b>：界面级"真实度"仪表汇总已核实 / 推测 / 占位的占比，一眼看清这块界面几成可信。
        </li>
      </ol>
      <p className="how-note">
        ⚠️ 本 Demo 中，「模型生成的界面」与「每个元素的 grounding
        判定」都是<b>预先标注的 mock</b>，用于演示 Pane 的价值。真实产品里，这些元数据由生成式 UI
        框架在生成时暴露（每个组件绑定的数据源与工具），再由启发式/模型判定得出。Demo
        不接任何真实模型、真实价格、真实账单或外部 API。
      </p>
    </section>
  );
}
