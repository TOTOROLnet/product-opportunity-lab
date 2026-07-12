import type { ReconSummary } from '../types';
import { deliveryVerdictLabel } from '../logic/mandate';

interface Props {
  summary: ReconSummary;
}

export default function SummaryBar({ summary }: Props) {
  return (
    <section className={`summary-bar verdict-${summary.verdict}`}>
      <div className="summary-verdict">
        <span className="summary-verdict-tag">{deliveryVerdictLabel(summary.verdict)}</span>
        <span className="summary-headline">{summary.headline}</span>
      </div>
      <div className="summary-counts">
        <span className="count-chip chip-honored">
          守约 <b>{summary.honored}</b>
        </span>
        <span className="count-chip chip-adapted">
          微调 <b>{summary.adapted}</b>
        </span>
        <span className="count-chip chip-deviated">
          越界 <b>{summary.deviated}</b>
        </span>
        {summary.openDeviations > 0 && (
          <span className="count-chip chip-open">
            待处置 <b>{summary.openDeviations}</b>
          </span>
        )}
      </div>
    </section>
  );
}
