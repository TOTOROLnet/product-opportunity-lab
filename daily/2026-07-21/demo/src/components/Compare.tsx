import { useMemo } from 'react';
import { simulate } from '../logic/engine';
import type { Metrics } from '../types';

function pctDelta(base: number, next: number): string {
  if (base === 0) return '—';
  const d = Math.round(((next - base) / base) * 100);
  return (d > 0 ? '+' : '') + d + '%';
}

export default function Compare() {
  const manual: Metrics = useMemo(() => simulate('manual'), []);
  const tl: Metrics = useMemo(() => simulate('trustladder'), []);

  const rows: { label: string; m: number | string; t: number | string; goodDown?: boolean; delta?: string }[] = [
    { label: '需人工审阅（次）', m: manual.humanReviews, t: tl.humanReviews, goodDown: true, delta: pctDelta(manual.humanReviews, tl.humanReviews) },
    { label: '模拟清空队列耗时（分钟）', m: manual.humanMinutes, t: tl.humanMinutes, goodDown: true, delta: pctDelta(manual.humanMinutes, tl.humanMinutes) },
    { label: '自动放行覆盖率', m: `${manual.autoCoveragePct}%`, t: `${tl.autoCoveragePct}%` },
    { label: '自动放行（次）', m: manual.autoHandled, t: tl.autoHandled },
    { label: '升级给人（次）', m: manual.escalated, t: tl.escalated },
    { label: '高风险/不可逆被无人工放行（安全红线，必须=0）', m: manual.highStakesAutoApproved, t: tl.highStakesAutoApproved },
    { label: '可逆错误被自动漏过（会被反转自愈）', m: manual.reversibleSlipped, t: tl.reversibleSlipped },
    { label: '反转降级（次）', m: manual.reversed, t: tl.reversed },
  ];

  const maxRev = Math.max(manual.humanReviews, tl.humanReviews);

  return (
    <div className="compare-page">
      <div className="explainer">
        <h2>同一条脚本，两种策略，实测对比</h2>
        <p>
          左「全人工闸门」＝今天几乎所有 ops agent 产品的默认形态：每一条写动作都要人点。
          右「信任阶梯」＝把你的批准行为编译成可撤销的分级自动放行。数字由
          <code> src/logic/engine.ts </code>在同一条 {manual.total} 条动作的脚本上确定性算出，非编造。
        </p>
      </div>

      <div className="bars">
        <div className="bar-block">
          <span className="bar-name">全人工闸门 · 人工审阅 {manual.humanReviews}</span>
          <div className="bar-track"><div className="bar-fill bar-manual" style={{ width: `${(manual.humanReviews / maxRev) * 100}%` }} /></div>
        </div>
        <div className="bar-block">
          <span className="bar-name">信任阶梯 · 人工审阅 {tl.humanReviews}</span>
          <div className="bar-track"><div className="bar-fill bar-tl" style={{ width: `${(tl.humanReviews / maxRev) * 100}%` }} /></div>
        </div>
        <p className="bar-caption">
          第一个上午就把人工审阅从 <b>{manual.humanReviews}</b> 压到 <b>{tl.humanReviews}</b> 次
          （<b>{pctDelta(manual.humanReviews, tl.humanReviews)}</b>），且被养成的策略会跨天累积。
        </p>
      </div>

      <table className="metrics-table">
        <thead>
          <tr>
            <th>指标</th>
            <th>全人工闸门</th>
            <th>信任阶梯</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label}>
              <td className="mt-label">{r.label}</td>
              <td className="mt-val">{r.m}</td>
              <td className="mt-val mt-tl">
                {r.t}
                {r.delta && r.goodDown && <span className="mt-delta">{r.delta}</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="verdict-grid">
        <div className="verdict verdict-good">
          <h4>✔ 安全红线守住</h4>
          <p>
            两种策略下「高风险/不可逆动作被无人工放行」都是 <b>0</b>——退款大额、信用冻结、法务、批量、生产部署
            <b>始终人工</b>。省力不等于失控。
          </p>
        </div>
        <div className="verdict verdict-honest">
          <h4>⚖ 诚实的代价</h4>
          <p>
            信任阶梯让 <b>1</b> 条<strong>可逆</strong>错误（对刚提争议的客户催收）被自动漏过，
            但它<strong>被反转即时自愈</strong>：该类目当场降 1 阶、暂停自动。用「小而可回退的错误率」换「大幅降载」。
          </p>
        </div>
        <div className="verdict verdict-note">
          <h4>↗ 会复利</h4>
          <p>
            覆盖率 {tl.autoCoveragePct}% 只是<strong>第一天</strong>：养成的策略跨天生效，agent 越多、动作越重复，
            人从「审批瓶颈」里被释放得越多——这正是垂直 ops agent 能否规模化的前置条件。
          </p>
        </div>
      </div>
    </div>
  );
}
