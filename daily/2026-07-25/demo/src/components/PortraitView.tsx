import { useMemo } from 'react';
import type { FailureKind, SliceAnalysis } from '../types';
import { failureLabel, leverLabel } from '../logic/engine';
import { num, pct1, usd } from '../logic/format';

const FAILURE_ORDER: FailureKind[] = [
  'expensiveSlow',
  'missingKnowledge',
  'formatDrift',
  'ambiguous',
  'reasoning',
];

const FAILURE_COLOR: Record<FailureKind, string> = {
  expensiveSlow: '#f2a33c',
  missingKnowledge: '#4f9df2',
  formatDrift: '#a67bf0',
  ambiguous: '#48c2b0',
  reasoning: '#ef6f6f',
};

const LEVER_TONE: Record<string, string> = {
  DISTILL: 'go',
  FINETUNE: 'warn',
  RAG: 'muted',
  PROMPT: 'muted',
  ROUTING: 'muted',
  KEEP_FRONTIER: 'muted',
};

function monthlySpendUSD(a: SliceAnalysis): number {
  const s = a.slice;
  return ((s.monthlyCalls * (s.avgInTok + s.avgOutTok)) / 1_000_000) * s.frontierCostPer1M * (1 + s.correctionRate);
}

export default function PortraitView({
  analyses,
  onPick,
}: {
  analyses: SliceAnalysis[];
  onPick: (id: string) => void;
}) {
  const spends = useMemo(() => analyses.map(monthlySpendUSD), [analyses]);
  const maxSpend = Math.max(...spends);
  const totalSpend = spends.reduce((a, b) => a + b, 0);

  return (
    <section className="view">
      <div className="view-head">
        <h2>① 用量画像 —— 你的真实调用轨迹</h2>
        <p>
          这是从你已有的前沿模型用量里提取的 7 个任务分片（mock）。先看清 <b>钱和错误集中在哪</b>，
          再谈要不要训练。当前全部跑前沿模型，每月约 <b>{usd(totalSpend)}</b>（含返工浪费）。
        </p>
      </div>

      <div className="card-grid">
        {analyses.map((a, i) => {
          const s = a.slice;
          const spend = spends[i];
          const spendW = (spend / maxSpend) * 100;
          return (
            <button key={s.id} className="slice-card" onClick={() => onPick(s.id)}>
              <div className="sc-top">
                <span className="sc-name">{s.name}</span>
                <span className={`chip ${LEVER_TONE[a.lever]}`}>{leverLabel(a.lever)}</span>
              </div>
              <p className="sc-desc">{s.desc}</p>

              <div className="sc-spend">
                <div className="sc-spend-row">
                  <span>月成本</span>
                  <b>{usd(spend)}</b>
                </div>
                <div className="bar">
                  <div className="bar-fill spend" style={{ width: `${spendW}%` }} />
                </div>
              </div>

              <div className="sc-stats">
                <div>
                  <span className="k">月调用</span>
                  <span className="v">{num(s.monthlyCalls)}</span>
                </div>
                <div>
                  <span className="k">返工率</span>
                  <span className="v">{pct1(s.correctionRate)}</span>
                </div>
                <div>
                  <span className="k">稳定性</span>
                  <span className="v">{s.stability.toFixed(2)}</span>
                </div>
                <div>
                  <span className="k">gold 样本</span>
                  <span className="v">{num(s.goldExamples)}</span>
                </div>
              </div>

              <div className="sc-fail">
                <span className="sc-fail-label">失败信号构成</span>
                <div className="stack">
                  {FAILURE_ORDER.map((k) => {
                    const w = s.failureMix[k] * 100;
                    if (w <= 0) return null;
                    return (
                      <span
                        key={k}
                        className="stack-seg"
                        style={{ width: `${w}%`, background: FAILURE_COLOR[k] }}
                        title={`${failureLabel(k)} ${Math.round(w)}%`}
                      />
                    );
                  })}
                </div>
                <span className="sc-dominant">
                  主导：{failureLabel(a.dominant)}（{Math.round(s.failureMix[a.dominant] * 100)}%）
                </span>
              </div>

              <span className="sc-cta">点击 → 决策台看火候怎么判 →</span>
            </button>
          );
        })}
      </div>

      <div className="legend">
        {FAILURE_ORDER.map((k) => (
          <span key={k} className="legend-item">
            <i style={{ background: FAILURE_COLOR[k] }} />
            {failureLabel(k)}
          </span>
        ))}
      </div>
    </section>
  );
}
