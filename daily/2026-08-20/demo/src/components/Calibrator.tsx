import type { CalibrationCase, PrefId, TasteProfile } from '../types';
import { PREF_META, PRESETS } from '../labels';

function activePrefTags(taste: TasteProfile) {
  return PREF_META.filter((m) => taste[m.id] > 0).map((m) => ({
    id: m.id,
    label: m.label,
    weight: taste[m.id],
    hard: m.hard,
  }));
}

function samePreset(taste: TasteProfile, profile: Record<PrefId, number>): boolean {
  return (Object.keys(profile) as PrefId[]).every((k) => taste[k] === profile[k]);
}

export function Calibrator({
  cases,
  taste,
  selectedChips,
  chipDriven,
  onToggleChip,
  onSetWeight,
  onApplyPreset,
}: {
  cases: CalibrationCase[];
  taste: TasteProfile;
  selectedChips: ReadonlySet<string>;
  chipDriven: boolean;
  onToggleChip: (chipId: string) => void;
  onSetWeight: (pref: PrefId, w: number) => void;
  onApplyPreset: (profile: Record<PrefId, number>) => void;
}) {
  const tags = activePrefTags(taste);

  return (
    <div>
      <div className="card">
        <h2>口味校准 · 从几个例子里学出你的选型偏好</h2>
        <p className="hint">
          不用填一堆表单。看几个「另外几次」agent 选型的小例子，点出你「为什么不满意」，我们就把它蒸馏成一份可复用的
          <b> 选型口味档案</b>——这份档案会实时作用到「对味重选」里，未来也能带给每一次 agent 运行。
        </p>

        <div className="preset-row">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              className={`preset-btn ${!chipDriven && samePreset(taste, p.profile) ? 'active' : ''}`}
              onClick={() => onApplyPreset(p.profile)}
            >
              <div className="pb-label">{p.label}</div>
              <div className="pb-note">{p.note}</div>
            </button>
          ))}
        </div>
        <p className="hint" style={{ margin: '6px 0 0' }}>
          可以从一个预设起步，也可以直接做下面的校准。
        </p>
      </div>

      <div className="card">
        <h2>校准用例</h2>
        <p className="hint">点选每个例子里你认同的「挑刺理由」（可多选，也可不选）。</p>
        {cases.map((cs) => (
          <div className="calib-case" key={cs.id}>
            <div className="ctx">场景：{cs.context}</div>
            <div className="agent-pick">agent 装了：{cs.agentPick}</div>
            <div className="detail">{cs.detail}</div>
            <div className="chip-row">
              {cs.chips.map((chip) => (
                <button
                  key={chip.id}
                  className={`chip ${selectedChips.has(chip.id) ? 'on' : ''}`}
                  onClick={() => onToggleChip(chip.id)}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="card taste-panel">
        <h2>{chipDriven ? '从你的判断学到的口味档案' : '当前口味档案'}</h2>
        <p className="hint">
          {chipDriven
            ? `已从 ${selectedChips.size} 个理由学到下面的偏好。你也可以手动微调权重（0 = 关闭，3 = 最强）——手动调整后即转入手动模式。`
            : '手动设定各偏好的权重（0 = 关闭，3 = 最强）。'}
        </p>

        {tags.length > 0 ? (
          <div className="learned-box">
            <b>口味档案：</b>
            {chipDriven ? '从例子里学到 ' : '已设定 '}
            {tags.length} 条偏好。
            <div className="learned-tags">
              {tags.map((t) => (
                <span className="ltag" key={t.id}>
                  {t.label} <span className="w">×{t.weight}</span>
                  {t.hard ? '（硬规则）' : ''}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <div className="learned-box" style={{ background: '#f3ede3', borderColor: '#e6ddcf', color: '#6b655c' }}>
            还没有任何口味——「对味重选」会完全尊重 agent 的原始选择，不替你改判。
          </div>
        )}

        <div style={{ marginTop: 14 }}>
          {PREF_META.map((m) => (
            <div className="pref" key={m.id}>
              <div className="p-label">
                {m.label}
                {m.hard && <span className="hardtag">硬规则</span>}
              </div>
              <div className="p-desc">{m.desc}</div>
              <div className="weight-ctrl">
                {[0, 1, 2, 3].map((w) => (
                  <button
                    key={w}
                    className={`wbtn ${taste[m.id] === w ? 'on' : ''}`}
                    onClick={() => onSetWeight(m.id, w)}
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
