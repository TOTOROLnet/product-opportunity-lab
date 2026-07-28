import { useState } from 'react';
import type { Experiment, ReadoutResult, Verdict } from '../types';

interface Props {
  experiments: Experiment[];
  selected: Experiment;
  readout: ReadoutResult;
  onSelect: (id: string) => void;
}

const VERDICT_META: Record<Verdict, { label: string; cls: string; icon: string }> = {
  effective: { label: '有效', cls: 'v-eff', icon: '✓' },
  insufficient: { label: '数据不足', cls: 'v-insuf', icon: '≈' },
  placebo: { label: '疑似安慰剂', cls: 'v-plac', icon: '!' },
};

function Chart({ exp }: { exp: Experiment }) {
  const values = exp.series.map((p) => p.value);
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const pad = (hi - lo) * 0.15 || 1;
  const yMin = lo - pad;
  const yMax = hi + pad;
  const h = (v: number) => ((v - yMin) / (yMax - yMin)) * 100;

  // 基线均值参考线
  const offVals = exp.series.filter((p) => p.phase === 'off').map((p) => p.value);
  const baseMean = offVals.reduce((a, b) => a + b, 0) / offVals.length;

  return (
    <div className="chart">
      <div className="chart-plot">
        <div className="baseline-line" style={{ bottom: `${h(baseMean)}%` }}>
          <span className="baseline-tag">基线均值 {baseMean.toFixed(1)}</span>
        </div>
        {exp.series.map((p) => (
          <div key={p.day} className="bar-col" title={`第${p.day}天 · ${p.phase === 'on' ? '干预' : '基线/停用'} · ${p.value}${exp.metricUnit}`}>
            <div
              className={`bar ${p.phase === 'on' ? 'bar-on' : 'bar-off'}`}
              style={{ height: `${h(p.value)}%` }}
            />
          </div>
        ))}
      </div>
      <div className="chart-legend">
        <span><i className="sw sw-off" /> 基线 / 停用段（off）</span>
        <span><i className="sw sw-on" /> 干预段（on）</span>
        <span className="chart-axis">纵轴：{exp.metricName}（{exp.metricUnit}）</span>
      </div>
    </div>
  );
}

export default function ReadoutView({ experiments, selected, readout, onSelect }: Props) {
  const [showBoth, setShowBoth] = useState(true);
  const vm = VERDICT_META[readout.verdict];

  return (
    <div className="view">
      <div className="pill-row">
        {experiments.map((e) => (
          <button
            key={e.id}
            className={`pill ${e.id === selected.id ? 'on' : ''}`}
            onClick={() => onSelect(e.id)}
          >
            {e.metricName}
          </button>
        ))}
      </div>

      <div className="readout-grid">
        <section className="panel">
          <h3 className="panel-title">
            实验：{selected.intervention}
          </h3>
          <p className="panel-sub">
            主指标 <b>{selected.metricName}</b>（{selected.metricUnit}）· {selected.design} 设计 ·
            {selected.metricType === 'objective' ? ' 客观指标' : ' 主观自评'}
          </p>
          <Chart exp={selected} />
          <div className="stat-row">
            <div className="stat">
              <div className="stat-k">基线均值</div>
              <div className="stat-v">{readout.baselineMean}<i>{selected.metricUnit}</i></div>
            </div>
            <div className="stat">
              <div className="stat-k">干预均值</div>
              <div className="stat-v">{readout.interventionMean}<i>{selected.metricUnit}</i></div>
            </div>
            <div className="stat">
              <div className="stat-k">基线日间波动</div>
              <div className="stat-v">±{readout.baselineSD}<i>{selected.metricUnit}</i></div>
            </div>
            <div className="stat hl">
              <div className="stat-k">效应量（改善/波动）</div>
              <div className="stat-v">{readout.effectRatio}<i>×</i></div>
            </div>
          </div>
        </section>

        <section className="panel verdict-panel">
          <div className={`verdict ${vm.cls}`}>
            <span className="v-icon">{vm.icon}</span>
            <div>
              <div className="v-label">{vm.label}</div>
              <div className="v-sub">验己读数结论</div>
            </div>
          </div>

          <div className="evidence">
            <div className="evidence-head">
              <span>个人证据强度</span>
              <b>{readout.evidenceStrength}/100</b>
            </div>
            <div className="evidence-bar">
              <div
                className={`evidence-fill ${vm.cls}`}
                style={{ width: `${readout.evidenceStrength}%` }}
              />
            </div>
            <div className="evidence-note">这条干预对「你一个人」真有效的证据强度</div>
          </div>

          <div className="reasons">
            <div className="reasons-title">判定依据</div>
            <ul>
              {readout.reasons.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>

          <div className="reco">
            <span className="reco-tag">下一步</span>
            {readout.recommendation}
          </div>
        </section>
      </div>

      <section className="panel ba-panel">
        <div className="ba-head">
          <h3>朴素解读 vs 验己诚实读数（同一份数据，两种结论）</h3>
          <label className="switch">
            <input
              type="checkbox"
              checked={showBoth}
              onChange={(e) => setShowBoth(e.target.checked)}
            />
            <span>并排对比</span>
          </label>
        </div>
        <div className={`ba-grid ${showBoth ? '' : 'single'}`}>
          <div className="ba-card naive">
            <div className="ba-tag">😊 朴素解读（多数人 / 只看均值）</div>
            <p>{readout.naiveReading}</p>
          </div>
          {showBoth && (
            <div className="ba-card honest">
              <div className="ba-tag">🔬 验己诚实读数</div>
              <p dangerouslySetInnerHTML={{ __html: mdBold(readout.honestReading) }} />
            </div>
          )}
        </div>
        {!showBoth && (
          <p className="ba-hint">打开「并排对比」看验己如何拆穿这份乐观解读。</p>
        )}
      </section>
    </div>
  );
}

// 极简 **加粗** 渲染（仅处理 **...**，内容为本地静态文案，无注入风险）
function mdBold(s: string): string {
  const escaped = s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return escaped.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
}
