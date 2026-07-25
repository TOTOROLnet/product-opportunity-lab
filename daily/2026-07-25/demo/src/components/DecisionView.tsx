import { useState } from 'react';
import type { SliceAnalysis, Verdict } from '../types';
import { leverLabel } from '../logic/engine';
import { ms, num, pct, usd } from '../logic/format';

const VERDICT_META: Record<Verdict, { tone: string; label: string }> = {
  GO: { tone: 'go', label: '建议训练 GO' },
  NEED_DATA: { tone: 'warn', label: '值得训 · 先补数据' },
  NOT_WORTH: { tone: 'bad', label: '不建议训练' },
  NO_TRAIN: { tone: 'muted', label: '训练不是这片的杠杆' },
};

function Meter({ label, value }: { label: string; value: number }) {
  return (
    <div className="meter">
      <div className="meter-top">
        <span>{label}</span>
        <b>{pct(value)}</b>
      </div>
      <div className="bar">
        <div className="bar-fill" style={{ width: `${Math.round(value * 100)}%` }} />
      </div>
    </div>
  );
}

export default function DecisionView({
  analyses,
  selectedId,
  onSelect,
}: {
  analyses: SliceAnalysis[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const [trainOnly, setTrainOnly] = useState(false);
  const visible = trainOnly ? analyses.filter((a) => a.isTraining) : analyses;
  const current = analyses.find((a) => a.slice.id === selectedId) ?? analyses[0];
  const vm = VERDICT_META[current.verdict];
  const tb = current.trainability;
  const ds = current.dataset;
  const roi = current.roi;

  return (
    <section className="view">
      <div className="view-head">
        <h2>② 决策台 —— 火候怎么判</h2>
        <p>
          选一个分片，看火候基于主导失败信号给出的 <b>杠杆建议</b>、可训练性评分、数据集预检与 ROI。
          注意：多数分片的结论是「别训」——把预算留给真正值得的一两片。
        </p>
      </div>

      <div className="selector-row">
        <div className="chips">
          {visible.map((a) => (
            <button
              key={a.slice.id}
              className={`sel-chip ${a.slice.id === current.slice.id ? 'active' : ''} ${
                a.isTraining ? 'train' : ''
              }`}
              onClick={() => onSelect(a.slice.id)}
            >
              {a.slice.name}
              {a.isTraining && <i className="dot" />}
            </button>
          ))}
        </div>
        <label className="toggle">
          <input
            type="checkbox"
            checked={trainOnly}
            onChange={(e) => setTrainOnly(e.target.checked)}
          />
          只看建议训练的片子
        </label>
      </div>

      <div className="decision-grid">
        <div className="panel lever-panel">
          <div className="panel-head">
            <span className="panel-title">杠杆建议</span>
            <span className={`verdict ${vm.tone}`}>{vm.label}</span>
          </div>
          <div className="lever-big">{leverLabel(current.lever)}</div>
          <p className="lever-reason">{current.reason}</p>
          <p className="verdict-note">{current.verdictNote}</p>
        </div>

        <div className="panel">
          <div className="panel-head">
            <span className="panel-title">可训练性评分</span>
            <span className={`score-big ${tb.score >= 60 ? 'go' : 'muted'}`}>{tb.score}<i>/100</i></span>
          </div>
          {!current.isTraining && (
            <p className="hint-line">此片建议「{leverLabel(current.lever)}」，训练不是杠杆——评分仅供参考。</p>
          )}
          <Meter label="调用量" value={tb.volume} />
          <Meter label="成本可省幅度" value={tb.saving} />
          <Meter label="稳定性" value={tb.stability} />
          <Meter label="数据充足度" value={tb.data} />
        </div>

        <div className="panel">
          <div className="panel-head">
            <span className="panel-title">数据集预检</span>
            <span className={`pill ${ds.enough ? 'go' : 'warn'}`}>
              {ds.enough ? '数据充足' : `还差 ${num(ds.gap)} 条`}
            </span>
          </div>
          <div className="ds-flow">
            <div className="ds-node">
              <b>{num(ds.gold)}</b>
              <span>gold 样本</span>
            </div>
            <div className="ds-minus">
              − 重复 {num(ds.removedDup)}<br />− PII {num(ds.removedPii)}<br />− 泄漏 {num(ds.removedLeak)}
            </div>
            <div className="ds-node result">
              <b>{num(ds.usable)}</b>
              <span>清洗后可用</span>
            </div>
            <div className="ds-req">
              所需 ≥ {num(ds.required)}
              <br />
              <span className={ds.enough ? 'ok' : 'no'}>{ds.enough ? '✓ 达标' : '✗ 不足'}</span>
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <span className="panel-title">ROI 投影</span>
          </div>
          {roi ? (
            <div className="roi-grid">
              <div className="roi-cell">
                <span className="k">每月省</span>
                <b className="v go">{usd(roi.monthlySavingsUSD)}</b>
                <span className="s">{pct(roi.savingsPct)} ↓（含返工）</span>
              </div>
              <div className="roi-cell">
                <span className="k">延迟</span>
                <b className="v">{ms(roi.frontierLatencyMs)} → {ms(roi.newLatencyMs)}</b>
                <span className="s">{pct(roi.latencyDropPct)} ↓</span>
              </div>
              <div className="roi-cell">
                <span className="k">质量保持</span>
                <b className="v">{pct(roi.qualityRetention)}</b>
                <span className="s">蒸馏/微调后</span>
              </div>
              <div className="roi-cell">
                <span className="k">回本</span>
                <b className="v">{roi.breakEvenDays > 0 ? `${roi.breakEvenDays} 天` : '—'}</b>
                <span className="s">一次性训练 {usd(roi.trainingCostUSD)}</span>
              </div>
            </div>
          ) : (
            <p className="hint-line big">
              训练不是这片的杠杆，<b>没有 ROI 可算</b>——正确做法是「{leverLabel(current.lever)}」，
              省下训练与运维成本。这正是火候的核心：<b>对不该训的任务说「别训」</b>。
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
