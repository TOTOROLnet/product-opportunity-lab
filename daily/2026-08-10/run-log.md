# Run Log — 2026-08-10

## 使用的报告

- `daily/2026-08-10/source-report.md`（由 `python3 scripts/collect_recent_reports.py --days 1` 自公共 product-hunt-radar 拉取，latest = `2026-08-10.md`）。
- 报告核心信号：技术向 **Soup CLI**（16/18，逐层流式 + NF4 把 8B 微调压进 4GB 显存、一条命令后训练）与「后训练下沉到消费级硬件」趋势；2C 端 **Grok Imagine 2.0**（14/18，精确编辑）与 **Omniwork**（13/18，多 Agent 编排 + 创作记忆）。

## Loop 1 — 机会发现（客观 + 创新）

- 客观性：显式区分「报告事实 vs 我的独立判断」。核心独立判断——报告庆祝 Soup 降低了「跑得起来（run barrier）」，但我判断真正的下一个瓶颈是「该不该调 / 选哪种 / 塞不塞得下（decision barrier）」，这是报告忽略的结构性转移；并对 Soup 的 3.32GB/119.6 tok/s（官方自测、未核实）与「黑箱自动决策」提出质疑。
- 生成 3 个创新候选并五维打分：
  - A 预调 Pretune（后训练飞行前决策+显存副驾）：**21/25**
  - B 改图意图翻译器（模型无关精确编辑配方规划器）：16/25
  - C 创作记忆可移植层（厂商中立风格记忆编译器）：17/25
- 选中 **A（21/25）**：痛点更增量、机制防克隆（训练之前 vs Soup 执行层黑箱）、最契合技术向方向、一天可落地为高质量演示。
- 门槛判定：最高分 21 ≥ 16 → **进入 Demo 开发**。

## Loop 2 — Demo 设计

- 机会属「抽象 / CLI / 基础设施类」→ 采用纯前端「模拟体验 + 价值可视化」：决策树显性化 + 显存 before/after 条形对比 + 逐层流式动画 + 方法对号矩阵。
- 页面≤3：三个 Tab（该不该调 / 塞不塞得下 / 怎么调）+ 共享左侧配置面板。产出 `demo-spec.md`。

## Loop 3 — Demo 开发

- 技术栈 Vite + React + TypeScript；`vite.config.ts` 设 `base: './'`。
- 结构：`logic/engine.ts`（确定性决策树 + 透明显存公式 + 方法对号 + 训练计划）、`data/*`（tasks/models/hardware/methods 全 mock）、`components/*`（ConfigPanel + DecisionTab + VramTab + MethodTab + shared）。
- 无后端 / LLM / 数据库 / 密钥 / 登录 / 支付 / 外部 API；不真正读取 GPU、不跑训练；显存均为透明估算并显式标注非实测。

## Loop 4 — 自动验证

- `bash scripts/validate_demo.sh daily/2026-08-10/demo`：**退出码 0，首轮通过（build 修复轮次 0/3）**。
- `npm install` 成功（67 packages）；`npm run build` 成功（41 modules，~0.45s）；`dist/index.html` 非空且含 `id="root"`；`dist/assets` 含 1 JS + 1 CSS。
- 额外做真实浏览器体验验证（preview HTTP 200）：三 Tab 渲染正常，改硬件 4GB→24GB 时推荐 SimPO→ORPO、显存 OOM→塞得下实时联动，无 JS 报错（仅良性 favicon 404）。

## Loop 5 — 体验自评

- 产出 `evaluation.md`，结论 **PASS**：build 首轮通过 + 产物齐全 + 三屏功能与实时联动实测正常 + 明确引用报告信号 + 创新切入点清晰 + 非 Soup 克隆。

## 遇到的问题

- 无阻塞性问题。构建首轮即通过；浏览器验证中仅发现 favicon 404（良性，不影响功能）。

## 最终结论

- **status = PASS，reason = ok**。选中机会「预调 Pretune」，得分 21/25（门槛 16），Demo 构建成功、产物齐全、体验实测通过。
