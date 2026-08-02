// 逐项复盘 —— 指标对照表 + 每成功任务成本堆叠柱（输入/输出分解）。
import { analyze, effInput, fmtDelta, fmtPct, fmtTok, fmtUSD } from '../logic/engine';
import type { Workload } from '../types';
import { Card, VERDICT_META } from './shared';

interface Row {
  label: string;
  a: string;
  b: string;
  /** 变化方向标签（可选） */
  delta?: string;
  /** 该行是否是「翻转关键行」 */
  flip?: boolean;
}

export default function LedgerView({ workload }: { workload: Workload }) {
  const w = workload;
  const a = analyze(w);
  const meta = VERDICT_META[a.verdict];

  const rows: Row[] = [
    {
      label: '表面输出单价（$/M）',
      a: `$${w.A.price.output.toFixed(2)}`,
      b: `$${w.B.price.output.toFixed(2)}`,
      delta: fmtDelta(w.B.price.output / w.A.price.output),
    },
    {
      label: '有效输入单价（计入缓存命中）',
      a: `$${effInput(w.A.price, w.A.cacheHit).toFixed(3)}`,
      b: `$${effInput(w.B.price, w.B.cacheHit).toFixed(3)}`,
      delta: fmtDelta(effInput(w.B.price, w.B.cacheHit) / effInput(w.A.price, w.A.cacheHit)),
    },
    {
      label: '缓存命中率',
      a: fmtPct(w.A.cacheHit),
      b: fmtPct(w.B.cacheHit),
    },
    {
      label: '平均步数（相对）',
      a: '1.00×',
      b: `${w.B.stepMult.toFixed(2)}×`,
    },
    {
      label: '每任务输入 token',
      a: fmtTok(a.A.inTok),
      b: fmtTok(a.B.inTok),
    },
    {
      label: '每任务输出 token',
      a: fmtTok(a.A.outTok),
      b: fmtTok(a.B.outTok),
    },
    {
      label: '每任务成本',
      a: fmtUSD(a.A.costPerTask),
      b: fmtUSD(a.B.costPerTask),
      delta: fmtDelta(a.B.costPerTask / a.A.costPerTask),
    },
    {
      label: '成功率',
      a: fmtPct(w.A.success),
      b: fmtPct(w.B.success),
      delta: `${a.successDelta >= 0 ? '+' : ''}${(a.successDelta * 100).toFixed(0)}pt`,
    },
    {
      label: '每成功任务成本 = 每任务成本 ÷ 成功率',
      a: fmtUSD(a.cpsA),
      b: fmtUSD(a.cpsB),
      delta: fmtDelta(a.costRatio),
      flip: true,
    },
  ];

  // 堆叠柱：以两者中较大的每成功任务成本为满格
  const cpsInA = a.A.costIn / w.A.success;
  const cpsOutA = a.A.costOut / w.A.success;
  const cpsInB = a.B.costIn / w.B.success;
  const cpsOutB = a.B.costOut / w.B.success;
  const maxCps = Math.max(a.cpsA, a.cpsB);

  return (
    <div className="view">
      <p className="scene">
        {w.name} · {w.scene}
      </p>

      <div className="ledger-grid">
        <Card>
          <div className="mini-title">指标逐项对照</div>
          <table className="ledger-table">
            <thead>
              <tr>
                <th>指标</th>
                <th>{w.A.name}</th>
                <th>{w.B.name}</th>
                <th>变化</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.label} className={r.flip ? 'flip-row' : undefined}>
                  <td className="rl">{r.label}</td>
                  <td className="rv">{r.a}</td>
                  <td className="rv">{r.b}</td>
                  <td
                    className="rd"
                    style={
                      r.delta && r.delta.includes('+')
                        ? { color: '#ff6b6b' }
                        : r.delta && r.delta.includes('−')
                          ? { color: '#38d39f' }
                          : undefined
                    }
                  >
                    {r.delta ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="ledger-note">
            关键翻转在最后一行：<strong>每任务成本</strong>几乎总是更便宜（token 更便宜），但除以
            <strong>成功率</strong>后得到的<strong>每成功任务成本</strong>才是你真正要付的钱。
          </div>
        </Card>

        <Card>
          <div className="mini-title">每成功任务成本拆解（输入 / 输出）</div>
          <div className="bars">
            <CostBar
              name={w.A.name}
              cin={cpsInA}
              cout={cpsOutA}
              total={a.cpsA}
              max={maxCps}
              color="#8b97b8"
            />
            <CostBar
              name={w.B.name}
              cin={cpsInB}
              cout={cpsOutB}
              total={a.cpsB}
              max={maxCps}
              color={meta.color}
            />
          </div>
          <div className="legend">
            <span>
              <i style={{ background: 'rgba(255,255,255,0.28)' }} /> 输入
            </span>
            <span>
              <i style={{ background: 'currentColor' }} /> 输出
            </span>
          </div>
          <div className="vanity-vs-honest">
            <div>
              <span className="vv-label">厂商话术（单价）</span>
              <span className="vv-val strike">{fmtDelta(a.vanityRatio)}</span>
            </div>
            <div className="vv-arrow">→</div>
            <div>
              <span className="vv-label">诚实（每成功任务）</span>
              <span className="vv-val" style={{ color: meta.color }}>
                {fmtDelta(a.costRatio)}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function CostBar({
  name,
  cin,
  cout,
  total,
  max,
  color,
}: {
  name: string;
  cin: number;
  cout: number;
  total: number;
  max: number;
  color: string;
}) {
  const wIn = (cin / max) * 100;
  const wOut = (cout / max) * 100;
  return (
    <div className="cost-bar-row" style={{ color }}>
      <div className="cb-name">{name}</div>
      <div className="cb-track">
        <div className="cb-in" style={{ width: `${wIn}%` }} />
        <div className="cb-out" style={{ width: `${wOut}%`, background: color }} />
      </div>
      <div className="cb-total" style={{ color }}>
        {fmtUSD(total)}
      </div>
    </div>
  );
}
