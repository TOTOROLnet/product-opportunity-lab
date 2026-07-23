# Run Log — 2026-07-23

## 使用的报告
- `daily/2026-07-23/source-report.md`（`scripts/collect_recent_reports.py --days 1` 自拉取，
  latest = `2026-07-23.md`，当日 radar 已发布，未复用旧报告）。
- 当日为**技术向重头戏日**：板块 A = Gemini 3.6 Flash（效率+垂直专用，16/18）、Kastra（确定性授权
  PDP/治理，15/18）、box（持久+可 fork 的 agent 计算原语，14/18）；板块 B **仅 AGINE Academy 一款达标**
  （游戏化「学会用 AI」+ AI 导师反馈闭环，12/18）。

## Loop 1 — 机会发现（关键决策）
- **独立判断**：报告 #1 结构性信号是治理（Kastra）。但我**主动避开**——(a) 治理/审批/审计/信任是我近两周
  已高度密集覆盖的家族（TrustLadder/Gavel…），机制新意近 0；(b) 极易克隆；(c) 中间层易被 IDE/CLI 原生
  审批挤掉（报告自己也点了这个风险）。据「机制新意/差异化/受众宽度/未被解决程度」判断，今天最值得
  原型化的机会在被报告一笔带过的 **2C 侧**。
- 生成 3 候选并五维评分：
  - A 上手 Knack（AI 用法教练，行为诊断优先）——痛点4/机制4/AI核4/可行4/启发4 = **20/25** ✅ 选中
  - B 降配有据 Rightsize（按步模型降配的证据）——4/3/4/4/4 = 19/25（评测+路由拥挤、与 07-14 值当重叠）
  - C 分岔台 ForkLab（riding box fork 的并行探索台）——3/3/3/4/4 = 17/25（受众窄、parallel-agents 拥挤）
  - （另主动否决：照 Kastra 做治理 PDP 面板——过度覆盖 + 克隆风险，不计入。）
- 门槛：最高分 20/25 ≥ 16，进入 Demo。不照抄声明四项 + 报告事实/独立判断表见 `opportunity.md`。

## Loop 2 — Demo 设计
- 分型：可视化/交互类（在 mock 用法语料上的交互式诊断 + 价值可视化）。因真实产品需读用户 AI 历史
  （隐私/无统一导出口），Demo 用「真实感 mock 语料 + 确定性诊断引擎」并诚实标注为模拟。
- 三页：诊断台 / 招式库（含 before/after 复盘）/ 长进（before-after 对比）。详见 `demo-spec.md`。

## Loop 3 — Demo 开发
- 技术栈：Vite 5.4 + React 18.3 + TS 5.6；`vite.config.ts` `base:'./'`。复用 07-22 的 tsconfig/vite.config
  脚手架。核心：
  - `src/data/corpus.ts`：persona「林果」20 条真实感协作 + 7 类失手签名 taxonomy（人话解释/招式/模板/严重度）。
  - `src/logic/engine.ts`：确定性引擎——每次协作打质量分（gaveup=0 / settled=0.4 / satisfied=1−0.12·(轮−1)），
    按 primary 失手聚合、以「影响力=严重度×结果损失」排序；掌握一招按「修复 70%、残留 30%」重算指标
    （诚实：不瞬间满分）。同一引擎驱动诊断台与长进两页。
- 逻辑预验证（esbuild harness，构建 UI 前）：基线上手指数 **48**（一次过10%/返工3轮/放弃15%/将就45%），
  Top-3 招式 = 目标含糊/首稿即收/要事实不给依据；掌握 Top-3 后 **48→72**（30%/2.3轮/5%）；满掌握上限 **81**
  （非 100 = 诚实）；单调性自检 OK。修掉一个比率取整失真（round1 令 0.15→0.2）后数字正确。harness 用后删除。

## Loop 4 — 自动验证
- `bash scripts/validate_demo.sh daily/2026-07-23/demo`：**通过**。`npm install` OK；`npm run build`
  **首轮成功（0 次修复）**；dist 首屏非空、含 `id="root"`、有 JS bundle。
- 处理 `tsc -b` 产物：删除 `*.tsbuildinfo`/`vite.config.js`/`vite.config.d.ts`，并在根 `.gitignore` 加对应
  忽略规则；先提交 demo 源码，暂存区干净（不含 node_modules/dist/artifacts）。

## 浏览器验证（computerUse 子代理 @ preview 4173）
- 三页渲染正常、交互无阻断；4 张主步骤截图（01-diagnosis/02-moves/03-mastered3/04-progress）存
  `daily/2026-07-23/screenshots/`。
- 实测：诊断台基线上手指数 48 + 指标 10%/3/15%/45%；标记掌握 3 招后长进页升至 71–72 一档、带绿色 ▲ 增量；
  四条 before/after 对比条全部渲染；数字跨页自洽、随交互实时变化。
- 唯一控制台报错 `favicon.ico 404` → 已补 inline SVG favicon 并重建（不影响功能）。
- 子代理疑似把顶栏「已掌握 3/7」OCR 误读为 0/7；该计数与勾选/长进读同一 mastered 状态、同帧渲染，实际为 3
  （识别误差，非程序缺陷）。

## 遇到的问题
1. 比率经 `round1` 再转百分比会失真（0.15→0.2）——改为比率保留原始精度、仅展示时 `Math.round(x*100)`。
2. `tsc -b` 向 demo 目录吐 tsbuildinfo/vite.config.js(.d.ts) 产物——按既有 playbook 用 .gitignore + 先提交源码规避。

## 最终结论
- **status = PASS**（reason=ok）。达门槛（20/25）+ build 首轮成功 + 必需产物齐全 + 浏览器实测闭合。
- 选中机会：**上手 Knack**（AI 用法教练，行为诊断优先）；非照抄 AGINE Academy（课程优先）。
- 产物：opportunity.md / demo-spec.md / demo/ / evaluation.md / run-log.md / status.json / screenshots/。
