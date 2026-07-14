import { useEffect, useRef, useState } from 'react';
import type { PlanResult, Scenario } from '../types';
import { usd, VerdictBadge } from './shared';

interface Props {
  scenario: Scenario;
  plan: PlanResult;
  onGoReceipt: () => void;
  onBack: () => void;
}

export default function CompareView({ scenario, plan, onGoReceipt, onBack }: Props) {
  const timeline = plan.greedyCalls; // 全量分类记录（贪婪按此顺序一把梭）
  const total = timeline.length;
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timer = useRef<number | null>(null);

  // 场景 / 参数变化（plan 重算）时重置播放。
  useEffect(() => {
    setStep(0);
    setPlaying(false);
  }, [plan]);

  useEffect(() => {
    if (!playing) return;
    if (step >= total) {
      setPlaying(false);
      return;
    }
    timer.current = window.setTimeout(() => setStep((s) => Math.min(s + 1, total)), 700);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [playing, step, total]);

  const revealed = timeline.slice(0, step);
  const greedyRunning = revealed.reduce((s, r) => s + r.source.priceUSD, 0);
  const worthwhileRunning = revealed
    .filter((r) => r.verdict === 'worth')
    .reduce((s, r) => s + r.source.priceUSD, 0);
  const worthwhileShown = revealed.filter((r) => r.verdict === 'worth');
  const done = step >= total;

  return (
    <div className="panel">
      <h2>对比运行 · {scenario.title}</h2>
      <p className="sub">
        同一个 agent、同一套价值排序——唯一区别是<strong>值当会在够用时停手、并跳过零收益的付费</strong>，贪婪则一把梭全买。逐步播放看每一步的取舍。
      </p>

      <div className="playbar">
        <button className="btn ghost" onClick={() => setPlaying((p) => !p)} disabled={done}>
          {playing ? '⏸ 暂停' : '▶ 逐步播放'}
        </button>
        <button
          className="btn ghost"
          onClick={() => {
            setPlaying(false);
            setStep((s) => Math.min(s + 1, total));
          }}
          disabled={done}
        >
          下一步
        </button>
        <button
          className="btn ghost"
          onClick={() => {
            setPlaying(false);
            setStep(total);
          }}
        >
          跑完
        </button>
        <button
          className="btn ghost"
          onClick={() => {
            setPlaying(false);
            setStep(0);
          }}
        >
          重置
        </button>
        <span className="step-pill">
          步骤 {step} / {total}
        </span>
      </div>

      <div className="compare">
        {/* 贪婪基线 */}
        <div className="lane greedy">
          <h3>贪婪 agent（BEFORE）</h3>
          <p className="lane-sub">能查就查、一把梭调用所有付费源</p>
          <div className="meter">
            <span className="big money">{usd(greedyRunning)}</span>
            <span className="label">{revealed.length} 次调用</span>
          </div>
          <ul className="calls">
            {revealed.map((r) => (
              <li key={r.source.id} className="call">
                <div className="top">
                  <span className="cname">{r.source.name}</span>
                  <span className="price">{usd(r.source.priceUSD)}</span>
                </div>
                <div className="reason">
                  <VerdictBadge verdict={r.verdict === 'skipped-budget' ? 'worth' : r.verdict} />{' '}
                  {r.coveredNeeds.length ? `覆盖 ${r.coveredNeeds.join('、')}` : '无有效覆盖'}
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* 值当 */}
        <div className="lane worthwhile">
          <h3>值当治理（AFTER）</h3>
          <p className="lane-sub">最便宜且够用 · 去重 · 够用即止</p>
          <div className="meter">
            <span className="big money">{usd(worthwhileRunning)}</span>
            <span className="label">{worthwhileShown.length} 次调用</span>
          </div>
          <ul className="calls">
            {revealed.map((r) => {
              const skipped = r.verdict !== 'worth';
              return (
                <li key={r.source.id} className={`call ${skipped ? 'skip' : ''}`}>
                  <div className="top">
                    <span className="cname">
                      {skipped ? '跳过：' : ''}
                      {r.source.name}
                    </span>
                    <span className="price">
                      {skipped ? (
                        <span style={{ color: 'var(--good)' }}>省 {usd(r.source.priceUSD)}</span>
                      ) : (
                        usd(r.source.priceUSD)
                      )}
                    </span>
                  </div>
                  <div className="reason">
                    <VerdictBadge verdict={r.verdict} /> {r.reason}
                  </div>
                </li>
              );
            })}
          </ul>
          {done && <div className="stopline">■ 停手：{plan.stopReason}</div>}
        </div>
      </div>

      <div className="btn-row">
        <button className="btn ghost" onClick={onBack}>
          ← 改参数
        </button>
        <button className="btn primary" onClick={onGoReceipt}>
          查看对账收据 →
        </button>
      </div>
    </div>
  );
}
