import { useState } from 'react';
import type { WorkloadResult } from '../types';
import {
  REMEDIATIONS,
  VERDICT_META,
  amdahlCurve,
  classifyVerdict,
  fmtMultiplier,
  multiplierForHeavyShare,
} from '../logic/engine';

// SVG 绘图区
const X0 = 46, Y0 = 14, X1 = 512, Y1 = 150;
const HEAVY_MAX = 0.8;
const LY_MAX = Math.log10(254);

const xFor = (heavy: number) => X0 + (Math.min(heavy, HEAVY_MAX) / HEAVY_MAX) * (X1 - X0);
const yFor = (mult: number) => Y1 - (Math.log10(Math.max(mult, 1)) / LY_MAX) * (Y1 - Y0);

export function VerdictView({
  result,
  workloadId,
}: {
  result: WorkloadResult;
  workloadId: string;
}) {
  const [heavy, setHeavy] = useState(0.05);
  const liveMult = multiplierForHeavyShare(heavy);
  const liveVerdict = classifyVerdict(liveMult);

  const curve = amdahlCurve(41).filter((p) => p.heavy <= HEAVY_MAX + 1e-9);
  const path = curve.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xFor(p.heavy).toFixed(1)} ${yFor(p.mult).toFixed(1)}`).join(' ');
  const ticks = [1, 4, 20, 60, 254];

  const vmeta = VERDICT_META[result.verdict];
  const rems = REMEDIATIONS[workloadId] ?? [];

  return (
    <div className="view">
      <h3 className="section-title">阿姆达尔滑杆 · 拖动「重活占比」，看 254× 如何塌陷</h3>
      <p className="note">
        这是一个抽象负载：横轴是<b>「WASM 跑不了 / 需 fallback 的重活」占总成本的比例</b>。
        真实倍数 = 1 ÷（native部分/254 + 重活部分×开销）。头条 254× 只在重活占比正好为 0 时成立。
      </p>

      <div className="slider-wrap">
        <input
          type="range"
          min={0}
          max={80}
          step={1}
          value={Math.round(heavy * 100)}
          onChange={(e) => setHeavy(Number(e.target.value) / 100)}
          className="slider"
          aria-label="重活占比"
        />
        <div className="slider-readout">
          <div>
            重活占比 <b>{Math.round(heavy * 100)}%</b>
          </div>
          <div className="slider-vs">
            <span className="struck dim">254×</span>
            <span className="big-arrow">→</span>
            <span className={`live-mult ${VERDICT_META[liveVerdict].tone}`}>
              {fmtMultiplier(liveMult)}
            </span>
          </div>
        </div>
      </div>

      <svg className="curve" viewBox={`0 0 ${X1 + 16} ${Y1 + 26}`}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={X0} y1={yFor(t)} x2={X1} y2={yFor(t)} className="grid" />
            <text x={X0 - 6} y={yFor(t) + 3} className="axis-lab" textAnchor="end">
              {t}×
            </text>
          </g>
        ))}
        {[0, 20, 40, 60, 80].map((p) => (
          <text key={p} x={xFor(p / 100)} y={Y1 + 18} className="axis-lab" textAnchor="middle">
            {p}%
          </text>
        ))}
        <path d={path} className="curve-line" />
        <line x1={xFor(heavy)} y1={Y0} x2={xFor(heavy)} y2={Y1} className="marker-line" />
        <circle cx={xFor(heavy)} cy={yFor(liveMult)} r={5} className="marker-dot" />
      </svg>

      <p className="note callout">
        只要 <b>5%</b> 的负载是重活，254× 就塌成 <b>~16×</b>；到 <b>20%</b> 只剩 <b>~4×</b>。
        这就是为什么必须用<b>你自己的负载</b>算账，而不是照搬厂商头条。
      </p>

      <h3 className="section-title">出厂判定 · 当前负载「{workloadDisplay(workloadId)}」</h3>
      <div className={`verdict-card ${vmeta.tone}`}>
        <div className="verdict-top">
          <div className="verdict-label">{vmeta.label}</div>
          <div className="verdict-mult">{fmtMultiplier(result.honestMultiplier)}</div>
        </div>
        <div className="verdict-headline">{vmeta.headline}</div>
        <div className="verdict-hint">{vmeta.hint}</div>
        <ol className="rem-list">
          {rems.map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ol>
      </div>

      <div className="disclaimer">
        <b>诚实声明：</b>本工具是<b>方法论演示 + mock 负载</b>，不是精确报价。真实世界的兼容判定
        （WASI 支持面 / syscall 白名单 / JIT 差异）与成本模型在持续变化；产品化需接入真实 trace 采集
        与持续维护的兼容知识库（本 Demo 不做）。倍数由确定性可解释公式算出，用于说明「fallback 尾巴
        设定成本地板」这一结构性事实——不接任何真实运行时 / 外部 API / 后端。
      </div>
    </div>
  );
}

function workloadDisplay(id: string): string {
  return (
    {
      coding: '编码代理',
      data: '数据分析代理',
      scraping: '爬取/抓取代理',
      media: '媒体处理代理',
    } as Record<string, string>
  )[id] ?? id;
}
