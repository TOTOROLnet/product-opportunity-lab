import type { RiskResult, ScoredPath } from '../types';
import { CATEGORY_LABEL } from '../logic/scoring';

interface Props {
  result: RiskResult;
  selectedPath: string | null;
  onSelectPath: (id: string | null) => void;
  onFocusInGraph: () => void;
}

function Flow({ path }: { path: ScoredPath }) {
  const parts = path.label.split(' → ');
  return (
    <div className="path-flow">
      {parts.map((p, i) => (
        <span key={i}>
          {p}
          {i < parts.length - 1 ? ' → ' : ''}
        </span>
      ))}
      {path.gated && <span className="gate">（含人审）</span>}
    </div>
  );
}

export default function RiskPaths({
  result,
  selectedPath,
  onSelectPath,
  onFocusInGraph,
}: Props) {
  return (
    <div className="card">
      <h3>
        涌现高危链路 · 按残余风险排序（{result.activePaths.length} 条可执行 /{' '}
        {result.paths.length} 条候选）
      </h3>
      {result.paths.map((p) => {
        const isSel = p.id === selectedPath;
        const sevCls = p.active ? p.severity : 'gone';
        const sevText = p.active
          ? p.severity === 'high'
            ? '高危'
            : p.severity === 'medium'
              ? '中危'
              : '低危'
          : '已消除';
        return (
          <div
            key={p.id}
            className={`path ${isSel ? 'selected' : ''} ${p.active ? '' : 'inactive'}`}
            onClick={() => (p.active ? onSelectPath(isSel ? null : p.id) : undefined)}
          >
            <div className="path-head">
              <span className={`sev ${sevCls}`}>{sevText}</span>
              <span className="path-cat">{CATEGORY_LABEL[p.category]}</span>
              {p.active && <span className="path-score">残余风险 {p.score} / 50</span>}
            </div>
            <Flow path={p} />
            {!p.active && <div className="gone-note">✓ {p.inactiveReason}</div>}
            {p.active && isSel && (
              <div className="path-detail">
                <b style={{ fontSize: 12.5 }}>评分构成</b>
                <ul>
                  {p.reasons.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
                <div className="fix">建议修复：{p.fix}</div>
                <button
                  className="reset"
                  style={{ marginTop: 10 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onFocusInGraph();
                  }}
                >
                  在能力图中高亮此链路 →
                </button>
              </div>
            )}
          </div>
        );
      })}
      {result.paths.every((p) => !p.active) && (
        <div className="empty" style={{ padding: '10px 2px', color: 'var(--low)' }}>
          🎉 当前策略下所有候选高危链路都已被切断。
        </div>
      )}
    </div>
  );
}
