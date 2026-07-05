export function HowItWorks() {
  return (
    <div className="howto">
      <h2>为什么行级 diff 不够？</h2>
      <p className="howto-lede">
        AI Agent 正在越来越多地直接编辑<strong>结构化产物</strong>——云基建配置、数据库 schema、CI 工作流、CAD feature tree。
        但今天的评审工具（GitHub / IDE 的行级 diff）是<strong>语义盲</strong>的：它只告诉你"这几行变了"，
        不告诉你"一个约束被删了 / 一个网络被放开了 / 一个下游依赖被打断了 / 一个默认值改变了行为"。
      </p>

      <div className="howto-cmp">
        <div className="cmp-col cmp-before">
          <div className="cmp-title">行级 diff（现状）</div>
          <ul>
            <li>以<strong>文本行</strong>为单位</li>
            <li>+3 / −1 行 = "看起来是小改动"</li>
            <li>删掉一条 NOT NULL、放宽一个 CIDR、跌破工艺下限——<strong>都被伪装成普通一行</strong></li>
            <li>reviewer 要么全信，要么逐字段人肉重审</li>
          </ul>
        </div>
        <div className="cmp-col cmp-after">
          <div className="cmp-title">Contour 语义评审</div>
          <ul>
            <li>把产物解析成<strong>实体 / 关系 / 约束</strong></li>
            <li>算出<strong>语义 diff</strong>：改了哪些实体，而不是哪些行</li>
            <li>对每个改动跑<strong>意图 / 不变量核验</strong>，把"行级看不见、语义上高危"的改动顶到最前</li>
            <li>给出 before/after 评审判定：<strong>SAFE / REVIEW / BLOCK</strong></li>
          </ul>
        </div>
      </div>

      <div className="howto-invariants">
        <h3>Demo 内置的不变量示例（真实产品应做成可扩展的不变量库）</h3>
        <ul>
          <li>管理端口（SSH/RDP）不得向 <code>0.0.0.0/0</code> 开放</li>
          <li>生产容器必须设置 <code>memory_limit</code></li>
          <li>订单必须归属一个存在的客户（<code>NOT NULL</code> + 外键）</li>
          <li>金额类列不可为空且应有默认值</li>
          <li>被引用的 CAD feature 不得删除（引用完整性）</li>
          <li>壁厚必须 ≥ 材料工艺下限</li>
          <li>CI 基础镜像必须固定到不可变 digest</li>
        </ul>
      </div>

      <div className="howto-scope">
        <h3>刻意不做（这是评审镜片，不是别的东西）</h3>
        <p>
          Contour <strong>不替你产生任何改动</strong>（不是 Adam 那样的 CAD authoring copilot），
          <strong>不可视化执行过程</strong>（不是 Termi 那样的 run trace），
          <strong>不核验 Agent 的自述文字</strong>（那是另一层）。
          它只做一件事：把 Agent 交出的结构化产物的<strong>语义 delta</strong> 和<strong>意图/不变量风险</strong>摆到 reviewer 面前，
          让"能不能 merge"变成看证据的决定。
        </p>
      </div>
    </div>
  );
}
