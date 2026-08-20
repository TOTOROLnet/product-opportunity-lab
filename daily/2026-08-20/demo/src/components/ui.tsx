import type { Candidate, Decision, FlipSeverity } from '../types';
import { isCopyleft } from '../labels';

export const SEVERITY_LABEL: Record<FlipSeverity | 'keep', { text: string; cls: string }> = {
  hard: { text: '许可硬伤', cls: 'hard' },
  regret: { text: '会后悔', cls: 'regret' },
  soft: { text: '可优化', cls: 'soft' },
  keep: { text: '选得对味', cls: 'keep' },
};

export function maintText(months: number, isNative: boolean): string {
  if (isNative) return '原生';
  if (months <= 0) return '刚发布';
  return `${months} 个月前`;
}

function CandidateRow({
  c,
  isAgent,
  isTaste,
}: {
  c: Candidate;
  isAgent: boolean;
  isTaste: boolean;
}) {
  const rowClass = isTaste ? 'taste' : isAgent ? 'picked' : '';
  const stale = !c.isNativeApproach && c.lastPublishMonths >= 24;
  const heavy = c.bundleKb >= 50;
  const copyleft = isCopyleft(c.license);
  return (
    <tr className={rowClass}>
      <td className="name">
        {c.name}
        {isAgent && <span className="pill agent">agent 选</span>}
        {isTaste && !isAgent && <span className="pill taste">对味选</span>}
        {c.isNativeApproach && <span className="pill native">原生</span>}
      </td>
      <td className="num-cell">
        {c.isNativeApproach ? '0' : c.bundleKb} KB
        {heavy && <span className="warn"> ⚠</span>}
      </td>
      <td className="num-cell">
        {maintText(c.lastPublishMonths, c.isNativeApproach)}
        {stale && <span className="warn"> ⚠</span>}
      </td>
      <td className="num-cell">{c.transitiveDeps}</td>
      <td>
        {c.license === 'none' ? '—' : c.license}
        {copyleft && <span className="pill copyleft">copyleft</span>}
      </td>
      <td>{c.typed ? <span className="ok">一等</span> : '@types'}</td>
    </tr>
  );
}

export function CandidateTable({
  decision,
  agentPickName,
  tastePickName,
}: {
  decision: Decision;
  agentPickName: string;
  tastePickName: string;
}) {
  return (
    <table className="cand-table">
      <thead>
        <tr>
          <th>方案</th>
          <th>体积</th>
          <th>维护</th>
          <th>传递依赖</th>
          <th>许可</th>
          <th>类型</th>
        </tr>
      </thead>
      <tbody>
        {decision.candidates.map((c) => (
          <CandidateRow
            key={c.name}
            c={c}
            isAgent={c.name === agentPickName}
            isTaste={c.name === tastePickName}
          />
        ))}
      </tbody>
    </table>
  );
}

export function Stat({
  num,
  lbl,
  tone,
}: {
  num: string | number;
  lbl: string;
  tone?: 'red' | 'amber' | 'olive' | 'accent';
}) {
  return (
    <div className={`stat ${tone ?? ''}`}>
      <div className="num">{num}</div>
      <div className="lbl">{lbl}</div>
    </div>
  );
}
