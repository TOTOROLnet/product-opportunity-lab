# Run Log — 2026-07-27

## 使用的报告
- `daily/2026-07-27/source-report.md`（product-hunt-radar 2026-07-27，`collect_recent_reports.py --days 1` 自拉取）。
- 报告自述为**滞后窗口**（`fetched_at` 缓存在 07-24），约七成为 07-24～07-26 旧品；真正新增：A 类 Openbase（13/18，语音 IDE + 手机审批）、Athena by Shoplazza（13/18，电商后台运营 Agent + 逐条预览确认）；B 类 PureBox.ai（12/18，复核优先收件箱 + 可撤回 + MCP）。共同主题：Agent 有真实写权限后如何让人放心授权 / 可撤销。

## 日期判定
- 系统 VM 时钟在 pod 启动瞬间显示 07-25（已知 CLOCK QUIRK），但 cron triggeredAt = 2026-07-27T00:01:27Z、上下文时间戳 / user_info 均为 Jul 27，且 radar 已发布 `2026-07-27.md`。据此判定 **DATE = 2026-07-27**（与记忆教训一致：信 cron 触发日期，不信瞬时 VM 时钟）。执行中途 `date` 已自行校正到 Jul 27。

## 各 Loop 关键决策
- **Loop 1（机会发现）**：报告本轮几乎单一主题＝「审批 / 预览 / 可回滚」。记忆强烈提示治理 / 审批 / 可逆性方向已过度饱和，应多样化、优先 2C。
  - 生成 3 候选：A 合流（整批 dry-run + 涌现冲突检测，rides Athena，23/25）；B 只审模糊的那几封（收件箱置信度校准分流，rides PureBox，22/25）；C 反悔账本（从撤回动作学习预警，16/25）。
  - 按分数择优选 **A（23/25）**。诚实权衡：A 与「审批」相邻、且近三日均为 TECH（多样化压力指向 2C 的 B）；但 A 的核心是**分析引擎（碰撞检测 / dry-run / linter）而非审批面板**，且直接反驳报告头号论点（逐条预览有结构性盲区），新意与说服力更高，与既有治理 / 可逆性选题在**子问题**上不重叠 → 选 A，并在 opportunity.md 显式做非克隆 & 自我防克隆声明。
  - 门槛：23 ≥ 16，进入 Demo。
- **Loop 2（Demo 设计）**：抽象 / 基础设施类 → 纯前端「模拟体验 + 价值可视化 + before/after」。3 tab：①变更计划（逐条视图）②联动风险（合流视图）③决策与回滚。
- **Loop 3（Demo 开发）**：Vite + React 18 + TS，`base:'./'`，复用 07-26 脚手架配置。单一确定性引擎 `src/logic/engine.ts` 驱动三页。mock：7 SKU 目录 + 12 条 Agent 变更 + 5 类业务不变量。
- **引擎预验证**：写 `_verify.ts`，`npx esbuild --bundle | node` 跑通，确认 7 处冲突（3 高）+ 推荐剔除 {M4,M8,M10,M11} → 归零，全部数字与手算一致；验证后删除 `_verify.ts`。
- **Loop 4（自动验证）**：`bash scripts/validate_demo.sh daily/2026-07-27/demo`。
  - 第 1 轮 FAIL：`engine.ts` `computeMetrics` 未用参数 `resolved` → `noUnusedParameters`。删参数 + 改调用点。
  - 第 2 轮 PASS：build 成功，dist/index.html 含挂载节点，1 个 JS bundle。
- **Loop 5（体验自评）**：见 `evaluation.md`，结论 PASS。

## build 轮次与结果
- 第 1 轮：FAIL（TS6133 unused param）。
- 第 2 轮：PASS。共 1 次修复，未超 3 轮。

## 遇到的问题
- CSS 收尾处误写坏 hex `#5f7characters`（记忆里反复出现的同类 gotcha）→ 构建前眼查修正为 `#5f708a`。
- computerUse 子代理对中文 / 数字 OCR 有误读（如「照单全批」读成「照单全收」、headline 串字）——属已知转录 artifact，非 App bug；已本人抽查 `05-decide-after.png` / `02-clash.png` 两张截图确认中文干净、数字正确（¥69.0×0.9×0.95=¥59.0<¥62、表格 7→0、价值卡 0/0/4/8）。

## 浏览器实测
- tmux 起 `vite preview @4173`，curl 200，computerUse 走完 3 页全流程并截图至 `daily/2026-07-27/screenshots/`（01-plan … 05-decide-after）。全部交互正常（tab 切换、clash 高亮、toggle 实时复算、一键剔除转绿归零）。测试后 kill tmux。

## 提交
- commit#1（源码）：source-report + opportunity + demo-spec + demo 源码 → push（[new branch]）。
- commit#2（本次）：evaluation + run-log + status.json + screenshots → push。
- 不开 PR（cursor/** 由 sync 自动同步进 main 并触发部署）。

## 最终结论
- **status = PASS，reason = ok**。选中机会 合流 Héliú（23/25），Demo build 成功、产物齐全、流程闭合、数字可复算、为非克隆创新切入点。
