import type { RegulationCard } from '../types'

interface Props {
  regulations: RegulationCard[]
}

export function RegulationCards({ regulations }: Props) {
  return (
    <div className="card regs">
      <h3 className="card-title">📚 你的依据 · 法规 / 规则引用</h3>
      <ul className="reg-list">
        {regulations.map((r, i) => (
          <li key={i} className="reg-item">
            <div className="reg-top">
              <span className="reg-code">{r.code}</span>
              <span className="reg-sample">示例规则</span>
            </div>
            <div className="reg-title">{r.title}</div>
            <p className="reg-summary">{r.summary}</p>
            <p className="reg-when">适用：{r.appliesWhen}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}
