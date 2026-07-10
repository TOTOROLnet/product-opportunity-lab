import type { Grounding } from '../types';
import { GROUNDING_META } from '../logic/grounding';

export function ElementBadge({ grounding }: { grounding: Grounding }) {
  const meta = GROUNDING_META[grounding];
  return (
    <span className={`badge badge-${meta.tone}`} title={meta.label}>
      <span className="badge-dot" aria-hidden>
        {meta.short}
      </span>
      {meta.label}
    </span>
  );
}
