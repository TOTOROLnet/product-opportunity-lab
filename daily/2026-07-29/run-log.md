# Run Log — 2026-07-29

## 使用的报告
- `daily/2026-07-29/source-report.md`（由 `scripts/collect_recent_reports.py --days 1` 从 public product-hunt-radar 拉取的 `2026-07-29.md`）。
- 报告主线（报告事实）：三条 A 类趋势——① 评估/可观测从"看板"升级为运行时"执行层"并合流进自我改进闭环（Prefactor、Cekura）；② 垂直 Agent 从"回复"走向"在真实业务系统里执行 + 自建流程/工具"（Conduit、Superunit）；③ Agent 记忆/公司大脑做成用户自持、结构化、带审批的层（Liminal、FlowTask）。B 端偏薄（Pinery、SUB/WAVE 单点）。

## Loop 1 — 机会发现（关键决策）
- 客观性判断：今天最响的信号是"评估即执行"（Prefactor），但报告**自己点破**其命门是"判官质量 / 误杀误批直接打断业务"。据此我不去再造一个能拦/杀的平台，而坐到其**上游**。
- 主动避开重复区：授权/审批"该不该放行某动作"这条线本实验室已做多轮（信任阶梯 07-21、付前一秒 07-22、合流 07-27 等），今天不做又一个审批闸。
- 生成 3 个候选并五维评分：
  - A 准星 Zhǔnxīng（运行时 LLM 判官的归零校准台）：4+4+5+5+4 = **22/25** ✅ 选中
  - B 记来处（Agent 记忆溯源与对质层）：4+3+4+4+4 = 19/25（与做过的漂移/工件契约邻近，减分）
  - C 护栏台账（Agent 自学 SOP/工具 diff 审阅）：3+3+4+4+3 = 17/25（本质仍是审批闸，重复，减分）
- 门槛：最高分 22 ≥ 16 → 进入 Demo。
- 不照抄声明四项齐全（见 opportunity.md 第 5 节）：切入"评估即执行"上游做元评估/校准层；与 Prefactor 互补而非替代（准星不下达任何运行时动作）。

## Loop 2 — Demo 设计（关键决策）
- 机会属抽象/基础设施类 → 采用"模拟体验 + 价值可视化"策略（混淆矩阵 + 代价曲线 + 分歧钻取 + before/after）。
- 三页：① 校准台（阈值滑杆 + 混淆矩阵 + 成绩单 + 代价曲线）② 分歧（失败模式补丁 + 案例卡）③ 出厂判定（朴素 vs 校准 before/after）。
- 明确边界：无登录/DB/支付/外部 API/LLM 调用；判官分为确定性替身。

## Loop 3 — Demo 开发（关键决策）
- 技术栈 Vite + React + TS，`vite.config.ts` 设 `base: './'`。沿用上一天可 build 的依赖版本组合以降低风险。
- 确定性引擎 `src/logic/engine.ts`：evaluate（混淆矩阵/率/代价）、costCurve、recommendedThreshold、zeroMiss/zeroKillThreshold。
- mock 黄金集 15 条（10 ALLOW / 5 BLOCK），设计使故事成立并**在开发前用独立脚本预验证数值**：
  - 默认 T=70 无补丁：命中 2、误杀 2（20%）、漏放 3（60%）、总代价 340。
  - 两补丁 + 最小代价阈值（引擎算出 = 60）：误杀 1（10%）、漏放 0、总代价 10。
  - 附带诚实洞察：不打补丁时最优也只能到代价 20（需过度拦截 2 个正常退款才能零漏放）。

## Loop 4 — 自动验证（build 轮次与结果）
- `bash scripts/validate_demo.sh daily/2026-07-29/demo`：**一次通过（build_attempts = 1，修复 0 轮）**。
  - npm install 成功；`tsc -b && vite build` 成功（36 modules，~0.46s）；dist/index.html 非空含 `id="root"`；有 JS bundle。
- 浏览器实测（computerUse @ 127.0.0.1:4173，HTTP 200）：四屏均正常渲染、**无空白页、控制台无报错**；滑杆/补丁/Tab/一键推荐交互全部联动正确；实测数字与引擎一致（默认漏放 3、误杀率 20%、代价 340；校准后漏放 0、误杀率 10%、代价 10）。
- 截图 4 张存于 `daily/2026-07-29/screenshots/`。

## 遇到的问题
- 无阻断性问题。开发前用独立脚本预验证了引擎数值，避免了 mock 数据不自洽导致的 build 后返工。

## 最终结论
- **status = PASS，reason = ok**。达门槛（22/25）+ build 一次成功 + 浏览器实测通过 + 必需产物齐全（opportunity.md / demo-spec.md / evaluation.md / run-log.md / demo/ / status.json）。
- 提交到工作分支 `cursor/bc-1f41ff1e-3430-475d-86a0-8ca1cd538631-052b` 并 push；不开 PR（cursor/** 分支由 Sync Action 自动进 main）。
