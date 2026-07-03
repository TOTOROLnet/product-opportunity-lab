export type RiskLevel = 'critical' | 'high' | 'medium'

export type ActionStatus = 'pending' | 'approved' | 'approved_edited' | 'rejected'

export type Verdict = 'approved' | 'approved_edited' | 'rejected'

export interface ReasoningStep {
  label: string
  detail: string
}

export interface PriorDecision {
  date: string
  verdict: 'approved' | 'rejected'
  note: string
}

export interface ActionImpact {
  scope: string
  magnitude: string
  reversible: string
}

export interface AgentAction {
  id: string
  agent: string
  title: string
  risk: RiskLevel
  tool: string
  payload: string
  payloadLang: 'sql' | 'json' | 'text'
  impact: ActionImpact
  reasoning: ReasoningStep[]
  priors: PriorDecision[]
  createdAt: string
  status: ActionStatus
}

export type PolicyMode = 'block' | 'needs_approval' | 'auto_allow'
export type PolicySource = 'auto' | 'manual'

export interface Policy {
  id: string
  rule: string
  mode: PolicyMode
  source: PolicySource
  origin: string
}
