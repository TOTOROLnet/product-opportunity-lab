interface Props {
  step: 'intake' | 'untangle' | 'card'
}

const STEPS: { key: Props['step']; label: string; sub: string }[] = [
  { key: 'intake', label: '① 口述', sub: '边想边说' },
  { key: 'untangle', label: '② 解结 & 确认', sub: '分类 · 抓矛盾 · 你拍板' },
  { key: 'card', label: '③ 思路卡', sub: '想清楚了' },
]

export function StepBar({ step }: Props) {
  const activeIndex = STEPS.findIndex((s) => s.key === step)
  return (
    <nav className="stepbar" aria-label="流程步骤">
      {STEPS.map((s, i) => {
        const status = i < activeIndex ? 'done' : i === activeIndex ? 'active' : 'todo'
        return (
          <div key={s.key} className={`step step-${status}`}>
            <div className="step-label">{s.label}</div>
            <div className="step-sub">{s.sub}</div>
          </div>
        )
      })}
    </nav>
  )
}
