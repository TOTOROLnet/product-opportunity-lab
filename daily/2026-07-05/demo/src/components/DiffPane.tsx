import type { Scenario } from '../types';
import type { Verdict } from '../logic/scoring';

interface Props {
  scenario: Scenario;
  verdict: Verdict;
  onSwitch: () => void;
}

export function DiffPane({ scenario, verdict, onSwitch }: Props) {
  const hidden = verdict.invisibleCount;
  return (
    <div className="diff-pane">
      <div className="diff-headline">
        <span className="diff-tool">你在 GitHub / IDE 里会看到的全部：</span>
        <span className="diff-count">
          <span className="add">+{scenario.lineAdded}</span> <span className="del">−{scenario.lineRemoved}</span> 行 · 看起来很小
        </span>
      </div>

      <pre className="line-diff">
        {scenario.lineDiff.map((l, i) => (
          <div key={i} className={`dl dl-${l.type}`}>
            {l.text}
          </div>
        ))}
      </pre>

      {(verdict.critical > 0 || verdict.warn > 0) && (
        <div className="diff-nudge">
          <div className="nudge-text">
            这份行级 diff 里，
            {hidden > 0 ? (
              <>
                有 <b>{hidden}</b> 处高危改动<b>完全看不见</b>
              </>
            ) : (
              <>
                数值变了、但<b>它是否破坏了设计意图</b>看不出来
              </>
            )}
            。
          </div>
          <button className="switch-btn" onClick={onSwitch}>
            切到语义 diff，看真实风险 →
          </button>
        </div>
      )}

      {verdict.recommendation === 'SAFE' && (
        <div className="diff-nudge safe">
          <div className="nudge-text">这次改动语义上等价、无风险。切到语义 diff 可以看到 Contour 为什么判定它安全。</div>
          <button className="switch-btn" onClick={onSwitch}>
            查看语义比对 →
          </button>
        </div>
      )}
    </div>
  );
}
