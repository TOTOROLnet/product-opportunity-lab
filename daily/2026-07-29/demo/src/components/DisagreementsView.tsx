import { useMemo } from 'react';
import type { Metrics, PatchId, CaseResult, FailurePattern } from '../types';
import { GOLDEN_SET, PATCHES } from '../data/goldenSet';

interface Props {
  threshold: number;
  patches: Set<PatchId>;
  togglePatch: (id: PatchId) => void;
  metrics: Metrics;
}

const PATTERN_LABEL: Record<FailurePattern, string> = {
  'keyword-overtrigger': '关键词过度触发',
  'injection-miss': '注入漏判',
  calibrated: '无清晰模式（硬案例）',
};

const OUTCOME_LABEL: Record<string, string> = {
  TP: '命中拦截 ✓',
  TN: '正常放行 ✓',
  FP: '误杀',
  FN: '漏放',
};

export default function DisagreementsView({ threshold, patches, togglePatch, metrics }: Props) {
  // 展示"问题案例"：判官有失败模式的，或当前正误判（FP/FN）的。
  const problems = useMemo(
    () =>
      metrics.results.filter(
        (r) => r.item.patch !== undefined || r.outcome === 'FP' || r.outcome === 'FN',
      ),
    [metrics],
  );

  // 每个补丁当前修复了多少条（该模式下从误判变为正判）。
  function fixedBy(id: PatchId): number {
    return GOLDEN_SET.filter((c) => c.patch === id).filter((c) => {
      const withPatch = new Set(patches);
      withPatch.add(id);
      const withoutPatch = new Set(patches);
      withoutPatch.delete(id);
      const evalOne = (p: Set<PatchId>) => {
        const eff =
          c.patch && typeof c.patchDelta === 'number' && p.has(c.patch)
            ? Math.max(0, Math.min(100, c.judgeScore + c.patchDelta))
            : c.judgeScore;
        const blocks = eff >= threshold;
        if (c.human === 'BLOCK') return blocks; // 正判 = 拦
        return !blocks; // 正判 = 放
      };
      return evalOne(withPatch) && !evalOne(withoutPatch);
    }).length;
  }

  return (
    <div className="view">
      <p className="lead">
        只看<b>判官与人类不一致</b>的案例 —— 判官为什么错？打开对应<b>失败模式补丁</b>，
        看它的判官分被确定性修正、混淆矩阵随之改善。补丁不是"调分数"，而是修判官的系统性偏差。
      </p>

      <section className="patches">
        {PATCHES.map((p) => {
          const on = patches.has(p.id);
          const fixed = fixedBy(p.id);
          return (
            <button
              key={p.id}
              className={`patch ${on ? 'on' : ''}`}
              onClick={() => togglePatch(p.id)}
              aria-pressed={on}
            >
              <span className="patch-top">
                <span className={`switch ${on ? 'on' : ''}`} aria-hidden>
                  <span className="knob" />
                </span>
                <span className="patch-name">{p.name}</span>
                <span className="patch-state">{on ? '已启用' : '未启用'}</span>
              </span>
              <span className="patch-desc">{p.desc}</span>
              <span className="patch-target">修复：{p.targets}</span>
              {on && fixed > 0 && (
                <span className="patch-fixed">当前阈值下修复 {fixed} 条误判</span>
              )}
            </button>
          );
        })}
      </section>

      <div className="disagree-summary">
        当前阈值 <b>{threshold}</b> 下仍有：
        <span className="tag tag-fn">{metrics.fn} 漏放</span>
        <span className="tag tag-fp">{metrics.fp} 误杀</span>
      </div>

      <section className="cases">
        {problems.map((r) => (
          <CaseCard key={r.item.id} r={r} patches={patches} />
        ))}
      </section>
    </div>
  );
}

function CaseCard({ r, patches }: { r: CaseResult; patches: Set<PatchId> }) {
  const c = r.item;
  const patched = c.patch && patches.has(c.patch) && typeof c.patchDelta === 'number';
  const outcomeClass =
    r.outcome === 'FN' ? 'fn' : r.outcome === 'FP' ? 'fp' : r.outcome === 'TP' ? 'tp' : 'tn';

  return (
    <article className={`case case-${outcomeClass}`}>
      <div className="case-head">
        <span className={`badge badge-${c.human === 'BLOCK' ? 'block' : 'allow'}`}>
          人类：{c.human === 'BLOCK' ? '应拦' : '应放'}
        </span>
        <span className={`badge badge-out badge-out-${outcomeClass}`}>
          {OUTCOME_LABEL[r.outcome]}
        </span>
        <span className="pattern">{PATTERN_LABEL[c.pattern]}</span>
      </div>
      <p className="case-action">{c.action}</p>
      <p className="case-context">{c.context}</p>
      <div className="case-scores">
        <span className="score-box">
          判官分{' '}
          {patched ? (
            <>
              <s>{c.judgeScore}</s> → <b>{r.effectiveScore}</b>
              <span className="delta">补丁 {c.patchDelta! > 0 ? '+' : ''}{c.patchDelta}</span>
            </>
          ) : (
            <b>{r.effectiveScore}</b>
          )}
        </span>
        <span className={`verdict-box ${r.judgeBlocks ? 'v-block' : 'v-allow'}`}>
          判官当前：{r.judgeBlocks ? '拦' : '放'}
        </span>
      </div>
      <div className="case-reasons">
        <p>
          <span className="rk">判官理由</span>
          {c.judgeReason}
        </p>
        <p>
          <span className="rk">人类真值理由</span>
          {c.humanReason}
        </p>
      </div>
    </article>
  );
}
