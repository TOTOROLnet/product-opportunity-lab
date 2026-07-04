import { useMemo, useState } from 'react';
import type { AgentRun, Claim, Evidence } from '../types';
import {
  countByVerdict,
  evidenceScore,
  riskyClaims,
  SELF_REPORTED_SCORE,
  VERDICT_LABEL,
  VERDICT_SHORT,
} from '../logic/scoring';
import { EvidencePanel } from './EvidencePanel';

interface Props {
  run: AgentRun;
  onGotoEvidence: () => void;
}

const VERDICT_ICON: Record<string, string> = {
  verified: '✓',
  weak: '◐',
  unsupported: '⚠',
  contradicted: '✖',
};

export function AuditView({ run, onGotoEvidence }: Props) {
  const [showVerdicts, setShowVerdicts] = useState(true);
  const [riskyOnly, setRiskyOnly] = useState(false);
  const [selectedClaimId, setSelectedClaimId] = useState<string>(run.claims[0].id);

  const score = evidenceScore(run.claims);
  const counts = countByVerdict(run.claims);
  const risky = riskyClaims(run.claims);

  const evidenceById = useMemo(() => {
    const m = new Map<string, Evidence>();
    for (const e of run.evidence) m.set(e.id, e);
    return m;
  }, [run]);

  const selectedClaim: Claim =
    run.claims.find((c) => c.id === selectedClaimId) ?? run.claims[0];

  const visibleClaims = riskyOnly
    ? run.claims.filter((c) => c.verdict === 'unsupported' || c.verdict === 'contradicted')
    : run.claims;

  return (
    <div className="audit">
      <div className="audit-left">
        <div className="audit-toolbar">
          <div className="toggle-group">
            <label className="switch">
              <input
                type="checkbox"
                checked={showVerdicts}
                onChange={(e) => setShowVerdicts(e.target.checked)}
              />
              <span>{showVerdicts ? '审计后（露出证据缺口）' : 'Agent 眼里的样子（全绿假象）'}</span>
            </label>
            <label className="switch">
              <input
                type="checkbox"
                checked={riskyOnly}
                onChange={(e) => setRiskyOnly(e.target.checked)}
                disabled={!showVerdicts}
              />
              <span>只看待复核（无证据 / 被反证）</span>
            </label>
          </div>
        </div>

        {showVerdicts && risky.length > 0 && (
          <div className="alert-banner">
            <span className="alert-icon">!</span>
            <div>
              <b>
                {risky.length} 条“完成”声明缺乏证据支撑或被证据反证。
              </b>
              <span> 别急着 accept——先复核下面标 ⚠ / ✖ 的几句。</span>
            </div>
          </div>
        )}

        {!showVerdicts && (
          <div className="raw-summary">
            <div className="raw-head">{run.agent} 的交付自述</div>
            {run.summary.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
            <div className="raw-hint">
              读起来一切妥当、100% 完成。打开上方开关，看看证据是否支撑每一句。
            </div>
          </div>
        )}

        {showVerdicts && (
          <ol className="claim-list">
            {visibleClaims.map((c) => (
              <li
                key={c.id}
                className={
                  'claim ' + c.verdict + (c.id === selectedClaimId ? ' selected' : '')
                }
                onClick={() => setSelectedClaimId(c.id)}
              >
                <span className={'v-badge ' + c.verdict} title={VERDICT_LABEL[c.verdict]}>
                  {VERDICT_ICON[c.verdict]} {VERDICT_SHORT[c.verdict]}
                </span>
                <span className="claim-text">{c.text}</span>
                <span className="claim-ev-count">
                  {c.evidenceIds.length > 0 ? `${c.evidenceIds.length} 条证据` : '无证据'}
                </span>
              </li>
            ))}
          </ol>
        )}

        <div className="score-summary">
          <div className="score-summary-bars">
            <div className="ssbar-row">
              <span>自述信任分</span>
              <div className="ssbar">
                <div className="ssfill self" style={{ width: '100%' }} />
              </div>
              <b className="self">{SELF_REPORTED_SCORE}%</b>
            </div>
            <div className="ssbar-row">
              <span>证据信任分</span>
              <div className="ssbar">
                <div
                  className={
                    'ssfill ' + (score >= 70 ? 'ok' : score >= 40 ? 'warn' : 'bad')
                  }
                  style={{ width: `${score}%` }}
                />
              </div>
              <b className={score >= 70 ? 'ok' : score >= 40 ? 'warn' : 'bad'}>{score}%</b>
            </div>
          </div>
          <div className="score-summary-counts">
            <span className="chip verified">✓ 有证据 {counts.verified}</span>
            <span className="chip weak">◐ 薄弱 {counts.weak}</span>
            <span className="chip unsupported">⚠ 无证据 {counts.unsupported}</span>
            <span className="chip contradicted">✖ 被反证 {counts.contradicted}</span>
            <button className="link-btn" onClick={onGotoEvidence}>
              看证据台（缺口 / 孤儿证据）→
            </button>
          </div>
        </div>
      </div>

      <div className="audit-right">
        <EvidencePanel claim={selectedClaim} evidenceById={evidenceById} />
      </div>
    </div>
  );
}
