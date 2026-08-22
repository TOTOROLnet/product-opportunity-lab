import {
  aggregate,
  presetState,
  whichPreset,
  honestAccounting,
  ALL_BIG_COST,
  ALL_BIG_LATENCY,
  usd,
  pct,
  RerouteState,
} from '../engine';
import { TRAFFIC, COST } from '../data/traffic';

const h = honestAccounting();
const totalDegrade = TRAFFIC.reduce((s, c) => s + c.degrade, 0);
const totalFallback = TRAFFIC.reduce((s, c) => s + c.fallback, 0);

interface Row {
  name: string;
  cost: number;
  savingsPct: number;
  fallbacks: number;
  degrades: number;
  latency: number;
  color: string;
  note: string;
}

export default function CompareExplain({
  state,
  onGoPlan,
}: {
  state: RerouteState;
  onGoPlan: () => void;
}) {
  const cur = aggregate(presetState('current'));
  const live = aggregate(state);
  const preset = whichPreset(state);
  const liveName =
    preset === 'recommended'
      ? '绕行 · 推荐改道'
      : preset === 'all'
        ? '绕行 · 全部改道（矫枉过正）'
        : preset === 'current'
          ? '绕行 · 当前=现状'
          : '绕行 · 自定义开关';

  const rows: Row[] = [
    {
      name: '全走大模型（安全但贵）',
      cost: ALL_BIG_COST,
      savingsPct: 0,
      fallbacks: 0,
      degrades: 0,
      latency: ALL_BIG_LATENCY,
      color: '#9fb0ae',
      note: '0 回退、0 质量债，但最贵——大多数请求根本不需要大模型。',
    },
    {
      name: '便宜优先 + 回退（现状）',
      cost: cur.cost,
      savingsPct: cur.savingsPct,
      fallbacks: cur.fallbacks,
      degrades: cur.degrades,
      latency: cur.latency,
      color: 'var(--amber)',
      note: `账面最便宜，却藏着 ${cur.fallbacks} 次回退 + ${cur.degrades} 条静默质量债；约 ${pct(h.phantomPct)} 的节省是幻觉。`,
    },
    {
      name: liveName,
      cost: live.cost,
      savingsPct: live.savingsPct,
      fallbacks: live.fallbacks,
      degrades: live.degrades,
      latency: live.latency,
      color: 'var(--teal)',
      note: '把系统性失败的类别改道到大模型、健康类别继续走便宜——用一点账面钱换回可靠与质量。',
    },
  ];
  const maxCost = ALL_BIG_COST;

  return (
    <>
      <div className="card">
        <h2>三方对照</h2>
        <p className="sub">
          同一批 50 条流量，三种路由策略的成本条（越长越贵）与背后的隐藏代价。
          第三条随「改道方案」Tab 的开关<b>实时联动</b>。
        </p>

        {rows.map((r, i) => (
          <div className="cmp" key={i}>
            <div className="lab">
              <span className="nm">{r.name}</span>
              <span>
                {usd(r.cost)} · {r.savingsPct > 0 ? `省 ${pct(r.savingsPct)}` : '基线'}
              </span>
            </div>
            <div className="barout">
              <i style={{ width: pct(r.cost / maxCost), background: r.color }} />
            </div>
            <div className="cmpmeta">
              回退 <b>{r.fallbacks}</b> · 质量债 <b>{r.degrades}</b> · 累计延迟 <b>{r.latency.toFixed(1)}s</b>
              　—　{r.note}
            </div>
          </div>
        ))}

        <div className="disc">
          <b>诚实的取舍：</b>现状「账面省 {pct(cur.savingsPct)}」看起来最漂亮，但它在偷偷透支延迟与质量。
          绕行推荐方案「只省 {pct(aggregate(presetState('recommended')).savingsPct)}」，
          但回退从 {cur.fallbacks} 降到 {aggregate(presetState('recommended')).fallbacks}、
          质量债从 {cur.degrades} 降到 {aggregate(presetState('recommended')).degrades}，
          而且这份节省几乎全部可信。<b>用漂亮的假数字换扎实的真数字。</b>
          <div style={{ marginTop: 8 }}>
            <button className="preset active" onClick={onGoPlan}>
              → 回「改道方案」调开关，这条对照会实时变
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <h3>透明公式（全部数字可复核）</h3>
        <p className="sub">引擎为确定性纯函数，以下常量与公式即全部计算依据，已在开发时用一次性脚本核对。</p>
        <div className="formula">
          <div>
            <span className="m">// 常量（mock，每请求平均）</span>
          </div>
          <div>
            便宜模型 = <span className="c">{usd(COST.cheapUsd)}</span> / {COST.cheapLatS}s　　大模型 ={' '}
            <span className="c">{usd(COST.bigUsd)}</span> / {COST.bigLatS}s
          </div>
          <div>
            回退一次 = 便宜(失败) + 大模型 = <span className="c">{usd(COST.cheapUsd + COST.bigUsd)}</span> /{' '}
            {(COST.cheapLatS + COST.bigLatS).toFixed(1)}s
          </div>
          <div style={{ marginTop: 8 }}>
            <span className="m">// 抽样 50 条：ok=31（便宜干净成功）· 回退=13 · 静默降级=6</span>
          </div>
          <div>
            全走大模型 = 50 × {usd(COST.bigUsd)} = <span className="c">{usd(ALL_BIG_COST)}</span>
          </div>
          <div>
            便宜优先实际 = 37×便宜 + 13×回退 = <span className="c">{usd(cur.cost)}</span>
          </div>
          <div>
            账面节省 = 全大模型 − 便宜优先实际 ={' '}
            <span className="g">{usd(h.naiveSavings)}（{pct(h.naiveSavingsPct)}）</span>
          </div>
          <div style={{ marginTop: 8 }}>
            <span className="m">// 诚实记账：只有「便宜真正干成活」的 31 条才算可信节省</span>
          </div>
          <div>
            可信节省 = 31 × (大−便宜) = 31 × {usd(COST.bigUsd - COST.cheapUsd)} ={' '}
            <span className="g">{usd(h.trustworthySavings)}</span>
          </div>
          <div>
            幻觉 = 账面 − 可信 = <span className="c">{usd(h.phantom)}</span> ={' '}
            <span className="c">{pct(h.phantomPct)}</span> 的账面节省（主要来自静默降级的幻影节省）
          </div>
          <div>
            回退税 = 13 × 便宜 = <span className="c">{usd(h.fallbackTax)}</span>　多等 = 13 × {COST.cheapLatS}s ={' '}
            <span className="c">{h.extraTailLatency.toFixed(1)}s</span>
          </div>
          <div style={{ marginTop: 8 }}>
            <span className="m">// 改道：某类改道 = 整类走大模型（0 回退 0 降级）；守卫：失败率 ≥ 40% 才建议</span>
          </div>
        </div>
      </div>

      <div className="card">
        <h3>为什么这不是照抄</h3>
        <div className="claim">
          <b>vs Router by Ramp / OpenRouter（路由网关）：</b>它们<b>制造</b>路由与 fallback、展示<b>总账美元</b>；
          绕行<b>诊断</b>它们的失败特征，把回退尾延迟与静默质量债从「省钱」里拆出来，并给可执行的改道方案。
          是同一件事的「运营复盘 / 反面」，不路由任何真实流量。
        </div>
        <div className="claim">
          <b>vs 一般 LLM 可观测性（Helicone/Langfuse 类）：</b>它们逐条记录调用；
          绕行做的是<b>面向路由决策的失败特征聚类 + 诚实记账重构 + 改道模拟</b>，是「决策层诊断」而非「日志留存」。
        </div>
        <div className="claim">
          <b>vs「换挡」（模型切换成本预检/裁决）：</b>换挡是「A→B 换不换、每次成功多少钱」的一次性裁决；
          绕行不做换模型决策，而是对既有路由策略做<b>失败特征聚类 + 隐藏税归因 + 按类别改道</b>——
          基因（聚类 + 记账重构）与对象（路由回退，而非模型切换）都不同。也不是 gate/审批/扫描器：它先让隐藏代价可见，改不改交给你。
        </div>

        <div className="disc" style={{ marginTop: 6 }}>
          <b>诚实声明（真实版最难的一环）：</b>本 Demo 的「回退 / 静默降级」标签是 mock 语料预置的。
          现实里，<b>「便宜模型看似成功、实则质量降级」极难自动判定</b>——需要 shadow eval（用大模型/人审对同一请求打分）、
          启发式（截断、JSON 解析失败、拒答检测）或抽样人审。这是产品能否成立的真正命门，绕行不假装已解决，
          只把「一旦你有了这些标签，如何聚类、如何诚实记账、如何按类别改道」讲清楚。
        </div>
      </div>
    </>
  );
}
