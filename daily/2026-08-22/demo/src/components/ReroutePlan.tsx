import {
  aggregate,
  whichPreset,
  recommendReroute,
  failRate,
  rerouteDelta,
  usd,
  pct,
  RerouteState,
  PresetId,
} from '../engine';
import { TRAFFIC } from '../data/traffic';

interface Props {
  state: RerouteState;
  setRerouted: (id: string, val: boolean) => void;
  applyPreset: (p: PresetId) => void;
}

const PRESETS: { id: PresetId; label: string }[] = [
  { id: 'current', label: '现状（全便宜优先）' },
  { id: 'recommended', label: '推荐改道' },
  { id: 'all', label: '全部改道（矫枉过正）' },
];

export default function ReroutePlan({ state, setRerouted, applyPreset }: Props) {
  const agg = aggregate(state);
  const active = whichPreset(state);

  return (
    <>
      <div className="card">
        <h2>改道方案</h2>
        <p className="sub">
          对<b>系统性失败</b>的请求类别「改道」到大模型（跳过便宜模型的先失败再回退）；
          对真正在省钱的健康类别<b>保持便宜</b>。目标不是「多改道」，而是把隐藏税换成
          <b>诚实、可靠</b>的节省。
        </p>

        <div className="presets">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              className={'preset' + (active === p.id ? ' active' : '')}
              onClick={() => applyPreset(p.id)}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="stats" style={{ marginTop: 16 }}>
          <div className="stat teal">
            <div className="k">💵 当前成本</div>
            <div className="v">{usd(agg.cost)}</div>
            <div className="vsub">抽样 50 条</div>
          </div>
          <div className="stat good">
            <div className="k">📉 相对全大模型</div>
            <div className="v">省 {pct(agg.savingsPct)}</div>
            <div className="vsub">这部分节省是否可信见下</div>
          </div>
          <div className="stat amber">
            <div className="k">🔁 回退剩余</div>
            <div className="v">{agg.fallbacks}</div>
            <div className="vsub">越低越少双付/尾延迟</div>
          </div>
          <div className="stat red">
            <div className="k">🫥 质量债剩余</div>
            <div className="v">{agg.degrades}</div>
            <div className="vsub">静默降级请求数</div>
          </div>
          <div className="stat">
            <div className="k">⏱️ 总延迟</div>
            <div className="v">{agg.latency.toFixed(1)}s</div>
            <div className="vsub">50 条累计等待</div>
          </div>
        </div>
      </div>

      <div className="card">
        <h3>按请求类别改道</h3>
        {TRAFFIC.map((c) => {
          const rerouted = !!state[c.id];
          const rec = recommendReroute(c);
          const { extraCost, reliabilityGain } = rerouteDelta(c);
          const fr = failRate(c);

          let meta: JSX.Element;
          if (rerouted) {
            if (rec) {
              meta = (
                <span className="okrec">
                  ✓ 已改道到大模型：消除 {reliabilityGain} 个失败（回退+静默降级），多花 {usd(extraCost)} —— 划算
                </span>
              );
            } else {
              meta = (
                <span className="warn">
                  ⚠ 矫枉过正：多花 {usd(extraCost)}，只消除 {reliabilityGain} 个失败
                  {reliabilityGain === 0 ? '（≈零收益，纯浪费）' : ''}
                </span>
              );
            }
          } else {
            if (rec) {
              meta = (
                <span className="warn">
                  ⚠ 建议改道未采纳：仍有 {c.fallback} 回退 / {c.degrade} 静默降级（失败率 {pct(fr)}）
                </span>
              );
            } else {
              meta = (
                <span>
                  保持便宜：失败率仅 {pct(fr)}，是真正在省钱的类别，别动它
                </span>
              );
            }
          }

          return (
            <div className="rrow" key={c.id}>
              <span className="rname">
                {c.icon} {c.name}
                {rec && <span className="badge rec" style={{ marginLeft: 8 }}>建议改道</span>}
              </span>
              <span className="rmeta">{meta}</span>
              <button
                className={'toggle' + (rerouted ? ' on' : '')}
                onClick={() => setRerouted(c.id, !rerouted)}
                aria-pressed={rerouted}
              >
                {rerouted ? '改道到大模型 ✓' : '保持便宜'}
              </button>
            </div>
          );
        })}

        <div className="disc" style={{ marginTop: 14 }}>
          <b>「别矫枉过正」守卫：</b>绕行只对失败率 ≥ 40% 的类别建议改道。试着把
          <b>短问答</b>也改道到大模型——你会看到成本上升、可靠性零收益。改道不是越多越好，
          而是「把该走大模型的走大模型、能省的继续省」。
        </div>
      </div>
    </>
  );
}
