import type {
  AgentAction,
  Diagnosis,
  Reversibility,
  RunVerdict,
} from '../types'

// ---------------------------------------------------------------------------
// Reverso analysis engine.
//
// Everything here is DETERMINISTIC: a Diagnosis is DERIVED from the action's
// kind + params + context flags. Nothing is hard-coded per scenario. Flip a
// flag (e.g. a snapshot/backup exists) and the classification recomputes.
// ---------------------------------------------------------------------------

interface Rule {
  reversibility: Reversibility
  undo: (a: AgentAction) => string[]
  blastRadius: (a: AgentAction) => string[]
  undoCostMs: number
  undoMoney?: number
  note: string
}

const num = (v: number) => v

// A rule can depend on context flags; we resolve the effective rule per action.
function resolveRule(a: AgentAction): Rule {
  switch (a.kind) {
    case 'file.write':
      return {
        reversibility: 'REVERSIBLE',
        undo: (x) => [
          `git checkout -- ${x.target}`,
          `# 若非 git 跟踪：从工作区快照恢复 ${x.target}`,
        ],
        blastRadius: (x) => [`文件 ${x.target}`],
        undoCostMs: num(800),
        note: '纯文件内容变更，有版本 / 快照即可干净还原。',
      }

    case 'file.delete':
      return a.snapshot
        ? {
            reversibility: 'COMPENSABLE',
            undo: (x) => [
              `从快照恢复 ${x.target}`,
              `校验恢复后的内容与权限`,
            ],
            blastRadius: (x) => [`文件 ${x.target}`],
            undoCostMs: 2000,
            note: '删除前已打快照，可从快照恢复（需校验一致性）。',
          }
        : {
            reversibility: 'IRREVERSIBLE',
            undo: () => [
              `无快照 → 无法恢复被删文件`,
              `处方：删除前先打快照 / 移入回收区，再删`,
            ],
            blastRadius: (x) => [`文件 ${x.target}（内容永久丢失）`],
            undoCostMs: 0,
            note: '删除前未打快照，内容不可恢复。',
          }

    case 'git.commit':
      return {
        reversibility: 'REVERSIBLE',
        undo: () => [`git reset --soft HEAD~1  # 保留改动，撤销提交`],
        blastRadius: () => ['本地 git 历史'],
        undoCostMs: 300,
        note: '本地提交，reset/revert 即可撤销。',
      }

    case 'git.push':
      return a.shared
        ? {
            reversibility: 'COMPENSABLE',
            undo: (x) => [
              `git revert <sha> && git push`,
              `通知已 pull 的协作者 rebase（${x.target}）`,
            ],
            blastRadius: (x) => [`远端分支 ${x.target}`, '可能已 pull 的协作者'],
            undoCostMs: 5000,
            note: '推到共享分支，可 revert 但他人可能已拉取，需协调。',
          }
        : {
            reversibility: 'REVERSIBLE',
            undo: (x) => [`git push --force-with-lease origin ${x.target}  # 回退到前一提交`],
            blastRadius: (x) => [`远端 feature 分支 ${x.target}`],
            undoCostMs: 1500,
            note: '推到个人 / feature 分支，无人依赖，可安全回退。',
          }

    case 'git.force_push':
      return {
        reversibility: 'COMPENSABLE',
        undo: (x) => [
          `找回旧 ref：git reflog / 远端 reflog`,
          `git push --force-with-lease 恢复到被覆盖的 sha（${x.target}）`,
          `# 若 reflog 已过期则无法恢复`,
        ],
        blastRadius: (x) => [`远端分支 ${x.target}`, a.shared ? '所有协作者的历史' : '本分支历史'],
        undoCostMs: 12000,
        note: '强推覆盖历史，仅在 reflog 窗口内可救，高风险。',
      }

    case 'shell.run':
      // A shell command is destructive only if flagged so.
      return a.detail === 'destructive' && !a.snapshot
        ? {
            reversibility: 'IRREVERSIBLE',
            undo: () => [`无法自动逆转任意破坏性 shell 命令`, `处方：先快照 / dry-run，再执行`],
            blastRadius: (x) => [`本机文件系统（${x.target}）`],
            undoCostMs: 0,
            note: '破坏性 shell 命令且无快照，副作用不可枚举、不可逆。',
          }
        : {
            reversibility: 'REVERSIBLE',
            undo: () => [`无状态副作用（构建 / 测试类命令），无需回滚`],
            blastRadius: () => ['无持久副作用'],
            undoCostMs: 0,
            note: '只读 / 构建类命令，不改持久状态。',
          }

    case 'db.migrate.additive':
      return {
        reversibility: 'COMPENSABLE',
        undo: (x) => [
          `执行 down migration 删除新增结构（${x.target}）`,
          `# 若期间已写入数据，需先导出该数据`,
        ],
        blastRadius: (x) => [`schema ${x.target}`],
        undoCostMs: 8000,
        note: '加列 / 加表可 down migration，但期间新写入的数据需另处理。',
      }

    case 'db.migrate.destructive':
      return a.hasBackup
        ? {
            reversibility: 'COMPENSABLE',
            undo: (x) => [
              `从备份恢复被删结构与数据（${x.target}）`,
              `期间停写，恢复后校验一致性`,
            ],
            blastRadius: (x) => [`schema + 数据 ${x.target}`, '恢复期停机'],
            undoCostMs: 90000,
            note: '删列 / 删表有备份可恢复，但需停机 + 一致性校验。',
          }
        : {
            reversibility: 'IRREVERSIBLE',
            undo: () => [`无备份 → 被删列 / 表的数据永久丢失`, `处方：迁移前强制自动备份`],
            blastRadius: (x) => [`schema + 数据 ${x.target}（永久丢失）`],
            undoCostMs: 0,
            note: '破坏性迁移且无备份，数据不可恢复。',
          }

    case 'db.delete_rows':
      return a.hasBackup
        ? {
            reversibility: 'COMPENSABLE',
            undo: (x) => [`从备份 / binlog 回放恢复被删行（${x.target}）`, `校验行数与外键`],
            blastRadius: (x) => [`表 ${x.target} 的记录`],
            undoCostMs: 30000,
            note: '删行有备份可回放恢复，需校验完整性。',
          }
        : {
            reversibility: 'IRREVERSIBLE',
            undo: () => [`无备份 → 被删记录无法恢复`, `处方：软删除 / 先备份再删`],
            blastRadius: (x) => [`表 ${x.target} 的记录（永久丢失）`],
            undoCostMs: 0,
            note: '硬删除且无备份，记录不可恢复。',
          }

    case 'http.get':
      return {
        reversibility: 'REVERSIBLE',
        undo: () => [`只读请求，无副作用，无需回滚`],
        blastRadius: () => ['无副作用'],
        undoCostMs: 0,
        note: '幂等只读调用，不改远端状态。',
      }

    case 'http.post':
      // Third-party non-idempotent side effect: undoable only if a documented
      // compensating endpoint exists (modeled via detail === 'has-compensation').
      return a.detail === 'has-compensation'
        ? {
            reversibility: 'COMPENSABLE',
            undo: (x) => [`调用对应补偿 / 撤销接口（${x.target}）`, `确认幂等键未重复生效`],
            blastRadius: (x) => [`外部系统 ${x.target}`],
            undoCostMs: 4000,
            note: '非幂等外部写调用，但有文档化的补偿接口。',
          }
        : {
            reversibility: 'IRREVERSIBLE',
            undo: () => [`外部副作用未知 / 无补偿接口 → 无法保证撤销`, `处方：要求对方提供撤销接口 + 幂等键`],
            blastRadius: (x) => [`外部系统 ${x.target}（副作用不可控）`],
            undoCostMs: 0,
            note: '非幂等外部写调用且无补偿接口，副作用不可撤销。',
          }

    case 'message.send':
      return {
        reversibility: 'IRREVERSIBLE',
        undo: () => [`已送达的邮件 / 消息无法撤回`, `只能补发更正说明（不等于撤销）`],
        blastRadius: (x) => [`收件人 ${x.target}（已阅不可收回）`],
        undoCostMs: 0,
        note: '消息一旦送达，收件人已读，本质不可撤销。',
      }

    case 'deploy.release':
      return {
        reversibility: 'COMPENSABLE',
        undo: (x) => [`回滚到上一个 release（${x.target}）`, `观测健康指标恢复`],
        blastRadius: (x) => [`线上服务 ${x.target}`, '回滚窗口内的用户请求'],
        undoCostMs: 20000,
        note: '发布可回滚到上一版本，但存在暴露 / 抖动窗口。',
      }

    case 'payment.charge':
      return {
        reversibility: 'COMPENSABLE',
        undo: (x) => [`发起退款（${x.target}）`, `# 手续费不退，且影响客户信任`],
        blastRadius: (x) => [`客户账务 ${x.target}`, '资金 + 手续费 + 信任'],
        undoCostMs: 60000,
        undoMoney: 30,
        note: '扣款可退款补偿，但资金已流动、手续费损失、客户体验受损。',
      }

    case 'cloud.delete_resource':
      return a.hasBackup
        ? {
            reversibility: 'COMPENSABLE',
            undo: (x) => [`从备份 / 快照重建资源（${x.target}）`, `重连依赖并校验`],
            blastRadius: (x) => [`云资源 ${x.target}`, '重建期间不可用'],
            undoCostMs: 120000,
            note: '删除云资源有备份可重建，耗时且期间不可用。',
          }
        : {
            reversibility: 'IRREVERSIBLE',
            undo: () => [`无备份 → 资源与数据永久销毁`, `处方：删除前强制快照 + 保留期`],
            blastRadius: (x) => [`云资源 ${x.target}（永久销毁）`],
            undoCostMs: 0,
            note: '销毁云资源且无备份，数据永久丢失。',
          }

    default: {
      // Exhaustiveness guard.
      const _never: never = a.kind
      return {
        reversibility: 'IRREVERSIBLE',
        undo: () => [`未知动作类型：${String(_never)}`],
        blastRadius: () => ['未知'],
        undoCostMs: 0,
        note: '未知动作类型，保守视为不可逆。',
      }
    }
  }
}

