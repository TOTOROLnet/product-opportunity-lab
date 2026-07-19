import type { Metrics, Mode, TraceStep } from '../types';
import DocView from './DocView';

function MetricRow({
  label,
  value,
  tone,
  suffix,
}: {
  label: string;
  value: number | string;
  tone: 'good' | 'bad' | 'neutral';
  suffix?: string;
}) {
  return (
    <div className="metric-row">
      <span>{label}</span>
      <span className={`val ${tone}`}>
        {value}
        {suffix ?? ''}
      </span>
    </div>
  );
}

export default function CoWritingStage({
  step,
  mode,
  humanTexts,
}: {
  step: TraceStep;
  mode: Mode;
  humanTexts: Record<string, string>;
}) {
  const m: Metrics = step.metrics;
  const zeroTone = (n: number) => (n > 0 ? 'bad' : mode === 'cobaton' ? 'good' : 'neutral');
  const preservedTone =
    m.humanEditsTotal === 0
      ? 'neutral'
      : m.humanEditsPreserved === m.humanEditsTotal
        ? 'good'
        : 'bad';

  return (
    <div className="two-col">
      <div>
        <div className="callout">
          场景：你在改《退款 SOP》，同时给 agent 派了任务「更新到与新版 API v2 一致」。
          你和 agent 的意图在 <b>§条件 / §时限 / §附录</b> 上重叠，<b>§API</b> 是可并行的无冲突区。
          切换上方模式，用<b>同一条事件序列</b>对比现状（朴素）与我们的协调层（并笔）。
        </div>
        <DocView step={step} humanTexts={humanTexts} />
      </div>

      <div className="side">
        <div className="card">
          <h3>这一步发生了什么</h3>
          <div className="note-box">{step.note}</div>
        </div>

        <div className="card">
          <h3>实时指标（累计）</h3>
          <MetricRow label="丢失的「你的编辑」" value={m.lostHumanEdits} tone={zeroTone(m.lostHumanEdits)} />
          <MetricRow label="你被打断的次数" value={m.interruptions} tone={zeroTone(m.interruptions)} />
          <MetricRow label="agent 白做的编辑" value={m.wastedAgentEdits} tone={zeroTone(m.wastedAgentEdits)} />
          <MetricRow
            label="你的编辑保留率"
            value={`${m.humanEditsPreserved}/${m.humanEditsTotal}`}
            tone={preservedTone}
          />
        </div>

        <div className="card">
          <h3>图例</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            <span className="badge human">🧑 你在此</span>
            <span className="badge agent">agent 认领/落改</span>
            <span className="badge defer">agent 延后中</span>
            <span className="badge bad">丢失/打断/白做</span>
          </div>
        </div>
      </div>
    </div>
  );
}
