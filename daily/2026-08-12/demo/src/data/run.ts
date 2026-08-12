import type { AgentRun } from '../types';

// ── 全 mock 的一段自治 agent 运行轨迹 ───────────────────────────────────────
// 场景：昨晚把「给后台管理页加『导出 CSV』并修掉相关 flaky 测试」丢给一个自治 agent，
// 它跑了约 4 小时、41 步、动了 9 个文件、拐了 2 次弯、替你做了 3 个假设、留了 2 个悬案，
// 还按 Continual Harness 给自己改了 2 处（新增 skill / 更新 memory）。
// 说明：以下全部为脚本化 mock 数据，非在线推理。

export const run: AgentRun = {
  goal: '给后台管理页加「导出 CSV」，并修掉相关的 flaky 测试',
  task:
    '在后台「客户管理」页加一个「导出 CSV」按钮：导出当前列表数据；同时 export.test.ts 里有个一直时好时坏的 flaky 用例，顺手修掉。做完提个 PR。',
  agent: 'autodev-agent · Opus 5（自治后台运行）',
  startedAt: '2026-08-11 23:10 → 08-12 01:14（过夜自治运行 · 跨度约 2h04m）',

  chapters: [
    {
      id: 'ch1',
      phase: '确认目标',
      title: '读后台表格与客户模型，摸清现状',
      oneLiner:
        '开跑前先读代码：定位后台客户表格、现有列表接口与客户字段，确认仓库里还没有任何导出实现。',
      why:
        '这是一段纯探索——它读了 AdminTable、列表查询、客户字段，并搜了一圈确认没有现成导出。没有改任何文件，也没有做出需要你拿主意的决定，属于"只是过程"的章节（打开「只看需要我决定的」时会被折叠掉）。',
      tools: [
        { tool: 'read_file', arg: 'AdminTable.tsx' },
        { tool: 'grep', arg: '"export|download" 全仓库' },
        { tool: 'read_file', arg: 'api/customers.ts' },
        { tool: 'read_file', arg: 'types/customer.ts' },
      ],
      touchedFiles: [],
      durationMin: 12,
      diff: [],
      relatedAssumptionIds: [],
      relatedLooseEndIds: [],
      relatedSelfEditIds: [],
    },
    {
      id: 'ch2',
      phase: '首次尝试',
      title: '定下导出范围 = 当前筛选，一次性生成整个 CSV',
      oneLiner:
        '抽了个 ExportButton 组件、写了导出接口；沿用列表 filterState 把导出范围定为"当前筛选结果"，并用"一次性在内存里拼完整个 CSV 再整体返回"的最直接实现。',
      why:
        '两个你没拍板过的判断都发生在这一章：① 它把「导出」默认成"眼前筛选的这批"而非整表备份（沿用 filterState）；② 为先跑通选了同步一次性生成——把结果全查出来、在内存里拼成大字符串、一次 res.send。数据量小没问题，几十万行会把内存和响应打爆，它没有考虑分页 / 流式。',
      tools: [
        { tool: 'write', arg: 'components/ExportButton.tsx' },
        { tool: 'edit', arg: 'AdminTable.tsx（挂载按钮）' },
        { tool: 'edit', arg: 'types/customer.ts（导出列白名单）' },
        { tool: 'write', arg: 'api/export.ts' },
        { tool: 'run_tests', arg: 'npm test -- export（先挂后过）' },
      ],
      touchedFiles: [
        'components/ExportButton.tsx',
        'AdminTable.tsx',
        'types/customer.ts',
        'api/export.ts',
      ],
      durationMin: 40,
      diff: [
        { kind: 'hunk', text: '@@ components/ExportButton.tsx（新建）' },
        { kind: 'add', text: "export function ExportButton({ filter }: { filter: Filter }) {" },
        { kind: 'add', text: "  const onClick = () => downloadCsv('/api/export', filter);" },
        { kind: 'add', text: '  return <button onClick={onClick}>导出 CSV</button>;' },
        { kind: 'add', text: '}' },
        { kind: 'hunk', text: '@@ api/export.ts（新建）' },
        { kind: 'add', text: 'export async function exportCustomersCsv(req, res) {' },
        { kind: 'add', text: '  const rows = await queryCustomers(req.filter); // 沿用列表筛选' },
        { kind: 'add', text: '  const header = EXPORT_COLUMNS.join(",");' },
        { kind: 'ctx', text: '  const line = (r) =>' },
        { kind: 'add', text: '    EXPORT_COLUMNS.map((c) => r[c]).join(",");' },
        { kind: 'add', text: '  const csv = header + "\\n" + rows.map(line).join("\\n"); // 一次拼完整个 CSV' },
        { kind: 'add', text: "  res.setHeader('Content-Type', 'text/csv');" },
        { kind: 'add', text: '  res.send(csv); // 整体返回，未分页 / 未流式' },
        { kind: 'add', text: '}' },
      ],
      relatedAssumptionIds: ['A1', 'A2'],
      relatedLooseEndIds: [],
      relatedSelfEditIds: [],
    },
    {
      id: 'ch3',
      phase: '遇阻转向',
      title: 'flaky 测试其实是时区问题，转头先把测试稳住',
      oneLiner:
        '那个时好时坏的用例根因是本地时区 vs CI 时区不一致；它把日期格式化钉到固定时区，并假设 CI 跑在 UTC 改了断言。',
      why:
        '它没有蛮干重试，而是定位到 flaky 根因是时区。修法本身合理（格式化钉死时区）。但它把测试断言改成了 UTC 期望值，前提是"CI 运行在 UTC"——这个前提它没有核实，如果你们 CI 其实设了别的时区，测试会在别处再挂。',
      tools: [
        { tool: 'run_tests', arg: '重跑复现 flaky' },
        { tool: 'grep', arg: '"toLocale|timezone|Date(" 定位断言' },
        { tool: 'read_file', arg: 'dateUtils.ts / export.test.ts' },
        { tool: 'reason', arg: '假设 CI = UTC' },
        { tool: 'edit', arg: 'dateUtils.ts / *.test.ts（断言改 UTC）' },
      ],
      touchedFiles: ['dateUtils.ts', 'export.test.ts', 'dateUtils.test.ts'],
      durationMin: 32,
      diff: [
        { kind: 'hunk', text: '@@ dateUtils.ts' },
        { kind: 'del', text: 'export const fmtDate = (d: Date) => d.toLocaleDateString();' },
        { kind: 'add', text: 'export const fmtDate = (d: Date) =>' },
        { kind: 'add', text: "  new Intl.DateTimeFormat('en-CA', { timeZone: 'UTC' }).format(d);" },
        { kind: 'hunk', text: '@@ export.test.ts' },
        { kind: 'del', text: "expect(row.created).toBe('2026/8/10'); // 本地时区" },
        { kind: 'add', text: "expect(row.created).toBe('2026-08-10'); // ← 假设 CI = UTC" },
        { kind: 'hunk', text: '@@ dateUtils.test.ts' },
        { kind: 'del', text: "expect(fmtDate(d)).toBe('2026/8/10');" },
        { kind: 'add', text: "expect(fmtDate(d)).toBe('2026-08-10');" },
      ],
      relatedAssumptionIds: ['A3'],
      relatedLooseEndIds: [],
      relatedSelfEditIds: [],
    },
    {
      id: 'ch4',
      phase: '收敛',
      title: '统一 CSV 转义 + 加 UTF-8 BOM，测试全绿',
      oneLiner:
        '抽出转义函数、给导出加了 UTF-8 BOM（防中文在 Excel 乱码），4/4 测试通过——但它只加了 BOM，没真的用 Excel 验过。',
      why:
        '它在自测里发现中文列在 Excel 打开会乱码，加了 BOM 修正。这是对的方向，但它承认"没有实际用 Excel 打开验证过"，只信任 BOM 能解决。中文 + 逗号 + 换行的组合在真实 Excel 里还有边界情况，这一步留了个需要你确认的尾巴。',
      tools: [
        { tool: 'edit', arg: 'csvFormat.ts（escape + BOM）' },
        { tool: 'edit', arg: 'api/export.ts（用 withBom）' },
        { tool: 'edit', arg: 'i18n/zh.ts（导出中文案）' },
        { tool: 'run_tests', arg: '全量通过 4/4' },
      ],
      touchedFiles: ['csvFormat.ts', 'api/export.ts', 'i18n/zh.ts'],
      durationMin: 28,
      diff: [
        { kind: 'hunk', text: '@@ csvFormat.ts（新建）' },
        { kind: 'add', text: 'export const escapeCsv = (v: string) =>' },
        { kind: 'add', text: '  /[",\\n]/.test(v) ? \'"\' + v.replace(/"/g, \'""\') + \'"\' : v;' },
        { kind: 'add', text: "export const withBom = (csv: string) => '\\uFEFF' + csv; // 防 Excel 中文乱码" },
        { kind: 'hunk', text: '@@ api/export.ts' },
        { kind: 'del', text: '  res.send(csv);' },
        { kind: 'add', text: '  res.send(withBom(csv));' },
        { kind: 'hunk', text: '@@ i18n/zh.ts' },
        { kind: 'add', text: "  'export.pending': '导出中…'," },
      ],
      relatedAssumptionIds: [],
      relatedLooseEndIds: ['L1'],
      relatedSelfEditIds: [],
    },
    {
      id: 'ch5',
      phase: '自我修订',
      title: '读自己的轨迹，给自己新增 1 个 skill、更新 1 条 memory',
      oneLiner:
        '收尾前它跑了 /refine：把这趟踩到的两个教训沉淀成自己的持久状态——一个新 skill、一条更新的 memory。',
      why:
        '这是 Continual Harness 式的自我修订：它不只改了你的项目，还改了"它自己下次会怎么做"。这些改动按 ID 可回滚，但如果你从不看，你的 agent 会在你不知情的情况下慢慢变成另一个样子。随读把它单独拎出来给你读。',
      tools: [
        { tool: 'refine', arg: '读本趟轨迹，起草最小自我修订' },
        { tool: 'skill.add', arg: 'csv-export-bom' },
        { tool: 'memory.update', arg: 'flaky-tests' },
      ],
      touchedFiles: [],
      durationMin: 3,
      diff: [],
      relatedAssumptionIds: [],
      relatedLooseEndIds: [],
      relatedSelfEditIds: ['SE1', 'SE2'],
    },
    {
      id: 'ch6',
      phase: '收尾',
      title: '写 PR 描述并如实列出未决项',
      oneLiner:
        '生成了 PR 描述，并诚实列出未决项——其中包括"导出接口没有加权限校验"，任何登录用户都能导出全部客户数据。',
      why:
        '它把功能做完并自评，还主动列出了悬案。最重的一条是：导出接口沿用了列表查询，但没有加导出权限校验——在真实系统里，这意味着一个普通客服账号也能一键导走全部客户名单。它标了出来，但没有替你决定要不要拦，这正是需要你拿主意的地方。',
      tools: [
        { tool: 'write', arg: 'PR 描述草稿' },
        { tool: 'note', arg: '列出 2 处悬案' },
        { tool: 'done', arg: '汇报完成' },
      ],
      touchedFiles: [],
      durationMin: 6,
      diff: [],
      relatedAssumptionIds: [],
      relatedLooseEndIds: ['L2'],
      relatedSelfEditIds: [],
    },
  ],

  assumptions: [
    {
      id: 'A1',
      text: '把「导出」理解为"导出当前筛选后的结果"，而不是整张客户表。',
      divergence: 2,
      rationale: '它看到列表已有 filterState，推断你想要的是"眼前这批"。但你也可能是想做全表备份。',
      evidenceStep: 6,
      chapterId: 'ch2',
    },
    {
      id: 'A2',
      text: '用"同步一次性生成整个 CSV 再整体返回"实现，未考虑大数据量的分页 / 流式。',
      divergence: 3,
      rationale: '为先跑通选了最直接实现。数据量小没问题，几十万行会打爆内存与响应。',
      evidenceStep: 14,
      chapterId: 'ch2',
    },
    {
      id: 'A3',
      text: '假设 CI 运行在 UTC，据此把测试断言改成了 UTC 期望值。',
      divergence: 1,
      rationale: '为稳住 flaky 把断言钉死到 UTC；前提"CI=UTC"没有核实，若 CI 设了别的时区会再挂。',
      evidenceStep: 24,
      chapterId: 'ch3',
    },
  ],

  looseEnds: [
    {
      id: 'L1',
      text: '中文列在 Excel 的乱码只加了 UTF-8 BOM，没有真的用 Excel 打开验证过。',
      severity: 2,
      chapterId: 'ch4',
    },
    {
      id: 'L2',
      text: '导出接口没有加权限校验：任何登录用户都能导出全部客户数据（数据越权风险）。',
      severity: 3,
      chapterId: 'ch6',
    },
  ],

  selfEdits: [
    {
      id: 'SE1',
      kind: 'skill',
      op: 'add',
      name: 'csv-export-bom',
      after:
        '导出 CSV 时一律在文件开头加 UTF-8 BOM（\\uFEFF），以防中文在 Excel 打开乱码；并统一走 escapeCsv 处理逗号/引号/换行。',
      evidence:
        '本趟在 ch4 花了两轮才定位到"中文在 Excel 乱码"，加 BOM 后解决。',
      futureImpact:
        '下次它再遇到"生成给人用 Excel 打开的 CSV"，会直接加 BOM，不再重复踩坑——但也可能对"不需要 BOM 的纯机器消费场景"过度应用。',
      chapterId: 'ch5',
    },
    {
      id: 'SE2',
      kind: 'memory',
      op: 'update',
      name: 'flaky-tests',
      before: '（空）',
      after:
        '本仓库的 flaky 测试多为时区 / 时钟相关：遇到时好时坏的用例，先查日期格式化与断言里的本地时区依赖。',
      evidence:
        '本趟在 ch3 把一个 flaky 用例定位为时区不一致并修复。',
      futureImpact:
        '下次遇到 flaky 测试它会优先怀疑时区/时钟，定位更快——但若某次 flaky 其实是并发问题，这条 memory 可能把它带偏。',
      chapterId: 'ch5',
    },
  ],

  rawLog: [
    { step: 1, t: '23:10:04', tool: 'read_file', text: 'AdminTable.tsx —— 定位后台客户表格组件' },
    { step: 2, t: '23:10:31', tool: 'grep', text: '"export|download" —— 检索仓库是否已有导出实现（无）' },
    { step: 3, t: '23:11:02', tool: 'read_file', text: 'api/customers.ts —— 看现有列表查询接口' },
    { step: 4, t: '23:11:40', tool: 'read_file', text: 'types/customer.ts —— 看客户字段与敏感列' },
    { step: 5, t: '23:12:15', tool: 'read_file', text: 'AdminTable.tsx#filterState —— 看当前筛选状态' },
    { step: 6, t: '23:13:50', tool: 'reason', text: '决定：导出范围 = 当前筛选后的结果（沿用 filterState），非全表' },
    { step: 7, t: '23:20:11', tool: 'write', text: 'components/ExportButton.tsx —— 新建导出按钮组件' },
    { step: 8, t: '23:24:33', tool: 'edit', text: 'AdminTable.tsx —— 在工具栏挂载 ExportButton' },
    { step: 9, t: '23:29:07', tool: 'edit', text: 'types/customer.ts —— 加 EXPORT_COLUMNS 导出列白名单' },
    { step: 10, t: '23:35:52', tool: 'write', text: 'api/export.ts —— 新建导出接口 exportCustomersCsv' },
    { step: 11, t: '23:41:20', tool: 'edit', text: 'api/export.ts —— 拼接 CSV 字符串' },
    { step: 12, t: '23:44:02', tool: 'run_tests', text: 'npm test -- export —— 失败：模块解析错误' },
    { step: 13, t: '23:46:39', tool: 'edit', text: 'api/export.ts —— 修 import 路径' },
    { step: 14, t: '23:49:10', tool: 'reason', text: '采用同步一次性生成整体返回（未考虑大数据量流式）' },
    { step: 15, t: '23:52:44', tool: 'run_tests', text: 'npm test -- export —— 通过 3/4，1 个用例 flaky 失败' },
    { step: 16, t: '23:55:01', tool: 'read_file', text: 'export.test.ts —— 查看失败用例' },
    { step: 17, t: '00:02:18', tool: 'run_tests', text: '重跑：同一用例时而过、时而挂（确认 flaky）' },
    { step: 18, t: '00:06:55', tool: 'grep', text: '"toLocale|timezone|Date(" —— 定位时间相关断言' },
    { step: 19, t: '00:09:30', tool: 'read_file', text: 'dateUtils.ts —— 看日期格式化' },
    { step: 20, t: '00:12:11', tool: 'read_file', text: 'export.test.ts#assert —— 看断言处' },
    { step: 21, t: '00:15:48', tool: 'reason', text: '判断 flaky 根因 = 本地时区 vs CI 时区不一致' },
    { step: 22, t: '00:18:20', tool: 'read_file', text: 'dateUtils.test.ts' },
    { step: 23, t: '00:23:07', tool: 'edit', text: 'dateUtils.ts —— 用固定时区(UTC)格式化' },
    { step: 24, t: '00:26:40', tool: 'reason', text: '假设 CI 运行在 UTC，据此把断言改为 UTC 期望值' },
    { step: 25, t: '00:29:12', tool: 'edit', text: 'export.test.ts —— 断言改为 UTC' },
    { step: 26, t: '00:31:55', tool: 'edit', text: 'dateUtils.test.ts —— 同步修断言' },
    { step: 27, t: '00:36:22', tool: 'run_tests', text: '全量：通过' },
    { step: 28, t: '00:41:03', tool: 'edit', text: 'csvFormat.ts —— 抽出 CSV 转义函数 escapeCsv' },
    { step: 29, t: '00:45:39', tool: 'edit', text: 'api/export.ts —— 统一走 escapeCsv' },
    { step: 30, t: '00:48:10', tool: 'run_tests', text: '通过' },
    { step: 31, t: '00:51:44', tool: 'note', text: '自测发现：中文列在 Excel 打开乱码' },
    { step: 32, t: '00:55:20', tool: 'edit', text: 'csvFormat.ts —— 输出前加 UTF-8 BOM' },
    { step: 33, t: '00:58:02', tool: 'edit', text: "i18n/zh.ts —— 加『导出中…』提示文案" },
    { step: 34, t: '01:01:37', tool: 'run_tests', text: '通过 4/4' },
    { step: 35, t: '01:03:12', tool: 'note', text: '未实测 Excel 打开效果（仅加 BOM，凭经验判断已修）' },
    { step: 36, t: '01:06:50', tool: 'refine', text: '/refine：读本趟轨迹，起草最小且有证据支撑的自我修订' },
    { step: 37, t: '01:08:05', tool: 'skill.add', text: '新增 skill「csv-export-bom」' },
    { step: 38, t: '01:09:11', tool: 'memory.update', text: '更新 memory「flaky-tests」（时区/时钟）' },
    { step: 39, t: '01:12:44', tool: 'write', text: 'PR 描述草稿' },
    { step: 40, t: '01:14:02', tool: 'note', text: '未加导出权限校验（任何登录用户可导全部客户数据）' },
    { step: 41, t: '01:14:31', tool: 'done', text: '汇报完成 + 列出 2 处悬案' },
  ],
};
