import type { Autonomy, Outcome, Stakes } from '../types';
import { AUTONOMY_SHORT, OUTCOME_LABEL, STAKES_LABEL } from '../data/situations';

// 授权档配色：放手→绿、拟稿→蓝、先问→琥珀、绝不→红，形成 go→caution→stop 渐变。
export const AUTONOMY_COLOR: Record<Autonomy, string> = {
  handle: '#38d39f',
  draft: '#7c9cff',
  ask: '#f2b34d',
  never: '#f2657a',
};

export const OUTCOME_COLOR: Record<Outcome, string> = {
  handled: '#38d39f',
  draft: '#7c9cff',
  ask: '#f2b34d',
  blocked: '#f2657a',
};

export function cx(...parts: (string | false | undefined)[]): string {
  return parts.filter(Boolean).join(' ');
}

export function StakesBadge({ stakes }: { stakes: Stakes }) {
  return <span className={cx('stakes', 'stakes-' + stakes)}>{STAKES_LABEL[stakes]}</span>;
}

export function AutonomyPill({ level, dim }: { level: Autonomy; dim?: boolean }) {
  return (
    <span
      className="pill"
      style={{
        color: AUTONOMY_COLOR[level],
        borderColor: AUTONOMY_COLOR[level],
        opacity: dim ? 0.5 : 1,
      }}
    >
      {AUTONOMY_SHORT[level]}
    </span>
  );
}

export function OutcomeChip({ outcome }: { outcome: Outcome }) {
  return (
    <span className="chip" style={{ background: OUTCOME_COLOR[outcome] + '22', color: OUTCOME_COLOR[outcome] }}>
      {OUTCOME_LABEL[outcome]}
    </span>
  );
}

// 横向占比条（用于一周分布）。
export function DistBar({
  counts,
  total,
}: {
  counts: Record<Outcome, number>;
  total: number;
}) {
  const order: Outcome[] = ['handled', 'draft', 'ask', 'blocked'];
  return (
    <div className="distbar" role="img" aria-label="一周处理分布">
      {order.map((o) =>
        counts[o] > 0 ? (
          <div
            key={o}
            className="distbar-seg"
            style={{ width: (counts[o] / total) * 100 + '%', background: OUTCOME_COLOR[o] }}
            title={OUTCOME_LABEL[o] + ' ' + counts[o] + ' 件'}
          >
            {counts[o]}
          </div>
        ) : null,
      )}
    </div>
  );
}

export function Legend() {
  const items: Autonomy[] = ['handle', 'draft', 'ask', 'never'];
  return (
    <div className="legend">
      {items.map((a) => (
        <span key={a} className="legend-item">
          <i style={{ background: AUTONOMY_COLOR[a] }} />
          {AUTONOMY_SHORT[a]}
        </span>
      ))}
    </div>
  );
}
