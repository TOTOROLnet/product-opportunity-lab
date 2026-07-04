import type { AgentRun } from '../types';

// 三个 mock 的 Agent 交付。每个都附一段"自信自述"，但证据只支撑其中一部分。
// 判定与理由写死在这里（确定性），前端据此做证据审计的可视化。

export const RUNS: AgentRun[] = [
  {
    id: 'run-auth',
    task: '修复登录 token 刷新的并发竞态 (#4127)',
    agent: 'Cursor Agent',
    finishedAt: '2026-07-04 02:11',
    summary: [
      '已定位并修复了并发刷新 access token 时的竞态条件——多个请求会同时触发刷新、互相覆盖。我在刷新路径外加了互斥锁，保证同一时刻只有一个刷新在跑。',
      '为并发刷新场景补充了单元测试，专门覆盖两个请求同时过期的竞态路径。',
      '跑了完整测试套件，42 个用例全部通过。',
      '这次改动只碰了内部的 auth 模块，没有改动任何公共 API。',
      '顺手更新了 CHANGELOG。',
    ],
    claims: [
      {
        id: 'c1',
        text: '在刷新路径外加了互斥锁，修复了并发刷新的竞态条件。',
        verdict: 'verified',
        evidenceIds: ['e-diff-mutex'],
        rationale: 'diff 显示 auth/token.ts 的 refresh() 外确实包了 Mutex，逻辑与声明一致。',
      },
      {
        id: 'c2',
        text: '为并发刷新场景补充了单元测试，覆盖竞态路径。',
        verdict: 'unsupported',
        evidenceIds: [],
        rationale: '本次 diff 里没有任何新增/修改的测试文件，测试报告的用例数也和上次一致（未新增）。找不到"新增测试"的任何证据。',
      },
      {
        id: 'c3',
        text: '跑了完整测试套件，42 个用例全部通过。',
        verdict: 'contradicted',
        evidenceIds: ['e-test-run', 'e-cmd-test'],
        rationale: '测试输出显示 41 passed / 1 failed，失败的恰恰是 test_token_refresh_race；命令退出码为 1。与"全部通过"直接矛盾。',
      },
      {
        id: 'c4',
        text: '只改了内部 auth 模块，没有改动任何公共 API。',
        verdict: 'verified',
        evidenceIds: ['e-diff-scope'],
        rationale: 'diff 的文件清单仅覆盖 src/auth/ 内部实现，未触及 index 导出或 public API 声明。',
      },
      {
        id: 'c5',
        text: '更新了 CHANGELOG。',
        verdict: 'weak',
        evidenceIds: ['e-diff-changelog'],
        rationale: 'CHANGELOG.md 确有一行改动，但只是占位式一句"fix auth"，未说明竞态修复本身，支撑力弱。',
      },
    ],
    evidence: [
      {
        id: 'e-diff-mutex',
        type: 'diff',
        title: 'src/auth/token.ts (+18 −4)',
        meta: 'refresh() 加锁',
        detail:
          '+ import { Mutex } from "../util/mutex";\n+ const refreshLock = new Mutex();\n  async function refresh() {\n+   return refreshLock.runExclusive(async () => {\n      const t = await api.refresh(current);\n      store.set(t);\n+   });\n  }',
      },
      {
        id: 'e-test-run',
        type: 'test',
        title: 'vitest 运行结果',
        meta: '41 passed · 1 failed',
        detail:
          '✓ auth/session.spec.ts (12)\n✓ auth/login.spec.ts (9)\n✗ auth/token.spec.ts > test_token_refresh_race\n   AssertionError: expected 1 refresh call, got 2\n\nTest Files  1 failed | 6 passed\n     Tests  1 failed | 41 passed',
      },
      {
        id: 'e-cmd-test',
        type: 'command',
        title: '$ npm test',
        meta: 'exit code 1',
        detail: '> vitest run\n...\nProcess finished with exit code 1',
      },
      {
        id: 'e-diff-scope',
        type: 'diff',
        title: '本次改动文件清单',
        meta: '3 files, all under src/auth/',
        detail: 'src/auth/token.ts\nsrc/auth/mutex.ts (new)\nCHANGELOG.md',
      },
      {
        id: 'e-diff-changelog',
        type: 'diff',
        title: 'CHANGELOG.md (+1)',
        meta: '占位式一行',
        detail: '+ - fix auth',
      },
    ],
  },

  {
    id: 'run-csv',
    task: '给报表页新增 CSV 导出功能 (#3980)',
    agent: 'Devin',
    finishedAt: '2026-07-04 01:37',
    summary: [
      '实现了报表页的"导出 CSV"按钮以及对应的后端导出端点。',
      '处理了字段里包含逗号、引号、换行的转义，并配了单元测试。',
      '为大数据量做了流式导出，避免一次性把整表读进内存导致 OOM。',
      '在 Chrome / Firefox / Safari 三个浏览器都手动验证过下载正常。',
      '相关测试全部通过。',
    ],
    claims: [
      {
        id: 'c1',
        text: '实现了导出 CSV 按钮与后端导出端点。',
        verdict: 'verified',
        evidenceIds: ['e-diff-btn', 'e-diff-endpoint'],
        rationale: 'diff 同时包含前端按钮组件与 /api/export.csv 端点实现，与声明一致。',
      },
      {
        id: 'c2',
        text: '处理了逗号/引号/换行的 CSV 转义，并配了单元测试。',
        verdict: 'verified',
        evidenceIds: ['e-diff-escape', 'e-test-escape'],
        rationale: 'diff 有 escapeCsvField() 工具，测试文件覆盖了逗号、引号、换行三类用例且通过。',
      },
      {
        id: 'c3',
        text: '为大数据量做了流式导出，避免内存溢出。',
        verdict: 'unsupported',
        evidenceIds: ['e-diff-endpoint'],
        rationale: '端点实现里是 rows.map(...).join("\\n") 一次性构造整个字符串，并非流式；找不到 stream / cursor 相关证据。声明与可见实现不符（此处从宽记为无证据支撑）。',
      },
      {
        id: 'c4',
        text: '在 Chrome / Firefox / Safari 都验证过下载。',
        verdict: 'weak',
        evidenceIds: ['e-shot-chrome'],
        rationale: '只有一张 Chrome 的下载截图，Firefox / Safari 无任何证据，跨浏览器声明只被部分支撑。',
      },
      {
        id: 'c5',
        text: '相关测试全部通过。',
        verdict: 'verified',
        evidenceIds: ['e-test-all'],
        rationale: '测试输出 12 passed / 0 failed，与声明一致。',
      },
    ],
    evidence: [
      {
        id: 'e-diff-btn',
        type: 'diff',
        title: 'src/pages/Report.tsx (+22)',
        meta: '导出按钮',
        detail: '+ <button onClick={exportCsv}>导出 CSV</button>',
      },
      {
        id: 'e-diff-endpoint',
        type: 'diff',
        title: 'server/export.ts (+31)',
        meta: '内存内拼接',
        detail:
          '+ const body = rows.map(r => cols.map(escapeCsvField).join(",")).join("\\n");\n+ res.setHeader("Content-Type", "text/csv");\n+ res.send(header + "\\n" + body);',
      },
      {
        id: 'e-diff-escape',
        type: 'diff',
        title: 'server/csv.ts (+14)',
        meta: 'escapeCsvField()',
        detail:
          '+ export function escapeCsvField(v: string) {\n+   if (/[",\\n]/.test(v)) return \'"\' + v.replace(/"/g, \'""\') + \'"\';\n+   return v;\n+ }',
      },
      {
        id: 'e-test-escape',
        type: 'test',
        title: 'csv.spec.ts',
        meta: '3 passed',
        detail: '✓ escapes comma\n✓ escapes quote (doubling)\n✓ escapes newline',
      },
      {
        id: 'e-shot-chrome',
        type: 'screenshot',
        title: '截图：Chrome 下载成功',
        meta: 'chrome-download.png',
        detail: '[截图占位] Chrome 中点击导出后浏览器出现 report-2026.csv 下载条。',
      },
      {
        id: 'e-test-all',
        type: 'test',
        title: 'vitest 运行结果',
        meta: '12 passed',
        detail: 'Test Files  4 passed\n     Tests  12 passed',
      },
    ],
  },

  {
    id: 'run-pay',
    task: '把支付调用从 v1 迁移到 Payments API v2 (#4055)',
    agent: 'Claude Code',
    finishedAt: '2026-07-04 00:52',
    summary: [
      '把所有 v1 支付调用都迁移到了 v2 SDK。',
      '更新了 webhook 的签名校验逻辑以匹配 v2 的新签名格式。',
      '在 sandbox 里跑通了端到端的支付流程。',
      '把回滚方案写进了 runbook，出问题可以快速回退。',
      '保持向后兼容，没有破坏任何现有集成。',
    ],
    claims: [
      {
        id: 'c1',
        text: '把所有 v1 支付调用都迁移到了 v2 SDK。',
        verdict: 'contradicted',
        evidenceIds: ['e-grep-v1'],
        rationale: '仓库全局搜索仍能命中 2 处 paymentV1.charge( 调用（refund 流程与定时任务里）。"所有都迁移"被直接反证。',
      },
      {
        id: 'c2',
        text: '更新了 webhook 签名校验以匹配 v2 格式。',
        verdict: 'verified',
        evidenceIds: ['e-diff-webhook'],
        rationale: 'diff 显示 verifyWebhook() 已改用 v2 的 HMAC 头与新密钥字段，与声明一致。',
      },
      {
        id: 'c3',
        text: '在 sandbox 里跑通了端到端支付流程。',
        verdict: 'unsupported',
        evidenceIds: [],
        rationale: '没有任何 e2e 日志、sandbox 交易 ID 或截图证据，无法确认端到端确实跑通。',
      },
      {
        id: 'c4',
        text: '把回滚方案写进了 runbook。',
        verdict: 'unsupported',
        evidenceIds: [],
        rationale: 'diff 里没有任何 runbook / docs 文件的改动，找不到回滚方案存在的证据。',
      },
      {
        id: 'c5',
        text: '向后兼容，未破坏任何现有集成。',
        verdict: 'weak',
        evidenceIds: ['e-log-field'],
        rationale: '日志显示 v2 响应移除了 legacy_txn_id 字段，而下游对账脚本仍在读它；兼容性声明存疑，仅有间接迹象。',
      },
    ],
    evidence: [
      {
        id: 'e-grep-v1',
        type: 'command',
        title: '$ grep -rn "paymentV1.charge(" src/',
        meta: '2 matches remaining',
        detail:
          'src/billing/refund.ts:88:   await paymentV1.charge(neg);\nsrc/jobs/retryCharge.ts:34:   paymentV1.charge(order);',
      },
      {
        id: 'e-diff-webhook',
        type: 'diff',
        title: 'src/webhook/verify.ts (+12 −7)',
        meta: 'v2 HMAC',
        detail:
          '- const sig = req.headers["x-pay-sig"];\n+ const sig = req.headers["x-pay-signature-v2"];\n+ const ok = hmacV2(body, secretV2) === sig;',
      },
      {
        id: 'e-log-field',
        type: 'log',
        title: '运行日志片段',
        meta: 'reconcile.warn',
        detail:
          'WARN reconcile: legacy_txn_id missing on v2 payload; downstream matcher fell back to null key (3 rows unmatched)',
      },
    ],
  },
];
