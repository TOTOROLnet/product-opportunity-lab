import { useState } from 'react';
import type { EngineResult, Invariant } from '../types';

const INVARIANTS: { id: Invariant; label: string }[] = [
  { id: 'cost-floor', label: '成本红线：叠加折扣后价格 ≥ 成本' },
  { id: 'stack-depth', label: '促销叠加深度 ≤ 2' },
  { id: 'promo-oos', label: '促销不覆盖零库存商品' },
  { id: 'shipping-margin', label: '包邮后毛利 ≥ 0' },
  { id: 'unintended-scope', label: '品类迁移不致意外促销资格' },
];

export default function ClashView({
  full,
  onGoDecide,
}: {
  full: EngineResult;
  onGoDecide: () => void;
}) {
  const [active, setActive] = useState<string | null>(null);
  const countOf = (inv: Invariant) => full.clashes.filter((c) => c.invariant === inv).length;
  const activeClash = full.clashes.find((c) => c.id === active) ?? null;
  const hotMutations = new Set(activeClash?.involvedMutations ?? []);

  return (
    <section className="panel">
      <h2>② 联动风险 —— 整批 dry-run 后的涌现冲突（合流视图）</h2>
      <p className="sub">
        把 12 条变更一起物化成结果状态，逐个 SKU 检查 5 类业务不变量。抓的是「每条各自合法、
        <b> 叠加后才违规</b>」的冲突 —— 这是逐条预览结构上看不到的。
      </p>

      <div className="inv-row">
        {INVARIANTS.map((inv) => {
          const c = countOf(inv.id);
          const bad = c > 0;
          return (
            <div className="inv" key={inv.id}>
              <div className="lab">{inv.label}</div>
              <div className={`st ${bad ? 'bad' : 'ok'}`}>
                <span className={`dot ${bad ? 'bad' : 'ok'}`} />
                {bad ? `${c} 处违反` : '通过'}
              </div>
            </div>
          );
        })}
      </div>

      <div className="banner warn">
        <span className="big">{full.clashes.length} 处联动风险</span>
        <span>
          其中 <b>{full.metrics.highCount} 处高危</b>。全部由「多条各自合法的变更叠加」产生 ——
          点开每处可看到「单看 vs 叠加后」的对比，以及卷入的变更项（点击卡片高亮）。
        </span>
      </div>

      {full.clashes.map((c) => (
        <div
          key={c.id}
          className={`clash sev-${c.severity}`}
          onClick={() => setActive(active === c.id ? null : c.id)}
          style={{ cursor: 'pointer' }}
        >
          <div className="chead">
            <span className={`sev ${c.severity}`}>{c.severity}危</span>
            <span className="inv-name">不变量：{c.invariantLabel}</span>
          </div>
          <div className="headline">{c.headline}</div>
          <div className="ba">
            <div className="cell before">
              <span className="k">逐条看（每条都通过）</span>
              {c.before}
            </div>
            <div className="cell after">
              <span className="k">叠加后（真实后果）</span>
              {c.after}
            </div>
          </div>
          <div className="involved">
            <span className="lbl">卷入的变更：</span>
            {c.involvedMutations.map((m) => (
              <span key={m} className={`mtag ${hotMutations.has(m) ? 'hot' : ''}`}>
                {m}
              </span>
            ))}
          </div>
        </div>
      ))}

      <div className="toolbar" style={{ marginTop: 16 }}>
        <button className="btn primary" onClick={onGoDecide}>
          在计划层处置这些风险 →
        </button>
      </div>
    </section>
  );
}
