# Run Log — 2026-07-16

## 使用的报告
- `daily/2026-07-16/source-report.md`（由 `scripts/collect_recent_reports.py --days 1` 从公开 product-hunt-radar 拉取，latest = `2026-07-16.md`）。
- 报告主线：技术向"富矿"——① AI 员工/团队从编排框架转向**治理机制**（YAGNI）；② **文档/画布成为 agent 可直接写入的一等界面**（Tiptap AI Toolkit / Campus / Mantle Clerk）；③ **"Skill 即产品"/Claude 生态外溢**（Crustdata Recruiter 把招聘判断编码成 6 个 Claude Skill）。2C 偏弱，仅 V2Fun（生成式 3D 角色）达标且不成趋势。

## Loop 1 — 机会发现（关键决策）
- 客观提取 4 组信号（治理 / 文档界面 / Skill 即产品 / 2C 3D），显式区分"报告事实"与"我的判断"。
- **核心独立判断**：报告首推的 YAGNI 治理层与我近 12 天几乎全部选题（Pane/明约/值当/Mneme…"控制/审计/治理"家族）高度同族，跟随＝自我重复，**主动放弃**（在 opportunity.md 记为被显式放弃的候选 X）。
- 生成 3 个创新候选并五维评分：
  - A 随读（文档改动的意图级简报）：18/25——仍属审阅家族。
  - B **师承（专家批改带教出可检验 Skill）：23/25**。
  - C 捏形（生成式 3D）：14/25——纯前端无法诚实演示 3D 质量、赛道拥挤，淘汰。
- 修正报告对 Crustdata 的解读：它暴露的不是"护城河样板"，而是"**专家判断 → Skill 的生产鸿沟**"（供给侧），几乎无人正面做。
- 门槛：最高分 23/25 ≥ 16 → 进入 Demo 开发。

## Loop 2 — Demo 设计
- 定型：抽象/工具类，但兼具可交互性 → **模拟体验 + 价值可视化 + 真实迷你规则引擎**。
- 三主视图：① 带教（看判断→批改→技能卡实时生长）② 技能卡（规则来源/权重/开关/编辑/导出）③ 验收（before/after 一致率双环 + 逐候选人归因 + 规则实时开关）。
- 全部 mock；示例域＝支付公司"高级后端工程师"初筛（化名）。

## Loop 3 — Demo 开发
- Vite + React + TypeScript；`vite.config.ts` 设 `base: './'`。
- 关键实现：`src/data/rules.ts` 5 条确定性特征谓词规则；`src/logic/engine.ts` 迷你规则引擎（按规则顺序、后命中覆盖前者）+ 一致率计算；`src/data/cases.ts` 8 训练 case + 9 holdout case（含专家 ground truth）。
- 诚实设计：holdout 保留 1 个始终不一致 case（协作维度未覆盖），如实体现规则不完美/过拟合。

## Loop 4 — 自动验证
- `bash scripts/validate_demo.sh daily/2026-07-16/demo`：**一次通过**（npm install OK；tsc + vite build OK；dist/index.html 非空含 root；1 个 JS bundle）。build 修复轮次：**0/3**。
- 额外手动浏览器走查（computerUse）：全流程可用；一致率 33% → 89%（+56%）；验收页关规则实时下降 89%→78%→67%，证明数字实算。截图见 `screenshots/`。

## Loop 5 — 体验自评
- 结论 **PASS**：build 通过 + smoke 全过 + 核心闭环手动验证 + 引用报告"Skill 即产品"信号 + 非照抄 + 诚实保留不完美 case。详见 `evaluation.md`。

## 遇到的问题
- 首版 `engine.ts` 写了一个未填充 `perCase` 的冗余 `evaluate`（会违反类型），提交前重写为单一 `evaluate` 返回完整结果，构建即通过。
- CSS 里一处笔误的颜色值（`#3a4considera`）在构建前修正为合法 hex。

## 最终结论
- status = **PASS**，reason = ok。选中机会：师承（Shicheng），23/25。
- 产物齐全：opportunity.md / demo-spec.md / demo/（可 build）/ evaluation.md / run-log.md / status.json / source-report.md / screenshots/。
