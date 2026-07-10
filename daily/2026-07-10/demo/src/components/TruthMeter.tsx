import type { TruthSummary } from '../logic/grounding';

export function TruthMeter({ summary }: { summary: TruthSummary }) {
  const segs = [
    { key: 'verified', pct: summary.verifiedPct, label: '已核实' },
    { key: 'guessed', pct: summary.guessedPct, label: '模型推测' },
    { key: 'placeholder', pct: summary.placeholderPct, label: '占位' },
  ].filter((s) => s.pct > 0);

  return (
    <div className={`truth-meter ${summary.trustworthy ? 'ok' : 'warn'}`}>
      <div className="truth-meter-head">
        <span className="truth-meter-title">界面真实度</span>
        <span className="truth-meter-verdict">
          {summary.trustworthy ? '✓ 全部已核实 · Pane 背书' : '⚠ 含未核实内容 · 谨慎操作'}
        </span>
      </div>
      <div className="truth-bar" aria-hidden>
        {segs.map((s) => (
          <div
            key={s.key}
            className={`truth-seg truth-seg-${s.key}`}
            style={{ width: `${s.pct}%` }}
            title={`${s.label} ${s.pct}%`}
          />
        ))}
      </div>
      <div className="truth-legend">
        <span>
          <i className="dot dot-verified" /> 已核实 {summary.verified} 项（{summary.verifiedPct}%）
        </span>
        <span>
          <i className="dot dot-guessed" /> 模型推测 {summary.guessed} 项（{summary.guessedPct}%）
        </span>
        <span>
          <i className="dot dot-placeholder" /> 占位 {summary.placeholder} 项（
          {summary.placeholderPct}%）
        </span>
      </div>
    </div>
  );
}
