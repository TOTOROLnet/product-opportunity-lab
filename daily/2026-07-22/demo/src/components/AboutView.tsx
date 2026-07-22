export function AboutView() {
  return (
    <div className="about">
      <h2 className="about-h">付前一秒 CommitGuard 是什么</h2>
      <p className="about-lead">
        一层夹在你的 <strong>AI 消费 agent</strong> 与你的 <strong>钱包</strong> 之间的「成交守门人」。
        当 agent 即将点下「确认支付」的前一秒，CommitGuard 把它要成交的那一单摊开成人话核验单——
        <strong>意图对齐 · 真实总价 · 陷阱雷达 · 可逆性评分</strong>——让你看清代价再决定放行、让它改、或拒绝。
      </p>

      <div className="about-grid">
        <div className="about-card">
          <div className="about-card-h">解决什么问题</div>
          <p>
            当 agent 能无摩擦地替你成交，你就失去了对「到底承诺了什么、花了多少真钱、能不能退」的感知。
            CommitGuard 把这三件事在成交前摊开，把「敢不敢让 agent 花钱」从一次盲目信任，变成一次知情决策。
          </p>
        </div>
        <div className="about-card">
          <div className="about-card-h">与 CartAI 等清算层的本质区别</div>
          <p>
            今天的 agentic commerce 玩家（如 CartAI）都站在<strong>卖家 / agent-builder 一侧</strong>，
            目标是让交易「更容易成交」，且常按成交额分佣——利益与「多成交」绑定。
            CommitGuard 站在<strong>消费者一侧</strong>，激励与「拦住坏单」对齐，坐在谈判桌的对面。
          </p>
        </div>
        <div className="about-card">
          <div className="about-card-h">为什么是 AI 核心</div>
          <p>
            解析任意商户结账页、识别自动续订 / 预勾选 / drip pricing 等 dark pattern、
            把「你的意图 vs agent 的购物车」做语义比对、估计一笔交易的可逆性——每一项都必须靠 AI。
          </p>
        </div>
        <div className="about-card honest">
          <div className="about-card-h">诚实声明（这是一个 Demo）</div>
          <p>
            本页所有订单、费用、陷阱、评分均为<strong>预置 mock 数据</strong>，由一个<strong>确定性核验引擎</strong>计算，
            <strong>不接真实支付 / 数据库 / 登录 / 外部 API</strong>，也未运行真实的 dark pattern 识别模型。
            它只用于演示「成交前核验」这一创新切入点的机制成立与价值形态，不代表真实识别质量。
          </p>
        </div>
      </div>

      <div className="about-source">
        灵感信号来自 2026-07-22 Product Hunt AI 雷达：CartAI 把「交易清算」做成 agent 原语、Manifest 把网页动作结构化、
        支付网络铺 agent pay 轨道，共同指向「transactable web」。CommitGuard 是这条链上唯一站在消费者一侧的一层。
      </div>
    </div>
  );
}