export function analyzeAction(a: AgentAction): Diagnosis {
  const rule = resolveRule(a)
  return {
    actionId: a.id,
    reversibility: rule.reversibility,
    undo: rule.undo(a),
    blastRadius: rule.blastRadius(a),
    undoCostMs: rule.undoCostMs,
    undoMoney: rule.undoMoney,
    note: rule.note,
  }
}

function headlineFor(
  status: RunVerdict['status'],
  irreversibleCount: number,
  compensableCount: number,
): string {
  if (status === 'STOP') {
    return `发现 ${irreversibleCount} 个不可逆动作：过临界线后无法回退，建议在临界点前插入人工确认 / 自动快照。`
  }
  if (status === 'CHECKPOINT') {
    return `全部可退，但有 ${compensableCount} 个动作撤销有代价（时间 / 金钱 / 停机），建议设检查点后再放行。`
  }
  return `本次 run 的所有动作均可干净回退，可安全放行。`
}

export function analyzePlan(actions: AgentAction[]): {
  diagnoses: Diagnosis[]
  verdict: RunVerdict
} {
  const ordered = [...actions].sort((x, y) => x.ts - y.ts)
  const diagnoses = ordered.map(analyzeAction)

  let reversibleCount = 0
  let compensableCount = 0
  let irreversibleCount = 0
  let totalUndoCostMs = 0
  let totalUndoMoney = 0
  let pointOfNoReturnId: string | null = null

  for (const d of diagnoses) {
    if (d.reversibility === 'REVERSIBLE') reversibleCount += 1
    else if (d.reversibility === 'COMPENSABLE') compensableCount += 1
    else {
      irreversibleCount += 1
      if (pointOfNoReturnId === null) pointOfNoReturnId = d.actionId
    }
    totalUndoCostMs += d.undoCostMs
    totalUndoMoney += d.undoMoney ?? 0
  }

  const status: RunVerdict['status'] =
    irreversibleCount > 0 ? 'STOP' : compensableCount > 0 ? 'CHECKPOINT' : 'SAFE'

  return {
    diagnoses,
    verdict: {
      status,
      headline: headlineFor(status, irreversibleCount, compensableCount),
      pointOfNoReturnId,
      reversibleCount,
      compensableCount,
      irreversibleCount,
      totalUndoCostMs,
      totalUndoMoney,
    },
  }
}

// "Reverso 保护网": simulate auto-snapshot/backup before risky actions, which
// upgrades snapshot/backup-recoverable actions from IRREVERSIBLE to COMPENSABLE.
export function applySafetyNet(actions: AgentAction[]): AgentAction[] {
  const snapshotable: Array<AgentAction['kind']> = ['file.delete', 'shell.run']
  const backupable: Array<AgentAction['kind']> = [
    'db.migrate.destructive',
    'db.delete_rows',
    'cloud.delete_resource',
  ]
  return actions.map((a) => {
    if (snapshotable.includes(a.kind)) return { ...a, snapshot: true }
    if (backupable.includes(a.kind)) return { ...a, hasBackup: true }
    return a
  })
}

export function fmtDuration(ms: number): string {
  if (ms <= 0) return '—'
  if (ms < 1000) return `${ms}ms`
  const s = ms / 1000
  if (s < 60) return `${s % 1 === 0 ? s : s.toFixed(1)}s`
  const m = Math.floor(s / 60)
  const rem = Math.round(s % 60)
  return rem ? `${m}m${rem}s` : `${m}m`
}
