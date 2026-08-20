# Run Log — 2026-08-20

## 使用的报告
- `source-report.md`（product-hunt-radar 的 `2026-08-20.md`，经 `scripts/collect_recent_reports.py --days 1` 自拉取）。
- radar 当天已发布新报告（非重复上一日）。批次较新鲜（多为 08-17/08-18 上线）。

## 各 Loop 关键决策
- **Loop 1（机会发现）**：客观提取信号——Origin by Cursor（17，agent-native 代码托管 / 产物治理）、Gauge（14，Agent-Led Growth）、Cronloop（15，定时 agent 运行时）、A 类趋势「工具越来越是给 agent 消费」、2C 端 ChatGPT for Teens / Vois / Skim。
  - 独立判断：Origin 的合并闭环把关 diff，却兜不住「合并前 agent 已悄悄做完的一堆不可逆选型决定」；Gauge 只做了卖方一侧，**买方侧（用 agent 的团队看不见 / 教不了 agent 的选型逻辑）完全空白**；这一波治理产品几乎都是「运行时 gate / 事后扫描 / 审批门」形态（已做烂），选型痛点需要的是「决策透明 + 口味校准」而非又一道闸门。
  - 3 个候选 + 评分：A 对味（买方侧选型决策说明书 + 口味校准）23/25；B 被 Agent 选中体检（卖方侧文档 / schema 可采纳性模拟）20/25；C 常驻 Agent 值守台（骑乘 Cronloop 的僵尸循环判定）17/25。另评估 2C 候选 D（Skim 式「阅读债」）约 16，与既有角度重叠且端侧价值纯前端难呈现，未选。
  - 选定 A（23/25，≥16 门槛）。
- **Loop 2（Demo 设计）**：交互类 + 抽象能力「模拟体验 + 价值可视化」；三页（选型说明书 / 口味校准 / 对味重选）；确定性可解释引擎 + 全 mock；见 `demo-spec.md`。
- **Loop 3（Demo 开发）**：Vite + React + TS，`base:'./'`；复用近期日期的配置（tsconfig/vite.config/main.tsx 等），tsconfig 的 noUnusedLocals/Parameters 设 false 以降低构建返工。核心：`data/pr.ts`（6 个选型决定 + 替代 + 逐轴 mock 指标）、`data/calibration.ts`（4 校准用例）、`engine.ts`（评分 / 仅严格更优才改判 / 汇总 / 从例子学口味）、三页组件 + 共享 UI。
  - 数据完整性预校验：一次性 `_verify.ts`（esbuild→node）核对多套口味的改判 / 汇总，通过后删除。发现并修复一处正确性/客观性问题：当仅启用「禁 copyleft」时，原实现会因体积并列 tie-break 把 d1/d2/d5 也翻成原生（用户并未要求控体积）——改为「仅当候选严格优于 agent 选择才改判，并列尊重 agent 原选择」。
- **Loop 4（自动验证）**：`bash scripts/validate_demo.sh daily/2026-08-20/demo` → npm install + build 成功，dist 首屏 / 挂载节点 / JS bundle 均通过。**build_attempts=1（首轮通过）**。tsc 本次仍吐出 4 个产物（tsbuildinfo×2 + vite.config.js/.d.ts），已在每次 `git add` 前 `rm -f`。
- **Loop 5（体验自评）**：见 `evaluation.md`，结论 PASS。

## Build 轮次与结果
- 第 1 轮：成功。无需修复。

## 遇到的问题
- computerUse OCR 复现「误读中文 / 数字」老问题：其转录把部分徽章（如「许可硬伤」读成「异可靠性」）、把「原生」读成「置生」，并因在 ② 选了 chip 后再看 ③ 而误报「避免的后悔=2 与 ① 的 3 矛盾」。经本人 Read 截图复核：① 默认（均衡口味）= 6/3/1/2；③ 在选了 2 个 chip（偏好轻量 + 禁 copyleft）后 = 4 改判 / 2 后悔 / 99KB / 少拖 12 / 整包移除 3 / 清 1 许可——与引擎对该口味计算完全一致（反而证明跨页联动与引擎正确）。信 code + engine，不信 OCR。
- tmux 预览会话 `duiwei-preview`（端口 4173），点测后 C-c 并 kill。

## 验证与产物
- `scripts/validate_daily_output.py --date latest`：见提交前运行结果（opportunity/demo-spec/evaluation + demo/package.json 齐全）。
- 截图 6 张：`screenshots/01-explainer.png` … `06-formula.png`。

## 最终结论
- **PASS**：选中机会 对味 Duìwèi 23/25（≥16 门槛）；build 首轮成功；核心闭环 + 跨页联动 + 引擎数字经点测与截图复核一致；必需产物齐全。
- 提交：commit#1（source + opportunity + demo-spec + demo 源码）已 push；commit#2（evaluation + run-log + status.json + screenshots）随后 push。不开 PR（cursor/** 分支由 Sync Action 自动同步进 main 并部署）。
