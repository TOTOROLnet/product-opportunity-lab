import { FLEET_RUNS } from '../data/runs';

export function HowTrust() {
  const example = FLEET_RUNS.find((r) => r.id === 'run-deploy-next-cf')!;
  const pruned = example.rawSteps.filter((s) => s.kind !== 'action').length;

  return (
    <>
      <div className="panel">
        <h2>一条噪声运行，如何变成一条可复用的配方</h2>
        <p className="sub">
          现成不发明做法，也不跑 agent —— 它只做一件事：把舰队里**真实发生过、且被验证成功**的运行，蒸馏成别的 agent 能直接复用的最短路径。
        </p>

        <div className="flow">
          <div className="flowbox">
            <h4>1 · 采集</h4>
            <p>从任意运行时（Construct / Epho / 自建 VPS）收集 agent 的运行痕迹：命令、编辑、结果、验证信号。厂商中立。</p>
          </div>
          <div className="arrow">→</div>
          <div className="flowbox">
            <h4>2 · 蒸馏</h4>
            <p>
              对同一意图的多次运行做 diff，剔除弯路 / 重试 / 环境噪声，只留下真正促成成功的最短步骤序列。
            </p>
          </div>
          <div className="arrow">→</div>
          <div className="flowbox hl">
            <h4>3 · 验证 + 检索复用</h4>
            <p>
              只把「有验证信号」的配方标为已验证；新任务开工前按意图 + 环境指纹检索命中，并给出「你的环境差在哪」的适配警告。
            </p>
          </div>
        </div>

        <p className="sub" style={{ marginTop: 4 }}>
          举例：上面「部署 Next.js 到 Cloudflare 边缘」这条运行，原始 {example.rawSteps.length} 步里有 {pruned} 步是弯路/重试
          （误用 Vercel 部署、漏 nodejs_compat、用了边缘不支持的 fs 模块……），蒸馏后只剩 {example.recipe.length} 步已验证路径。
          别的 agent 复用时，就不用把这些坑再踩一遍。
        </p>
      </div>

      <div className="panel">
        <h2>它和你已知的东西有什么不同</h2>
        <ul className="how-list">
          <li>
            <b>不是运行时（如 Construct Computer）</b>：Construct 卖的是「给每个 agent 一台按需计费的云电脑」，天然绑定其平台。
            现成不提供算力、不跑 agent，而是坐在**任意**运行时之上，把这些电脑跑出来的经验变成可复用资产 —— Construct 让每台电脑更省，现成让这些电脑不必各自重学。
          </li>
          <li>
            <b>不是 memory 层</b>：memory 面向「单个 agent 记住自己的上下文/事实」，是 per-agent 回忆；现成是**跨 agent**，
            单位是「已验证的动作配方」而非原始上下文，还带蒸馏、验证与适配判断。
          </li>
          <li>
            <b>不是人手写的 skill / SOP</b>：现成从**真实运行里自动挖**，配方来自「确实成功过」的证据，而不是理想化的说明文档；
            它也会诚实标注「未验证」的运行（如本 corpus 里那条 Astro 部署）。
          </li>
        </ul>
      </div>

      <div className="panel">
        <div className="honest">
          <h3>诚实边界：什么时候不该盲目复用（真实系统必须内建）</h3>
          <ul>
            <li>
              <b>环境漂移</b>：配方在 A 环境成功，不代表在你的环境照搬能成 —— 所以现成永远附「适配警告」，并对未匹配维度保守处理，不夸大匹配分。
            </li>
            <li>
              <b>非确定性任务</b>：涉及外部服务状态、时间、随机性的步骤，验证信号只代表「当时通过」，复用后仍需按每步验证信号自检。
            </li>
            <li>
              <b>过期做法</b>：依赖版本、平台 API 会变；配方需带时间戳与失效信号，旧配方要能被降权（本 Demo 用相对时间示意）。
            </li>
            <li>
              <b>「未验证」不等于「可信」</b>：没有验证信号的运行只作参考、默认排在后、可一键过滤，绝不冒充已验证。
            </li>
          </ul>
        </div>
      </div>
    </>
  );
}
