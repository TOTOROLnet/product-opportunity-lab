export function Method() {
  return (
    <div className="method">
      <section className="method-block">
        <h3>这是什么</h3>
        <p>
          召算是一个<b>厂商中立、发生在上线前</b>的决策沙盘：帮做「AI 员工 / computer-use
          agent」的 solo founder，在给 agent 配「电脑」、给产品定价<em>之前</em>，看清四种运行时架构下的月账单、毛利随规模的悬崖、以及「隔离 / 可靠 / 单位成本」不可能三角。
          它<b>不运行任何 agent、不接任何云</b>，卖的是判断而不是运行时。
        </p>
      </section>

      <section className="method-block">
        <h3>成本模型（确定性公式，全部 mock）</h3>
        <ul className="formula-list">
          <li>
            月总忙碌时长 = 总任务数 × 平均任务时长；总任务数含「鲸鱼」放大（重度用户按放大倍数吞噬用量）。
          </li>
          <li>会话开着时长（含闲置）= 忙碌时长 ÷ (1 − 闲置比)。</li>
          <li>
            <b>自建 VPS 常驻</b>：按峰值并发预置实例、24/7 常驻计费（闲置与峰值余量全浪费）。
          </li>
          <li>
            <b>本地客户端</b>：算力在用户设备，厂商成本 ≈ 仅按用户数的控制面开销（最省，但不满足「离开时继续干活」）。
          </li>
          <li>
            <b>云端常驻</b>：会话开着的整段（忙 + 闲）按热机小时计费——闲置比越高越烧钱。
          </li>
          <li>
            <b>边缘按需召唤</b>：只按真实忙碌小时计费 + 每会话极小常开开销（闲置几乎不计费，但冷启动更高、绑定边缘全家桶）。
          </li>
          <li>毛利率 = (月营收 − 基础设施成本) ÷ 月营收；营收 = 活跃用户 × 定价。</li>
          <li>悬崖点 = 保持其余画像不变、只放大用户数时，毛利首次转负的用户规模。</li>
        </ul>
      </section>

      <section className="method-block transparency">
        <h3>透明度：报告事实 vs 我的建模假设</h3>
        <table className="fact-table">
          <thead>
            <tr>
              <th>来自 2026-08-24 radar 报告的事实</th>
              <th>我在本 Demo 里的建模假设（非真实报价）</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Construct 把 Linux「按 tool-call 召唤、用完即散」，$9/月起，跑在 Cloudflare 边缘。</td>
              <td>边缘按需只按忙碌小时（$0.18/h）+ 每会话极小开销计费；冷启动 ~1.9s；强锁定。</td>
            </tr>
            <tr>
              <td>AutoClaw 走本地、Epho 走云端常驻，成本承担方各不相同。</td>
              <td>本地厂商成本≈$0.25/用户/月控制面；云端常驻 $0.12/开机小时（含闲置）。</td>
            </tr>
            <tr>
              <td>「来了不回的用户变多，基础设施账单就被拖垮」；隔离/可靠/单位成本是不可能三角。</td>
              <td>用鲸鱼比例×放大倍数模拟用量吞噬；三难以 0-100 定性档案分呈现（原型特征，非实测）。</td>
            </tr>
          </tbody>
        </table>
        <p className="disclaimer">
          ⚠ 免责：所有单价、冷启动、隔离/可靠评分均为便于演示的<b>建模假设</b>，不代表任何厂商的真实报价或性能。真实产品应支持注入你自有的云报价并做敏感性分析。本 Demo 纯前端、不接后端 / LLM / 数据库 / 支付 / 外部 API。
        </p>
      </section>

      <section className="method-block">
        <h3>为什么这不是照抄 Construct</h3>
        <p>
          Construct 是「<b>跑</b> agent 的运行时」，按 tool-call 真实计费、绑定 Cloudflare；召算是「<b>选 / 算</b> 运行时的决策沙盘」，厂商中立、纯前端模拟决策期的账，产物是架构选择说明书 + 毛利风险预警。阶段（运行 vs 决策）、形态（服务 vs 沙盘）、绑定（锁边缘 vs 中立）三点都本质不同。
        </p>
      </section>
    </div>
  );
}
