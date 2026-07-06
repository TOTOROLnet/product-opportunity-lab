import type { Criterion } from '../types';
import { transitionOf, TRANSITION_META } from '../logic/verdict';

const TYPE_BADGE: Record<string, string> = {
  screenshot: '截图',
  http: 'HTTP',
  log: '日志',
  test: '测试',
};

function StatusPill({ status }: { status: 'pass' | 'fail' }) {
  return (
    <span className={`spill spill-${status}`}>{status === 'pass' ? 'PASS' : 'FAIL'}</span>
  );
}

export function CriteriaMatrix({
  criteria,
  selectedId,
  onSelect,
  onlyChanged,
}: {
  criteria: Criterion[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onlyChanged: boolean;
}) {
  const rows = onlyChanged
    ? criteria.filter((c) => {
        const t = transitionOf(c);
        return t === 'regressed' || t === 'improved' || c.evidenceChanged;
      })
    : criteria;

  return (
    <div className="matrix">
      <div className="matrix-head">
        <span className="mh-crit">验收标准</span>
        <span className="mh-type">证据</span>
        <span className="mh-trans">基线 → 当前</span>
      </div>
      {rows.length === 0 && <div className="matrix-empty">本次重跑没有任何变化，全部守住。</div>}
      {rows.map((c) => {
        const t = transitionOf(c);
        const meta = TRANSITION_META[t];
        const active = c.id === selectedId;
        return (
          <button
            key={c.id}
            className={`mrow mrow-${meta.tone} ${active ? 'mrow-active' : ''}`}
            onClick={() => onSelect(c.id)}
          >
            <span className="mrow-crit">
              {c.text}
              {c.evidenceChanged && (t === 'held-pass' || t === 'held-fail') && (
                <span className="mrow-tol">证据有变 · 容差内</span>
              )}
            </span>
            <span className="mrow-type">
              <span className="tbadge">{TYPE_BADGE[c.evidenceType]}</span>
            </span>
            <span className="mrow-trans">
              <StatusPill status={c.baselineStatus} />
              <span className="mrow-arrow">→</span>
              <StatusPill status={c.currentStatus} />
            </span>
          </button>
        );
      })}
    </div>
  );
}
