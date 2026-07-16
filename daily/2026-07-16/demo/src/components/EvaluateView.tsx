import { HOLDOUT } from '../data/cases';
import { ALL_RULES, ruleById } from '../data/rules';
import { baselineRate, evaluate, type CaseCategory } from '../logic/engine';
import { Gauge, VERDICT_LABEL, VerdictBadge } from './shared';

interface Props {
  adoptedRuleIds: string[];
  ruleEnabled: Record<string, boolean>;
  ruleText: Record<string, string>;
  onToggle: (ruleId: string) => void;
  onGoCoach: () => void;
}

const CATEGORY_META: Record<CaseCategory, { label: string; cls: string }> = {
  fixed: { label: '被规则修好', cls: 'cat-fixed' },
  alreadyRight: { label: '本就一致', cls: 'cat-ok' },
  stillWrong: { label: '仍不一致', cls: 'cat-wrong' },
  broke: { label: '被规则弄坏', cls: 'cat-broke' },
};

export function EvaluateView({ adoptedRuleIds, ruleEnabled, ruleText, onToggle, onGoCoach }: Props) {
  const activeRules = ALL_RULES.filter((r) => adoptedRuleIds.includes(r.id) && ruleEnabled[r.id] !== false);
  const result = evaluate(HOLDOUT, activeRules);
  const base = baselineRate(HOLDOUT);
  const delta = Math.round((result.rate - base) * 100);

  const fixedCount = result.perCase.filter((p) => p.category === 'fixed').length;
  const stillWrong = result.perCase.filter((p) => p.category === 'stillWrong' || p.category === 'broke').length;

  return (
    <div className="view">
      <div className="coach-head">
        <div>
          <div className="eyebrow">验收 · 与专家一致率（在全新候选人上实测）</div>
          <h2>带教前 vs 现在——这个数字由规则引擎实算，不是编的</h2>
        </div>
        <button className="btn ghost" onClick={onGoCoach}>
          ← 回带教
        </button>
      </div>

      <div className="eval-top">
        <div className="gauge-pair">
          <Gauge value={base} label="带教前（agent 裸判）" sub="baseline" />
          <div className="arrow">
            <div className={`delta ${delta >= 0 ? 'up' : 'down'}`}>
              {delta >= 0 ? '+' : ''}
              {delta}%
            </div>
            <div className="arrow-line">→</div>
          </div>
          <Gauge value={result.rate} label={`现在（${activeRules.length} 条规则生效）`} sub="live" />
        </div>
        <div className="eval-summary">
          <p>
            在 <b>{HOLDOUT.length}</b> 位<b>没被你批改过</b>的全新候选人上，你的技能卡把与你判断的一致率从{' '}
            <b>{Math.round(base * 100)}%</b> 提到 <b>{Math.round(result.rate * 100)}%</b>。
          </p>
          <p className="muted">
            其中 <b className="good">{fixedCount}</b> 位是被规则修正过来的；仍有 <b className="warn">{stillWrong}</b>{' '}
            位不一致——诚实地说，规则并不完美（见下方 S 号候选人，属当前技能卡尚未覆盖的维度）。
          </p>
          <p className="muted">👇 试着开关下面的规则，看一致率<b>实时</b>变化——证明每条规则都真的在起作用。</p>
        </div>
      </div>

      <div className="eval-body">
        <div className="eval-cases">
          <div className="section-title">逐个候选人：判定归因</div>
          {result.perCase.map((p) => {
            const meta = CATEGORY_META[p.category];
            const deciding = p.decidingRuleId ? ruleById(p.decidingRuleId) : undefined;
            return (
              <div key={p.candidate.id} className={`eval-row ${meta.cls}`}>
                <div className="eval-row-main">
                  <div className="eval-handle">
                    {p.candidate.handle}
                    <span className="eval-headline">"{p.candidate.headline}"</span>
                  </div>
                  <div className="eval-flow">
                    <span className="flow-label">裸判</span>
                    <VerdictBadge v={p.baseVerdict} size="sm" />
                    <span className="flow-arrow">→</span>
                    <span className="flow-label">技能卡</span>
                    <VerdictBadge v={p.finalVerdict} size="sm" />
                    <span className="flow-label">你</span>
                    <VerdictBadge v={p.expert} size="sm" />
                  </div>
                </div>
                <div className="eval-row-side">
                  <span className={`cat ${meta.cls}`}>{meta.label}</span>
                  {deciding && (
                    <span className="deciding" title={ruleText[deciding.id] ?? deciding.text}>
                      规则：{(ruleText[deciding.id] ?? deciding.text).slice(0, 22)}
                      {(ruleText[deciding.id] ?? deciding.text).length > 22 ? '…' : ''}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <aside className="eval-toggles">
          <div className="section-title">规则开关（实时重算）</div>
          {adoptedRuleIds.length === 0 ? (
            <div className="skill-mini-empty">还没有规则。先去带教。</div>
          ) : (
            adoptedRuleIds.map((id) => {
              const r = ruleById(id);
              if (!r) return null;
              const enabled = ruleEnabled[id] !== false;
              return (
                <label key={id} className={`toggle-row ${enabled ? '' : 'off'}`}>
                  <input type="checkbox" checked={enabled} onChange={() => onToggle(id)} />
                  <span>{ruleText[id] ?? r.text}</span>
                </label>
              );
            })
          )}
          <div className="toggle-hint">
            关掉规则 → 一致率掉回去；打开 → 涨回来。判定 <b>{VERDICT_LABEL.advance}</b> /{' '}
            <b>{VERDICT_LABEL.maybe}</b> / <b>{VERDICT_LABEL.reject}</b> 全由规则引擎确定性算出。
          </div>
        </aside>
      </div>
    </div>
  );
}
