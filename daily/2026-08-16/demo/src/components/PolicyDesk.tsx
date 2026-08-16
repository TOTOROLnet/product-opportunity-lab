import type { Decision, Policy, RulePref, ToolCategory } from '../types';
import { CAT_EMOJI, CAT_LABEL, RULE_LABEL } from '../labels';
import { PRESET_LABEL } from '../data/mock';

const CATEGORIES: ToolCategory[] = ['shell', 'git', 'fs', 'cloud', 'db', 'net', 'comms', 'payment'];
const RULE_OPTIONS: RulePref[] = ['inherit', 'allow', 'review', 'deny'];
const DEFAULT_OPTIONS: Decision[] = ['allow', 'review', 'deny'];

interface Props {
  policy: Policy;
  onPreset: (name: 'loose' | 'balanced' | 'strict') => void;
  onUpdate: (patch: Partial<Policy>) => void;
  onCategory: (cat: ToolCategory, pref: RulePref) => void;
  onGoReplay: () => void;
}

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className={checked ? 'toggle on' : 'toggle'}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="toggle-box" aria-hidden />
      <span className="toggle-text">
        <b>{label}</b>
        <em>{hint}</em>
      </span>
    </label>
  );
}

export default function PolicyDesk({ policy, onPreset, onUpdate, onCategory, onGoReplay }: Props) {
  return (
    <section className="grid-desk">
      <div className="panel">
        <div className="panel-head">
          <h2>护栏策略</h2>
          <span className="muted-sm">
            当前：{policy.preset === 'custom' ? '自定义' : PRESET_LABEL[policy.preset]}
          </span>
        </div>

        <div className="preset-row">
          {(['loose', 'balanced', 'strict'] as const).map((p) => (
            <button
              key={p}
              className={policy.preset === p ? 'preset on' : 'preset'}
              onClick={() => onPreset(p)}
            >
              {PRESET_LABEL[p]}
            </button>
          ))}
        </div>

        <div className="subhead">全局守卫</div>
        <div className="toggles">
          <Toggle
            label="不可逆动作强制人审"
            hint="删除 / 强推 / 退款等不可逆动作至少要人复核"
            checked={policy.requireHumanForIrreversible}
            onChange={(v) => onUpdate({ requireHumanForIrreversible: v })}
          />
          <Toggle
            label="prod 范围动作强制人审"
            hint="任何落在生产环境的动作都先叫人"
            checked={policy.requireHumanForProd}
            onChange={(v) => onUpdate({ requireHumanForProd: v })}
          />
          <Toggle
            label="拦截 secret 外发（fail-closed）"
            hint="密钥类数据发往外部一律一票否决"
            checked={policy.blockSecretExfil}
            onChange={(v) => onUpdate({ blockSecretExfil: v })}
          />
        </div>

        <div className="subhead">阈值 & 预算</div>
        <div className="slider-row">
          <div className="slider-label">
            自动放行的风险上限：<b>{policy.maxAutoRisk}</b> / 5
            <em>基础风险高于此值 → 需人审</em>
          </div>
          <input
            type="range"
            min={1}
            max={5}
            value={policy.maxAutoRisk}
            onChange={(e) => onUpdate({ maxAutoRisk: Number(e.target.value) })}
          />
        </div>
        <div className="slider-row">
          <div className="slider-label">
            人审预算：<b>{policy.reviewBudget}</b> 条 / 批
            <em>超过预算 → 告警疲劳风险</em>
          </div>
          <input
            type="range"
            min={0}
            max={12}
            value={policy.reviewBudget}
            onChange={(e) => onUpdate({ reviewBudget: Number(e.target.value) })}
          />
        </div>

        <div className="subhead">默认路径（无规则命中时）</div>
        <div className="seg">
          {DEFAULT_OPTIONS.map((d) => (
            <button
              key={d}
              className={policy.defaultForUnmatched === d ? 'seg-btn on' : 'seg-btn'}
              onClick={() => onUpdate({ defaultForUnmatched: d })}
            >
              {RULE_LABEL[d]}
            </button>
          ))}
        </div>
        <p className="hint-sm">
          「无规则命中」的动作会落进这条默认路径——这就是<b>策略盲区</b>：默认放行则危险，默认否决则误伤。
        </p>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h2>分类规则</h2>
          <span className="muted-sm">对每类工具的显式态度</span>
        </div>
        <div className="cat-list">
          {CATEGORIES.map((c) => (
            <div className="cat-row" key={c}>
              <span className="cat-name">
                <span className="cat-emoji">{CAT_EMOJI[c]}</span>
                {CAT_LABEL[c]}
              </span>
              <div className="seg seg-sm">
                {RULE_OPTIONS.map((r) => (
                  <button
                    key={r}
                    className={policy.categoryRules[c] === r ? 'seg-btn on' : 'seg-btn'}
                    onClick={() => onCategory(c, r)}
                  >
                    {RULE_LABEL[r]}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <button className="cta" onClick={onGoReplay}>
          ▶ 用这套策略回放 12 条动作
        </button>
      </div>
    </section>
  );
}
