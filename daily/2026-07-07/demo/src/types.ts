// Domain model for Reverso — the "backward path" layer for agent runs.
// An agent run is a sequence of state-changing actions. Reverso classifies
// each action's REVERSIBILITY and generates a concrete ROLLBACK runbook,
// then finds the run's POINT OF NO RETURN and an overall verdict.

export type ActionKind =
  | 'file.write'
  | 'file.delete'
  | 'git.commit'
  | 'git.push'
  | 'git.force_push'
  | 'shell.run'
  | 'db.migrate.additive'
  | 'db.migrate.destructive'
  | 'db.delete_rows'
  | 'http.get'
  | 'http.post'
  | 'message.send'
  | 'deploy.release'
  | 'payment.charge'
  | 'cloud.delete_resource'

// REVERSIBLE  = clean inverse exists, cheap.
// COMPENSABLE = undoable but with cost / side effects / a follow-up window.
// IRREVERSIBLE = no way back once done.
export type Reversibility = 'REVERSIBLE' | 'COMPENSABLE' | 'IRREVERSIBLE'

export interface AgentAction {
  id: string
  ts: number // relative offset in ms from run start
  actor: string // which agent emitted it
  kind: ActionKind
  target: string // human-readable target
  detail?: string
  // Context flags that materially change reversibility:
  snapshot?: boolean // a workspace/file snapshot was taken before this action
  hasBackup?: boolean // a DB / resource backup exists
  shared?: boolean // shared branch / prod / others may already depend on it
}

export interface Diagnosis {
  actionId: string
  reversibility: Reversibility
  undo: string[] // concrete rollback runbook steps
  blastRadius: string[] // what is affected
  undoCostMs: number // estimated wall-clock cost to undo
  undoMoney?: number // monetary cost of compensation (USD)
  note: string // plain-language cause
}

export type RunStatus = 'SAFE' | 'CHECKPOINT' | 'STOP'

export interface RunVerdict {
  status: RunStatus
  headline: string
  pointOfNoReturnId: string | null // first IRREVERSIBLE action
  reversibleCount: number
  compensableCount: number
  irreversibleCount: number
  totalUndoCostMs: number
  totalUndoMoney: number
}

export interface Scenario {
  id: string
  name: string
  summary: string
  actions: AgentAction[]
}
