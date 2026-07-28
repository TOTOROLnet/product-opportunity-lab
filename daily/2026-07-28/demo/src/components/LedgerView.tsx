import type { Experiment, ReadoutResult, Verdict } from '../types';

interface Props {
  experiments: Experiment[];
  readouts: Record<string, ReadoutResult>;
  onOpen: (id: string) => void;
}

const VERDICT_LABEL: Record<Verdict, { label: string; cls: string }> = {
  effective: { label: '有效', cls: 'v-eff' },
  insufficient: { label: '数据不足', cls: 'v-insuf' },
  placebo: { label: '疑似安慰剂', cls: 'v-plac' },
};

export default function LedgerView({ experiments, readouts, onOpen }: Props) {
  const effective = experiments.filter((e) => readouts[e.id].verdict === 'effective');
  const rejected = experiments.filter((e) => readouts[e.id].verdict !== 'effective');

  return (
    <div className="view">
      <div className="section-head">
        <h2>你的个人证据库</h2>
        <p className="section-sub">
          验己把每次实验的<b>诚实结论</b>沉淀下来——它记录的不是「我试过什么」，
          而是「什么<b>对我</b>真的有用、什么其实是噪声」。这才是越用越值钱的资产。
        </p>
      </div>

      <div className="summary-row">
        <div className="summary-card ok">
          <div className="summary-n">{effective.length}</div>
          <div className="summary-t">被证实对你有效</div>
        </div>
        <div className="summary-card no">
          <div className="summary-n">{rejected.length}</div>
          <div className="summary-t">没证据 / 疑似安慰剂（已止损）</div>
        </div>
        <div className="summary-card neutral">
          <div className="summary-n">{experiments.length}</div>
          <div className="summary-t">累计实验</div>
        </div>
      </div>

      <table className="ledger">
        <thead>
          <tr>
            <th>建议来源</th>
            <th>干预</th>
            <th>主指标</th>
            <th>效应量</th>
            <th>结论</th>
            <th>证据强度</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {experiments.map((e) => {
            const r = readouts[e.id];
            const v = VERDICT_LABEL[r.verdict];
            return (
              <tr key={e.id}>
                <td className="td-src">{e.source}</td>
                <td>{e.intervention}</td>
                <td>{e.metricName}</td>
                <td className="td-num">{r.effectRatio}×</td>
                <td>
                  <span className={`badge ${v.cls}`}>{v.label}</span>
                </td>
                <td className="td-num">
                  <div className="mini-bar">
                    <div className={`mini-fill ${v.cls}`} style={{ width: `${r.evidenceStrength}%` }} />
                  </div>
                  <span className="mini-num">{r.evidenceStrength}</span>
                </td>
                <td>
                  <button className="link-btn" onClick={() => onOpen(e.id)}>
                    看读数 →
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="insight">
        <div className="insight-title">这份档案说明了什么</div>
        <p>
          3 条听起来都很合理的建议里，只有<b>睡前补镁</b>在你身上拿到了较强证据；
          <b>少吃夜宵</b>的「改善」其实是均值回归、<b>冷水澡</b>的精力提升是新奇效应衰减。
          若没有验己，你很可能会同时坚持这三件事——把时间和意志力浪费在两件对你没用的事上。
          <b>验己的价值，就是敢于并且能够替你止损。</b>
        </p>
      </div>
    </div>
  );
}
