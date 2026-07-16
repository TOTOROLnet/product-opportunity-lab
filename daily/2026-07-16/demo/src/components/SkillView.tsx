import { useState } from 'react';
import { ROLE, TRAINING } from '../data/cases';
import { ALL_RULES, ruleById } from '../data/rules';
import { VERDICT_LABEL } from './shared';

interface Props {
  adoptedRuleIds: string[];
  ruleEnabled: Record<string, boolean>;
  ruleText: Record<string, string>;
  onToggle: (ruleId: string) => void;
  onEditText: (ruleId: string, text: string) => void;
  onGoCoach: () => void;
}

function caseHandle(caseId: string): string {
  return TRAINING.find((t) => t.id === caseId)?.handle ?? caseId;
}

export function SkillView({ adoptedRuleIds, ruleEnabled, ruleText, onToggle, onEditText, onGoCoach }: Props) {
  const [editing, setEditing] = useState<string | null>(null);

  const buildSkillDoc = () => {
    const rules = adoptedRuleIds
      .map((id) => ruleById(id))
      .filter((r): r is NonNullable<typeof r> => Boolean(r))
      .map((r, i) => {
        const enabled = ruleEnabled[r.id] !== false;
        const text = ruleText[r.id] ?? r.text;
        return {
          order: i + 1,
          id: r.id,
          rule: text,
          when: r.when,
          setTo: VERDICT_LABEL[r.setTo],
          weight: r.weight,
          enabled,
          learnedFrom: caseHandle(r.learnedFromCaseId),
        };
      });
    return {
      skill: `候选人初筛 · ${ROLE}`,
      authoredBy: '领域专家（通过批改带教，非手写 prompt）',
      generatedAt: new Date().toISOString(),
      ruleCount: rules.length,
      rules,
    };
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(buildSkillDoc(), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'shicheng-skill.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const notYet = ALL_RULES.filter((r) => !adoptedRuleIds.includes(r.id));

  return (
    <div className="view">
      <div className="coach-head">
        <div>
          <div className="eyebrow">技能卡 · 你的判断力被蒸馏成的产品件</div>
          <h2>可读、带来源、可开关、可编辑、可导出上线</h2>
        </div>
        <div className="coach-actions">
          <button className="btn ghost" onClick={onGoCoach}>
            ← 回带教
          </button>
          <button className="btn primary" onClick={exportJson} disabled={adoptedRuleIds.length === 0}>
            导出 Skill (JSON)
          </button>
        </div>
      </div>

      {adoptedRuleIds.length === 0 ? (
        <div className="skill-mini-empty big">
          技能卡还是空的。去「带教」里对 agent 的判断做几次批改，规则就会长出来。
        </div>
      ) : (
        <ol className="rule-list">
          {adoptedRuleIds.map((id, i) => {
            const r = ruleById(id);
            if (!r) return null;
            const enabled = ruleEnabled[id] !== false;
            const text = ruleText[id] ?? r.text;
            return (
              <li key={id} className={`rule-card ${enabled ? '' : 'off'}`}>
                <div className="rule-index">{i + 1}</div>
                <div className="rule-body">
                  {editing === id ? (
                    <textarea
                      className="rule-edit"
                      defaultValue={text}
                      autoFocus
                      onBlur={(e) => {
                        onEditText(id, e.target.value.trim() || r.text);
                        setEditing(null);
                      }}
                    />
                  ) : (
                    <div className="rule-text" onClick={() => setEditing(id)} title="点击编辑">
                      {text}
                    </div>
                  )}
                  <div className="rule-meta">
                    <span className={`tag tag-${r.weight}`}>{r.weight === 'high' ? '高权重' : '中权重'}</span>
                    <span className="tag tag-set">命中即判：{VERDICT_LABEL[r.setTo]}</span>
                    <span className="rule-prov">来源：{caseHandle(r.learnedFromCaseId)} 的批改</span>
                  </div>
                </div>
                <label className="switch" title={enabled ? '点击停用' : '点击启用'}>
                  <input type="checkbox" checked={enabled} onChange={() => onToggle(id)} />
                  <span className="slider" />
                </label>
              </li>
            );
          })}
        </ol>
      )}

      {notYet.length > 0 && (
        <div className="notyet">
          <div className="notyet-head">尚未学到的判断（继续带教可解锁）</div>
          <div className="notyet-list">
            {notYet.map((r) => (
              <span key={r.id} className="notyet-chip">
                🔒 {r.when}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
