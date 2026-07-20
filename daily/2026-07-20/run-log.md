# Run Log — 2026-07-20

## 使用的报告

- `daily/2026-07-20/source-report.md`（product-hunt-radar `2026-07-20.md`，`collect_recent_reports.py --days 1` 自拉取）。
- 当日报告非滞后（07-20 当天雷达已发布，与运行同日）。核心新信号集中在**技术向底层**：
  - **Rewisp（14/18）**：macOS 纯文本"环境记忆"，`⌘⇧Space` PULL 提问、模型逐级回退、承诺追踪、**MCP 只读**供给 Claude/Cursor。
  - **BaseRT（13/18）**：Apple Silicon 原生 Metal 本地推理运行时。
  - 趋势：MCP 固化为给 agent 供给「记忆/数据/技能」的标准接口；端侧/本地 AI 加码。2C 今日无新达标品。

## 各 Loop 关键决策

- **Loop 1 机会发现**：生成 3 个候选并按五维打分——
  - A 知时 Aptly（环境记忆的"有节制主动召回决策层"）= **21/25** ✅ 选中
  - B 过境 CrossGuard（记忆→云/agent 出境预览+可逆脱敏）= 18/25（且属我过度的 governance 家族，避让）
  - C 定论 Settled（时间感知定论/矛盾消解）= 18/25（与 07-17 常青 重叠，避让）
  - 关键独立判断（与报告口径的分歧）：Rewisp 的价值瓶颈在 **PULL 悖论**（你不知道自己忘了）与"无克制的 PUSH 沦为噪音"，而非记忆存储本身——这是本机会的立论基础。
  - 达门槛（≥16）→ 进入 Demo。
- **Loop 2 Demo 设计**：判定为抽象/基础设施类 → 采用"模拟体验 + 价值可视化"（脚本化时间线回放 + before/after + 玻璃盒）。3 个页面。
- **Loop 3 Demo 开发**：Vite+React+TS，复用 07-19 的 scaffold（tsconfig/vite.config base:'./'/main.tsx）。核心是确定性引擎 `src/logic/engine.ts`：同一条"一个上午"trace 分别用朴素/知时策略回放。
  - 先用 esbuild harness 预验证引擎数值，再建 UI（我的既有可靠打法）。
- **Loop 4 自动验证**：`scripts/validate_demo.sh daily/2026-07-20/demo` → **首轮通过（0 次修复）**。build 产出 dist、smoke 通过。
- **Loop 5 体验自评**：computerUse 子 agent 全流程点测 4 张截图；页面 6 项指标与引擎实测**完全一致**；无视觉 bug。结论 PASS。

## 引擎实测数值（确定性、可复现）

| 指标 | 朴素推送 | 知时 Aptly |
| --- | --- | --- |
| 总打扰 | 8 | 4 |
| 有用命中 | 3 | 4 |
| 精确率 | 38% | 100% |
| 关键时刻覆盖 | 3/4（漏"退款 API 参数变更"） | 4/4 |
| 过时/有害推送 | 2 | 0 |
| 正确沉默 | 1/4 | 4/4 |

## build 轮次与结果

- 第 1 轮：`tsc -b && vite build` 成功。无需修复。

## 遇到的问题

- `tsc -b` 照例产出 `*.tsbuildinfo`、`vite.config.js/.d.ts` 到 demo 目录 → 已在根 `.gitignore` 追加忽略模式，`git add daily/2026-07-20` 不会带入这些产物（dist/node_modules 本就忽略）。

## 最终结论

- status = **PASS**，reason = **ok**。选中机会 知时 Aptly（21/25，≥16 门槛），build 成功，必需产物齐全。
- 已把 `daily/2026-07-20/` 提交并 push 到 cursor 工作分支；不开 PR（由 Sync Action 自动进 main + 部署 Pages）。
