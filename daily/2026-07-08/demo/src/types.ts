// Shared domain types for ClaimLadder.
// Everything here is illustrative / mock data — no real regulation database,
// no backend, no external API. See README.md.

export type FieldType = 'number' | 'select' | 'currency'

export interface FieldOption {
  value: string
  label: string
}

export interface ScenarioField {
  key: string
  label: string
  type: FieldType
  unit?: string
  options?: FieldOption[]
  placeholder?: string
  /** Value used by the "用示例填充" button. */
  example: string
  help?: string
}

export interface Scenario {
  id: string
  name: string
  emoji: string
  tagline: string
  /** Display currency symbol, e.g. "€" or "¥". */
  currency: string
  fields: ScenarioField[]
}

export interface StrengthFactor {
  label: string
  /** Positive = strengthens the case, negative = weakens it. */
  delta: number
}

export interface CompensationLine {
  label: string
  /** Plain-language explanation of how this number was derived. */
  detail: string
  amount: number
}

export interface RegulationCard {
  code: string
  title: string
  summary: string
  appliesWhen: string
}

export type Reversibility = 'soft' | 'medium' | 'hard'

export interface LadderStep {
  id: string
  rung: number
  channel: string
  target: string
  /** 0–100: your negotiating leverage once you reach this rung. */
  leverage: number
  eta: string
  goal: string
  draftTitle: string
  /** Copyable script / email / form text the user fires themselves. */
  draft: string
  /** Personal data fields this step would expose. */
  dataShared: string[]
  reversibility: Reversibility
  reversibilityNote: string
}

export interface CaseResult {
  scenarioId: string
  scenarioName: string
  currency: string
  strength: number
  strengthVerdict: string
  strengthFactors: StrengthFactor[]
  total: number
  lines: CompensationLine[]
  regulations: RegulationCard[]
  ladder: LadderStep[]
  notes: string[]
}
