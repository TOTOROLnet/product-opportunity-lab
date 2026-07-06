import type { Scenario } from '../types';
import { summarize, VERDICT_META } from '../logic/verdict';

export function VerdictHeader({ scenario }: { scenario: Scenario }) {
  const s = summarize(scenario);
  const meta = VERDICT_META[s.verdict];

  return (
    <div className={`verdict verdict-${meta.tone}`}>
      <div className="verdict-main">
        <div className="verdict-badge">{meta.label}</div>
        <p className="verdict-blurb">{meta.blurb}</p>
      </div>

      <div className="verdict-stats">
        <Stat n={s.regressions} label="回归" tone={s.regressions > 0 ? 'bad' : 'muted'} />
        <Stat n={s.improvements} label="改善" tone={s.improvements > 0 ? 'warn' : 'muted'} />
        <Stat n={s.heldPass} label="守住" tone="good" />
        <Stat n={s.toleratedChanges} label="容差内变化" tone="muted" />
      </div>

      <div className="verdict-diff">
        <span className="vd-label">源码 diff</span>
        <span className="vd-added">+{scenario.sourceDiff.added}</span>
        <span className="vd-removed">-{scenario.sourceDiff.removed}</span>
        <span className="vd-note">{scenario.sourceDiff.note}</span>
      </div>
    </div>
  );
}

function Stat({ n, label, tone }: { n: number; label: string; tone: string }) {
  return (
    <div className={`stat stat-${tone}`}>
      <span className="stat-n">{n}</span>
      <span className="stat-l">{label}</span>
    </div>
  );
}
