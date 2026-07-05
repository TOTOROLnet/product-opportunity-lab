import type { Scenario, Severity } from '../types';
import { sortFindings } from '../logic/scoring';

interface Props {
  scenario: Scenario;
  severityFilter: Severity | 'all';
  activeNodeId: string | null;
  onFocusNode: (nodeId: string) => void;
}

const SEV_LABEL: Record<Severity, string> = { critical: 'Critical', warn: 'Warn', info: 'Info' };

export function FindingsPanel({ scenario, severityFilter, activeNodeId, onFocusNode }: Props) {
  const findings = sortFindings(scenario.findings).filter(
    (f) => severityFilter === 'all' || f.severity === severityFilter,
  );

  return (
    <div className="panel findings-panel">
      <div className="panel-head">
        <h3>意图 / 不变量核验</h3>
        <span className="panel-sub">对每个语义改动跑核验，Critical 顶到最前</span>
      </div>

      {findings.length === 0 && <div className="findings-empty">该严重度下没有条目。</div>}

      <ul className="findings">
        {findings.map((f) => (
          <li
            key={f.id}
            className={`finding sev-${f.severity} ${f.nodeId === activeNodeId ? 'active' : ''}`}
            onClick={() => onFocusNode(f.nodeId)}
          >
            <div className="finding-head">
              <span className={`sev-badge sev-${f.severity}`}>{SEV_LABEL[f.severity]}</span>
              <span className="finding-title">{f.title}</span>
            </div>
            {f.invisibleInLineDiff && (
              <div className="invisible-flag">🙈 行级 diff 里看不见这处风险</div>
            )}
            <p className="finding-detail">{f.detail}</p>
            <div className="finding-rationale">
              <span className="rationale-label">判定依据</span>
              {f.rationale}
            </div>
            <div className="finding-tags">
              {f.tags.map((t) => (
                <span key={t} className="ftag">{t}</span>
              ))}
              <span className="focus-hint">点击定位到语义树 ↖</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
