export function HowItWorks() {
  return (
    <div className="doc">
      <h2>Concord 解决什么问题？</h2>
      <p>
        在<b>编排式（固定 DAG / handoff）</b>的多 Agent 系统里，故障是可定位的——哪个节点挂了一目了然。
        但今天的运行时（如 Mozaik）主打<b>事件驱动 / 自组织协作</b>：agent 作为 participant 订阅
        <code>onMessage</code> / <code>onFunctionCall</code> / <code>onError</code>，并行工作、动态沟通、失败后重试升级。
        灵活的代价是：<b>故障变成了"关系性、时间性、涌现的"</b>。每个 agent 单看都在"正常工作"（在重试、在等待、在发消息），
        系统级却已经活锁、空转、任务无人接、或两个 agent 抢改同一文件——token 和墙钟时间在悄悄烧，直到超预算才被发现。
      </p>
      <p>
        <b>Concord 不是又一个事件查看器（trace viewer）。</b>trace 只会给你更多原始事件，看不懂的人只会被淹得更彻底。
        Concord 是一层<b>中立的协作失调诊断层</b>：吃任意来源的运行事件流，用一组
        <b>关系性 + 时间性检测器</b>自动判出协作反模式，并给出<b>因果链 + 浪费成本 + 一句话病因 + 修复处方</b>。
      </p>

      <h2>5 类检测器（本 Demo 已用真实代码实现）</h2>

      <div className="detector-card">
        <b>① 活锁 / Ping-Pong（致命）</b>
        <p>
          一对 agent 反复 <code>handoff</code> 却无任何 progress state 前进 → 双方都在等对方定夺。
          处方：设决策仲裁者 / 强制默认值，超过 N 次自动升级拍板。
        </p>
      </div>
      <div className="detector-card">
        <b>② 无主任务 · 黑洞（致命）</b>
        <p>
          任务被 <code>assign</code> 后，owner 长时间零动作、也无完成/失败信号 → 整条目标被静默阻塞。
          处方：dead-owner 超时自动重派 / 升级，维护未完成任务看板。
        </p>
      </div>
      <div className="detector-card">
        <b>③ 空转不前进（致命）</b>
        <p>
          一个窗口内产生大量事件，但目标状态一次都没前进 → 团队在忙、没在推进。
          处方：无进展看门狗，窗口内零 progress 就暂停告警。
        </p>
      </div>
      <div className="detector-card">
        <b>④ 重试风暴（警告）</b>
        <p>
          同一 agent 对同一 resource 连续失败重试，无退避无熔断，token 空烧。
          处方：max-retry + 指数退避，超阈值熔断升级或换路由。
        </p>
      </div>
      <div className="detector-card">
        <b>⑤ 重复写入冲突（警告）</b>
        <p>
          多个 agent 无锁并发写同一资源 → 重复工作 + 合并冲突，有一份 token 白花。
          处方：共享资源串行化 / 租约锁，派活时避免同一文件拆两人。
        </p>
      </div>

      <h2>为什么这不是 trace / APM（before → after）</h2>
      <div className="ba">
        <div className="col before">
          <b style={{ color: 'var(--crit)' }}>Before：原始事件日志 / 通用 trace</b>
          <p>
            一长串 message / function_call / error / handoff。你能看到"发生了什么"，但看不出"这是一种病"——
            要靠人脑在几十上百条事件里脑补出"他俩在活锁"。agent 越多、run 越长，越看不过来。
          </p>
        </div>
        <div className="col after">
          <b style={{ color: 'var(--accent-2)' }}>After：Concord 诊断</b>
          <p>
            一眼得到 verdict（HEALTHY / DEGRADED / STUCK）、病灶清单、烧了多少 token、
            以及"该怎么修"。把"看事件"升级为"判病 + 开处方"。
          </p>
        </div>
      </div>

      <h2>定位与边界（诚实声明）</h2>
      <ul>
        <li>
          <b>中立诊断层，不是运行时、不是闸门。</b>不产事件、不执行重试、不拦动作——只消费任意来源的事件流做只读诊断。
          与"高危工具审批控制面"是两回事。
        </li>
        <li>
          <b>只看协作过程，不看产出物 / 证据。</b>Concord 问的是"这个多 Agent 团队协作得健不健康、卡在哪、烧了谁的 token"，
          而不是"最终交付对不对"。
        </li>
        <li>
          <b>不是 Mozaik 克隆。</b>Mozaik 是产生这些事件的运行时；Concord 补上它被点名缺失的"可视化调试 / 冲突识别"，
          且做成跨运行时中立层（AutoGen / CrewAI / LangGraph 的事件流也能吃）。
        </li>
        <li>
          <b>本页为纯前端概念 Demo。</b>全部事件流为 mock；真实产品需要事件规范化 + 稳健去噪（避免假阳性），工程量不小。
        </li>
      </ul>

      <div className="footer">
        信号来源：product-hunt-radar 2026-07-07 报告（Mozaik / Edgee / CodeMote，"Agent 运行控制面分层"趋势）。
        报告为参考资料，Concord 的切入点（协作失调诊断层）是独立判断的产物，非复刻报告中的任一产品。
      </div>
    </div>
  );
}
