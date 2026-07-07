export function HowItWorks() {
  return (
    <div className="how">
      <section className="how-block">
        <h3>一句话</h3>
        <p>
          整条 agent 栈都在优化「把 run 往前推」。<strong>Reverso 是那层没人做的「倒退路径」</strong>：
          为 run 里每个改状态的动作，算出<strong>能不能退、怎么退、退到哪一步就退不回来</strong>。
        </p>
      </section>

      <section className="how-block">
        <h3>forward path 已被做满，backward path 是空位</h3>
        <div className="how-fb">
          <div className="how-fb-col">
            <div className="how-fb-h forward">向前 forward（已有）</div>
            <ul>
              <li><b>LongCat-2.0</b>：更便宜的 1M 长上下文 → run 推得更远</li>
              <li><b>Mozaik</b>：失败后运行时重试 / 升级 → 往前恢复</li>
              <li><b>Edgee</b>：压缩 / 路由 / provider fallback → 换条路继续</li>
              <li><b>CodeMote</b>：手机一键批准 → 推它继续</li>
            </ul>
          </div>
          <div className="how-fb-col">
            <div className="how-fb-h backward">向后 backward（空位）</div>
            <ul>
              <li>动作做了之后能不能退回？</li>
              <li>具体怎么退（逆操作 / 补偿）？</li>
              <li>退到哪一步就退不回来（临界点）？</li>
              <li><b>Nixmac</b> 有回滚，但锁死在 Nix 一个窄域</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="how-block">
        <h3>确定性判定规则（节选）</h3>
        <p className="how-muted">
          可逆性由动作类型 + 上下文 flag（是否已快照 / 是否共享分支 / 是否有备份）确定性推出，
          <b>不是按场景写死结论</b>。切场景或开「保护网」会实时重算。
        </p>
        <table className="how-table">
          <thead>
            <tr>
              <th>动作</th>
              <th>默认可逆性</th>
              <th>依赖的上下文</th>
              <th>回滚方式</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>写文件 / git 提交</td><td className="ok">可逆</td><td>—</td><td>checkout / reset</td></tr>
            <tr><td>删文件</td><td className="warn">看快照</td><td>是否已快照</td><td>从快照恢复 / 无法恢复</td></tr>
            <tr><td>推共享分支</td><td className="warn">可补偿</td><td>是否共享</td><td>revert + 协调协作者</td></tr>
            <tr><td>DB 删行 / 删列</td><td className="warn">看备份</td><td>是否有备份</td><td>备份回放 / 数据永久丢失</td></tr>
            <tr><td>部署发布 / 扣款</td><td className="warn">可补偿</td><td>—</td><td>回滚上一版 / 退款（有代价）</td></tr>
            <tr><td>发消息（邮件/IM）</td><td className="bad">不可逆</td><td>—</td><td>无法撤回，只能补发更正</td></tr>
            <tr><td>销毁云资源</td><td className="warn">看备份</td><td>是否有备份</td><td>快照重建 / 永久销毁</td></tr>
          </tbody>
        </table>
      </section>

      <section className="how-block">
        <h3>run 级 verdict</h3>
        <ul className="how-verdicts">
          <li><span className="v ok">SAFE</span> 全部动作可干净回退</li>
          <li><span className="v warn">CHECKPOINT</span> 全可退，但有动作撤销有代价（时间/金钱/停机）</li>
          <li><span className="v bad">STOP</span> 存在不可逆动作 → 在首个不可逆动作（临界点）前插入人工确认 / 自动快照</li>
        </ul>
      </section>

      <section className="how-block">
        <h3>它不是什么（定位区隔）</h3>
        <ul className="how-diff">
          <li><b>≠ 审批 / 权限闸门（如 Fusebox / CodeMote）</b>：那些解决「<i>要不要让它做</i>」；Reverso 假设动作会执行，解决「<i>做了能不能、如何退回</i>」。治理 ≠ 可恢复性。</li>
          <li><b>≠ 多 Agent 协作诊断（Concord）</b>：那看「协作过程随时间健不健康（交互图×时间）」；Reverso 看「单个动作后果的可恢复性（动作×逆操作×临界点）」。正交。</li>
          <li><b>≠ 运行时 / 网关（Mozaik / Edgee）</b>：不做运行时、不绑厂商；吃任意来源的动作，只产出可逆性 + 回滚手册 + 临界点。</li>
          <li><b>≠ 通用 trace / APM</b>：trace 说「发生了什么」；Reverso 说「怎么退回去、退到哪算到头」。</li>
        </ul>
      </section>

      <section className="how-block how-note">
        <p>
          这是纯前端<strong>模拟体验 Demo</strong>：不真正执行或回滚任何动作，数据全部 mock，
          不接后端 / 数据库 / 支付 / 外部 API。判定逻辑见 <code>src/logic/analyze.ts</code>。
        </p>
      </section>
    </div>
  )
}
