import { useMemo, useState } from 'react';
import type { PortfolioMode, SliceAnalysis } from '../types';
import { leverLabel, portfolio, trainingPlanToml } from '../logic/engine';
import { ms, pct1, usd } from '../logic/format';

type After = Extract<PortfolioMode, 'recommended' | 'trainAll'>;

export default function PortfolioView({ analyses }: { analyses: SliceAnalysis[] }) {
  const slices = useMemo(() => analyses.map((a) => a.slice), [analyses]);
  const fr = useMemo(() => portfolio(slices, 'frontier'), [slices]);
  const rec = useMemo(() => portfolio(slices, 'recommended'), [slices]);
  const all = useMemo(() => portfolio(slices, 'trainAll'), [slices]);
  const toml = useMemo(() => trainingPlanToml(slices), [slices]);

  const [after, setAfter] = useState<After>('recommended');
  const A = after === 'recommended' ? rec : all;

  const costMax = Math.max(fr.totalMonthlyUSD, rec.totalMonthlyUSD, all.totalMonthlyUSD);
  const corrMax = Math.max(fr.overallCorrectionRate, rec.overallCorrectionRate, all.overallCorrectionRate);

  const saveVsFrontier = fr.totalMonthlyUSD - rec.totalMonthlyUSD;
  const savePct = saveVsFrontier / fr.totalMonthlyUSD;
  const wastedTraining = all.oneTimeTrainingUSD - rec.oneTimeTrainingUSD;

  return (
    <section className="view">
      <div className="view-head">
        <h2>③ 组合与产出 —— before / after</h2>
        <p>
          把 7 个分片各自的建议汇总成一套方案，与「全跑前沿」对比。核心结论：
          <b>火候建议方案每月省 {usd(saveVsFrontier)}（{pct1(savePct)}），且返工率最低。</b>
        </p>
      </div>

      <div className="ba-toggle">
        <span>after 基准：</span>
        <button className={after === 'recommended' ? 'active' : ''} onClick={() => setAfter('recommended')}>
          按火候建议（3 片训练 + 4 片别训）
        </button>
        <button className={after === 'trainAll' ? 'active bad' : ''} onClick={() => setAfter('trainAll')}>
          跟风：把 7 片全微调
        </button>
      </div>

      <div className="ba-grid">
        <div className="ba-col before">
          <h3>Before · 全跑前沿</h3>
          <div className="ba-metric">
            <span>月成本</span>
            <b>{usd(fr.totalMonthlyUSD)}</b>
            <div className="bar"><div className="bar-fill spend" style={{ width: `${(fr.totalMonthlyUSD / costMax) * 100}%` }} /></div>
          </div>
          <div className="ba-metric">
            <span>加权延迟</span>
            <b>{ms(fr.weightedLatencyMs)}</b>
          </div>
          <div className="ba-metric">
            <span>返工率</span>
            <b>{pct1(fr.overallCorrectionRate)}</b>
            <div className="bar"><div className="bar-fill warn" style={{ width: `${(fr.overallCorrectionRate / corrMax) * 100}%` }} /></div>
          </div>
          <div className="ba-metric">
            <span>一次性训练</span>
            <b>{usd(fr.oneTimeTrainingUSD)}</b>
          </div>
        </div>

        <div className={`ba-col after ${after === 'trainAll' ? 'is-bad' : 'is-good'}`}>
          <h3>After · {after === 'recommended' ? '按火候建议' : '跟风全训'}</h3>
          <div className="ba-metric">
            <span>月成本</span>
            <b>{usd(A.totalMonthlyUSD)}</b>
            <div className="bar"><div className="bar-fill spend" style={{ width: `${(A.totalMonthlyUSD / costMax) * 100}%` }} /></div>
          </div>
          <div className="ba-metric">
            <span>加权延迟</span>
            <b>{ms(A.weightedLatencyMs)}</b>
          </div>
          <div className="ba-metric">
            <span>返工率</span>
            <b className={after === 'trainAll' ? 'txt-bad' : 'txt-go'}>{pct1(A.overallCorrectionRate)}</b>
            <div className="bar"><div className={`bar-fill ${after === 'trainAll' ? 'bad' : 'go'}`} style={{ width: `${(A.overallCorrectionRate / corrMax) * 100}%` }} /></div>
          </div>
          <div className="ba-metric">
            <span>一次性训练</span>
            <b className={after === 'trainAll' ? 'txt-bad' : ''}>{usd(A.oneTimeTrainingUSD)}</b>
          </div>
        </div>
      </div>

      {after === 'trainAll' ? (
        <div className="callout bad">
          <b>「把 7 片全微调」看着账单更省，却是陷阱：</b>
          返工率飙到 <b>{pct1(all.overallCorrectionRate)}</b>（比全前沿 {pct1(fr.overallCorrectionRate)} 还差、比火候建议 {pct1(rec.overallCorrectionRate)} 差得多）——
          在缺知识/歧义/硬推理的片子上，小模型省了 token 却答错更多；还多烧 <b>{usd(wastedTraining)}</b> 训练费
          去养 4 个帮不上忙的小模型，并把「合同风险摘要」这种高风险硬推理交给小模型（不可接受）。
          <b>省小钱，担大险。</b>
        </div>
      ) : (
        <div className="callout go">
          <b>火候建议 = 成本降 {pct1(savePct)} 的同时把返工率降到全场最低 {pct1(rec.overallCorrectionRate)}。</b>
          只训真正稳定、高量、正确但太贵的 2 片（蒸馏）+ 1 片语气微调；其余 4 片用 RAG / prompt / 路由 / 保持前沿，
          省下 {usd(wastedTraining)} 训练费和 4 个小模型的长期运维债。
        </div>
      )}

      <div className="plan-grid">
        <div className="panel">
          <div className="panel-head"><span className="panel-title">每片处置一览</span></div>
          <table className="plan-table">
            <thead>
              <tr><th>分片</th><th>杠杆</th><th>建议月成本</th><th>裁决</th></tr>
            </thead>
            <tbody>
              {analyses.map((a, i) => (
                <tr key={a.slice.id} className={a.isTraining ? 'train-row' : ''}>
                  <td>{a.slice.name}</td>
                  <td>{leverLabel(a.lever)}</td>
                  <td>{usd(rec.perSlice[i].monthlyUSD)}</td>
                  <td>
                    <span className={`tag ${a.isTraining ? (a.verdict === 'GO' ? 'go' : 'warn') : 'muted'}`}>
                      {a.isTraining ? (a.verdict === 'GO' ? '训练' : '训练·补数据') : '别训'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="panel">
          <div className="panel-head">
            <span className="panel-title">训练清单（交给 Freesolo 这类平台）</span>
            <span className="pill muted">仅含该训的片子</span>
          </div>
          <pre className="toml">{toml}</pre>
          <p className="hint-line">
            这份清单正是喂给「一键训练平台」的输入——火候把最容易翻车的一步（决策 + 备数据）补上，
            与训练执行层互补，而非替代。
          </p>
        </div>
      </div>
    </section>
  );
}
