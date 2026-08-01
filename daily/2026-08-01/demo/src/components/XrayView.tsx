import type { WorkloadResult } from '../types';
import { fmtMultiplier, fmtPct } from '../logic/engine';
import { Stat, TierBadge } from './shared';

export function XrayView({ result }: { result: WorkloadResult }) {
  const { families } = result;
  return (
    <div className="view">
      <div className="hero">
        <div className="hero-vs">
          <div className="hero-cell headline">
            <div className="hero-cap">厂商头条</div>
            <div className="hero-num struck">254×</div>
            <div className="hero-cap dim">「冷启动 92× / 内存 47× / 成本 254×」</div>
          </div>
          <div className="hero-arrow">→ 你的负载里</div>
          <div className="hero-cell honest">
            <div className="hero-cap">你的真实倍数</div>
            <div className="hero-num accent">{fmtMultiplier(result.honestMultiplier)}</div>
            <div className="hero-cap dim">按你这套工具的成本加权算出</div>
          </div>
        </div>
      </div>

      <div className="stat-row">
        <Stat
          label="native 成本占比"
          value={fmtPct(result.nativeCostShare)}
          sub="能吃到 254× 红利的成本份额"
        />
        <Stat
          label="fallback 调用占比"
          value={fmtPct(result.fallbackCallShare)}
          sub="掉进真沙箱 / 跑不了的调用"
        />
        <Stat
          label="每日调用总数"
          value={result.totalCalls.toLocaleString()}
          sub="本负载 mock 画像"
        />
      </div>

      <p className="note">
        注意：真实倍数由 <b>成本加权</b>后的 fallback 尾巴决定，而不是「有多少种工具兼容」。
        哪怕 native 成本占比很高，只要有一小撮高成本调用掉进真沙箱，254× 就被拉下来——这是一次
        <b>阿姆达尔式</b>的成本地板（见「阿姆达尔滑杆」页）。
      </p>

      <h3 className="section-title">兼容 X 光 · 每个工具在 WASM 运行时里的命运</h3>
      <div className="xray-table">
        <div className="xray-head">
          <div>工具族</div>
          <div>类别</div>
          <div className="num">调用/日</div>
          <div className="num">单位成本</div>
          <div>兼容分层</div>
          <div>为什么</div>
        </div>
        {families.map((f) => (
          <div className="xray-row" key={f.name}>
            <div className="tool-name">{f.name}</div>
            <div className="dim">{f.category}</div>
            <div className="num">{f.calls.toLocaleString()}</div>
            <div className="num">{f.unitCost.toFixed(1)}</div>
            <div>
              <TierBadge tier={f.tier} />
            </div>
            <div className="reason">{f.reason}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
