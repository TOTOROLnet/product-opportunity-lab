import { useMemo, useState } from 'react';
import { CoachView } from './components/CoachView';
import { EvaluateView } from './components/EvaluateView';
import { SkillView } from './components/SkillView';
import { HOLDOUT, TRAINING } from './data/cases';
import { ALL_RULES } from './data/rules';
import { baselineRate, evaluate } from './logic/engine';

type Tab = 'coach' | 'skill' | 'evaluate';

const TEACHABLE_RULE_IDS = ALL_RULES.map((r) => r.id);

export default function App() {
  const [tab, setTab] = useState<Tab>('coach');
  const [adoptedRuleIds, setAdoptedRuleIds] = useState<string[]>([]);
  const [coachIndex, setCoachIndex] = useState(0);
  const [ruleEnabled, setRuleEnabled] = useState<Record<string, boolean>>({});
  const [ruleText, setRuleText] = useState<Record<string, string>>({});

  const activeRules = useMemo(
    () => ALL_RULES.filter((r) => adoptedRuleIds.includes(r.id) && ruleEnabled[r.id] !== false),
    [adoptedRuleIds, ruleEnabled],
  );
  const liveRate = useMemo(() => evaluate(HOLDOUT, activeRules).rate, [activeRules]);
  const base = useMemo(() => baselineRate(HOLDOUT), []);

  const resolve = (adoptRuleId: string | null) => {
    if (adoptRuleId && !adoptedRuleIds.includes(adoptRuleId)) {
      setAdoptedRuleIds((prev) => [...prev, adoptRuleId]);
    }
    setCoachIndex((i) => Math.min(i + 1, TRAINING.length));
  };

  const autoCoach = () => {
    setAdoptedRuleIds(TEACHABLE_RULE_IDS);
    setRuleEnabled({});
    setCoachIndex(TRAINING.length);
  };

  const reset = () => {
    setAdoptedRuleIds([]);
    setRuleEnabled({});
    setRuleText({});
    setCoachIndex(0);
  };

  const toggle = (ruleId: string) => {
    setRuleEnabled((prev) => ({ ...prev, [ruleId]: prev[ruleId] === false ? true : false }));
  };

  const editText = (ruleId: string, text: string) => {
    setRuleText((prev) => ({ ...prev, [ruleId]: text }));
  };

  const deltaPct = Math.round((liveRate - base) * 100);

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="logo">师承</span>
          <span className="brand-sub">Shicheng · 用批改带教出可检验的 Agent Skill</span>
        </div>
        <div className="live-pill" title="在 holdout 集上，agent 当前判断与你（专家）的一致率">
          与专家一致率 <b>{Math.round(liveRate * 100)}%</b>
          <span className={`live-delta ${deltaPct >= 0 ? 'up' : 'down'}`}>
            {deltaPct >= 0 ? '+' : ''}
            {deltaPct}
          </span>
        </div>
      </header>

      <div className="valueprop">
        不写一行 prompt——领域专家只需<b>批改</b> agent 的判断，系统就把判断力蒸馏成<b>可读、带来源、可上线</b>的 Skill。
        <span className="vp-note">（纯前端演示：mock 招聘初筛语料 + 真实迷你规则引擎；不接后端 / LLM / 外部 API）</span>
      </div>

      <nav className="tabs">
        <button className={`tab ${tab === 'coach' ? 'active' : ''}`} onClick={() => setTab('coach')}>
          ① 带教
        </button>
        <button className={`tab ${tab === 'skill' ? 'active' : ''}`} onClick={() => setTab('skill')}>
          ② 技能卡{adoptedRuleIds.length > 0 ? `（${adoptedRuleIds.length}）` : ''}
        </button>
        <button className={`tab ${tab === 'evaluate' ? 'active' : ''}`} onClick={() => setTab('evaluate')}>
          ③ 验收
        </button>
      </nav>

      <main>
        {tab === 'coach' && (
          <CoachView
            index={coachIndex}
            adoptedRuleIds={adoptedRuleIds}
            onResolve={resolve}
            onAutoCoach={autoCoach}
            onReset={reset}
            onGoEvaluate={() => setTab('evaluate')}
          />
        )}
        {tab === 'skill' && (
          <SkillView
            adoptedRuleIds={adoptedRuleIds}
            ruleEnabled={ruleEnabled}
            ruleText={ruleText}
            onToggle={toggle}
            onEditText={editText}
            onGoCoach={() => setTab('coach')}
          />
        )}
        {tab === 'evaluate' && (
          <EvaluateView
            adoptedRuleIds={adoptedRuleIds}
            ruleEnabled={ruleEnabled}
            ruleText={ruleText}
            onToggle={toggle}
            onGoCoach={() => setTab('coach')}
          />
        )}
      </main>

      <footer className="foot">
        师承 Shicheng · product-opportunity-lab Demo · 2026-07-16 · 数据均为 mock，判定由确定性规则引擎实算
      </footer>
    </div>
  );
}
