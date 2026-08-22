import { honestAccounting, usd, pct, pct1, scaledUsdPerDay, recommendReroute } from '../engine';
import { TRAFFIC, COST, TrafficCategory } from '../data/traffic';

const h = honestAccounting();

// 非健康类别 = 失败特征簇；按「命中失败请求数」从多到少排序。
const clusters = TRAFFIC.filter((c) => c.kind !== 'healthy').sort(
  (a, b) => b.fallback + b.degrade - (a.fallback + a.degrade),
);
const healthy = TRAFFIC.filter((c) => c.kind === 'healthy');
const maxFail = Math.max(...clusters.map((c) => c.fallback + c.degrade));

function ClusterCard({ c }: { c: TrafficCategory }) {
  const fails = c.fallback + c.degrade;
  const isSilent = c.kind === 'silent';
  const rec = recommendReroute(c);
  const extraTail = c.fallback * COST.cheapLatS;
  const phantom = c.degrade * (COST.bigUsd - COST.cheapUsd);
  const wasted = c.fallback * COST.cheapUsd;
  return (
    <div className={'cluster ' + c.kind}>
      <div className="chead">
        <span className="cico">{c.icon}</span>
        <span className="cname">{c.name}</span>
        <span className={'badge ' + c.kind}>{isSilent ? '静默降级' : '回退'}</span>
        {rec && <span className="badge rec">建议改道</span>}
        <span className="sig">· {c.signature}</span>
      </div>

      <div className="cmeta">
        <span>
          命中失败 <b>{fails}</b>/{c.volume} 条（失败率 {pct(fails / c.volume)}）
        </span>
        {c.fallback > 0 && (
          <span>
            回退 <b>{c.fallback}</b> 次
          </span>
        )}
        {c.degrade > 0 && (
          <span>
            静默降级 <b>{c.degrade}</b> 条
          </span>
        )}
      </div>

      <div className="sevbar">
        <i
          style={{
            width: pct(fails / maxFail),
            background: isSilent ? 'var(--red)' : 'var(--amber)',
          }}
        />
      </div>

      {isSilent ? (
        <div className="cnote">
          ⚠️ 仪表盘把这 {c.degrade} 条算作「省钱成功」，实际输出已悄悄变差——
          幻影节省约 {usd(phantom)}，且没人知道质量在下滑。
        </div>
      ) : (
        <div className="cnote amber">
          回退 = 便宜调用先失败再打大模型：白花 {usd(wasted)}、每次多等约 {COST.cheapLatS}s
          （本簇共多等 {extraTail.toFixed(1)}s）。账面仍记「路由到便宜模型」。
        </div>
      )}

      <details className="exp">
        <summary>看示例请求（{c.examples.length}）</summary>
        <ul>
          {c.examples.map((e, i) => (
            <li key={i}>{e}</li>
          ))}
        </ul>
      </details>
    </div>
  );
}

export default function FallbackMap({ onGoPlan }: { onGoPlan: () => void }) {
  return (
    <>
      <div className="banner">
        <div className="big">
          账面省 <span className="good">{pct(h.naiveSavingsPct)}</span>
          <span className="m">（{usd(h.naiveSavings)}）</span> · 其中约{' '}
          <span className="bad">{pct(h.phantomPct)}</span> 是幻觉
        </div>
        <div className="bsub">
          「便宜模型优先 + 自动 fallback」的网关，用单一美元维度掩盖了两笔隐藏账：
          回退税（{h.fallbackTax > 0 ? usd(h.fallbackTax) : '—'} + 多等 {h.extraTailLatency.toFixed(1)}s）
          与静默质量债（{TRAFFIC.reduce((s, c) => s + c.degrade, 0)} 条输出悄悄变差）。
          真正可信的节省只有 {usd(h.trustworthySavings)}。
        </div>
      </div>

      <div className="card">
        <h2>现状总账（抽样 50 条请求）</h2>
        <p className="sub">
          同一批流量，如果全走大模型 vs 现在的「便宜优先 + 回退」策略。
        </p>
        <div className="flowrow">
          <span className="chip big">全走大模型 {usd(h.allBigCost)}</span>
          <span className="arrow">→</span>
          <span className="chip cheap">便宜优先实际 {usd(h.currentCost)}</span>
          <span className="arrow">＝</span>
          <span className="chip">账面省 {pct(h.naiveSavingsPct)}</span>
          <span className="sig">（按 100 万请求/天估算 ≈ 省 {scaledUsdPerDay(h.naiveSavings)}/天）</span>
        </div>

        <div className="stats" style={{ marginTop: 16 }}>
          <div className="stat good">
            <div className="k">✅ 可信节省</div>
            <div className="v">{usd(h.trustworthySavings)}</div>
            <div className="vsub">只算便宜模型真正干成的活</div>
          </div>
          <div className="stat red">
            <div className="k">🫧 幻觉节省</div>
            <div className="v">{usd(h.phantom)}</div>
            <div className="vsub">占账面节省的 {pct1(h.phantomPct)}</div>
          </div>
          <div className="stat amber">
            <div className="k">💸 回退税</div>
            <div className="v">{usd(h.fallbackTax)}</div>
            <div className="vsub">{TRAFFIC.reduce((s, c) => s + c.fallback, 0)} 次回退白花的便宜调用</div>
          </div>
          <div className="stat amber">
            <div className="k">⏱️ 多出的尾延迟</div>
            <div className="v">{h.extraTailLatency.toFixed(1)}s</div>
            <div className="vsub">回退比直接走大模型多等</div>
          </div>
        </div>
      </div>

      <div className="card">
        <h2>失败特征聚类</h2>
        <p className="sub">
          把回退与静默降级的请求按<b>失败特征</b>聚成簇——这是账面数字里看不见、却在系统性发生的问题。
          <span style={{ color: 'var(--red)' }}>红色 = 静默降级（最危险：不报错、不回退、照样记省钱）</span>，
          <span style={{ color: 'var(--amber)' }}>黄色 = 回退（可见但被误记账）</span>。
        </p>
        {clusters.map((c) => (
          <ClusterCard key={c.id} c={c} />
        ))}

        {healthy.map((c) => (
          <div className="cluster healthy" key={c.id}>
            <div className="chead">
              <span className="cico">{c.icon}</span>
              <span className="cname">{c.name}</span>
              <span className="badge healthy">健康</span>
              <span className="sig">· 便宜模型干净完成 {c.ok}/{c.volume} 条</span>
            </div>
            <div className="cnote green">
              ✅ 这类才是真正在省钱的地方——<b>别动它</b>。绕行的守卫会阻止把它也改道到大模型（那只会白花钱）。
            </div>
          </div>
        ))}

        <div style={{ marginTop: 6 }}>
          <button className="preset active" onClick={onGoPlan}>
            → 去「改道方案」把系统性失败的簇改道
          </button>
        </div>
      </div>
    </>
  );
}
