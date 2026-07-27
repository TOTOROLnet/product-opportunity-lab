import { useMemo, useState } from 'react';
import type { EngineResult, Mutation } from '../types';
import { MUTATIONS, RECOMMENDED_EXCLUDE } from '../data/mutations';
import { ALL_MUTATION_IDS, runEngine } from '../logic/engine';

const KIND_LABEL: Record<Mutation['kind'], string> = {
  promo: '促销',
  price: '改价',
  shipping: '运费',
  inventory: '库存',
  category: '品类',
};

export default function DecisionView({ full }: { full: EngineResult }) {
  const [active, setActive] = useState<Set<string>>(new Set(ALL_MUTATION_IDS));

  const live = useMemo(() => runEngine(active), [active]);
  const excludedCount = ALL_MUTATION_IDS.length - active.size;
  const cleared = live.clashes.length === 0;

  const toggle = (id: string) => {
    setActive((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const applyRecommended = () =>
    setActive(new Set(ALL_MUTATION_IDS.filter((id) => !RECOMMENDED_EXCLUDE.includes(id))));
  const reset = () => setActive(new Set(ALL_MUTATION_IDS));

  const row = (label: string, base: number, cur: number, zeroIsGood = true) => {
    const good = zeroIsGood ? cur === 0 : cur <= base;
    return (
      <tr>
        <td className="metric">{label}</td>
        <td className="bad">{base}</td>
        <td>
          <span className="arrow">→</span>
          <span className={good && cur < base ? 'good' : cur > 0 ? 'bad' : 'good'}>{cur}</span>
        </td>
      </tr>
    );
  };

  return (
    <section className="panel">
      <h2>③ 决策与回滚 —— 在计划层处置，而不是逐条橡皮图章</h2>
      <p className="sub">
        逐条模式下你会把 12 张卡一路点「批准」，却抓不到任何联动风险。计划层只需对少数「卷入风险的关键操作」
        做决策：剔除 / 保留后，引擎实时复算。
      </p>

      <div className="toolbar">
        <button className="btn primary" onClick={applyRecommended}>
          一键应用推荐剔除（{RECOMMENDED_EXCLUDE.join(' · ')}）
        </button>
        <button className="btn ghost" onClick={reset}>
          重置为「照单全批」
        </button>
      </div>

      <div
        className={`banner ${cleared ? 'good' : 'warn'}`}
        style={{ marginTop: 4 }}
      >
        <span className="big">{cleared ? '风险已归零' : `${live.clashes.length} 处未解`}</span>
        <span>
          {cleared ? (
            <>
              当前计划保留 <b>{active.size} 条</b>可安全执行，联动风险 <b>0 处</b>。
              合流把 7 处风险归纳为 <b>{RECOMMENDED_EXCLUDE.length} 个</b>关键决策 ——
              问题多来自「全局 / 一刀切」操作（无条件包邮、全场 VIP 叠加、一刀切迁品类、促销期清零在促库存）。
            </>
          ) : (
            <>
              当前仍有 <b>{live.clashes.length} 处</b>联动风险（高危 {live.metrics.highCount}）。
              勾掉卷入风险的关键操作，或点上方「一键应用推荐剔除」。
            </>
          )}
        </span>
      </div>

      <div className="vcards">
        <div className="vcard">
          <div className={`big ${cleared ? 'good' : 'bad'}`}>{live.clashes.length}</div>
          <div className="cap">当前计划的联动风险</div>
        </div>
        <div className="vcard">
          <div className={`big ${live.metrics.lossSkus.length === 0 ? 'good' : 'bad'}`}>
            {live.metrics.lossSkus.length}
          </div>
          <div className="cap">亏损 / 负毛利在售 SKU</div>
        </div>
        <div className="vcard">
          <div className="big">{excludedCount}</div>
          <div className="cap">已剔除的变更条数</div>
        </div>
        <div className="vcard">
          <div className="big good">{active.size}</div>
          <div className="cap">保留安全执行</div>
        </div>
      </div>

      <h3 style={{ fontSize: 14, margin: '18px 0 8px' }}>照单全批 vs 当前计划</h3>
      <table className="compare">
        <thead>
          <tr>
            <th>指标</th>
            <th>照单全批（12 条）</th>
            <th>当前计划</th>
          </tr>
        </thead>
        <tbody>
          {row('联动风险总数', full.clashes.length, live.clashes.length)}
          {row('高危风险', full.metrics.highCount, live.metrics.highCount)}
          {row('亏损 / 负毛利在售 SKU', full.metrics.lossSkus.length, live.metrics.lossSkus.length)}
          {row('促销指向零库存商品', full.metrics.promoOnOos.length, live.metrics.promoOnOos.length)}
          {row('促销超叠加深度', full.metrics.overStack.length, live.metrics.overStack.length)}
          {row('常规款误入清仓促销', full.metrics.unintendedScope.length, live.metrics.unintendedScope.length)}
          <tr>
            <td className="metric">需人工决策</td>
            <td className="bad">12 张卡逐个点（0 命中风险）</td>
            <td className="good">
              <span className="arrow">→</span>
              {RECOMMENDED_EXCLUDE.length} 个关键决策即归零
            </td>
          </tr>
        </tbody>
      </table>

      <h3 style={{ fontSize: 14, margin: '20px 0 8px' }}>逐条剔除 / 保留（实时复算）</h3>
      <div className="toggle-grid">
        {MUTATIONS.map((m) => {
          const on = active.has(m.id);
          const rec = RECOMMENDED_EXCLUDE.includes(m.id);
          return (
            <div
              key={m.id}
              className={`toggle ${on ? '' : 'excluded'} ${rec ? 'rec' : ''}`}
              onClick={() => toggle(m.id)}
            >
              <span className={`check ${on ? 'on' : ''}`}>{on ? '✓' : ''}</span>
              <span className="mm">{m.id}</span>
              <span className={`mid-badge k-${m.kind}`}>{KIND_LABEL[m.kind]}</span>
              <span style={{ fontSize: 12.5 }}>{m.label}</span>
              {rec && <span className="rectag">建议剔除</span>}
            </div>
          );
        })}
      </div>

      <div className="rollback">
        <b>单一原子回滚点：</b>合流把整批变更作为<b>一个原子事务</b>执行，绑定一个回滚检查点{' '}
        <span className="mono">ckpt://heliu/2026-07-27/plan#{active.size}ops</span>
        。若执行后发现问题，可一键回滚到批次前状态 —— 而不是逐条去撤销
        {full.clashes.length} 处已铺开的连锁改动。（Demo 中回滚点为可视化示意，不做真实写入。）
      </div>
    </section>
  );
}
