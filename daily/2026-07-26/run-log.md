# Run Log — 2026-07-26

## 使用的报告
- `daily/2026-07-26/source-report.md`（由 `scripts/collect_recent_reports.py --days 1` 于 2026-07-26 00:02 UTC 从公开 product-hunt-radar 拉取，`2026-07-26.md`，当日报告已发布，无滞后复用）。
- 报告主线：技术向"agent 运行时/集成层/开发环境正被重做成开源、可自托管的基础设施"（Velane 16/18、OpenComputer 16/18、ADE 15/18）；2C 仅 ChatGPT Health（16/18）一款达标。趋势 #1 开源自持、#2 agent 从工具消费者→构建者。

## Loop 1 — 机会发现（客观 + 创新）
- 客观提取信号并区分"报告事实 vs 我的独立判断"：认同"运行时开源自持""agent 成为工具构建者"是真趋势；质疑并修正报告把今日机会默认落在"造运行时能力"——真正被忽视、且刚被 OpenComputer 续跑/分叉原语变得可做的，是给多步 agent 会话的"事后归因 + 纠偏分叉"决策层。
- 生成 4 个候选并五维打分：
  - A 岔口 Forkpoint（可续跑会话的时间旅行归因+纠偏分叉，riding OpenComputer）：**23/25** ✓ 选中
  - B 复真 Veritas（agent 自写集成的语义现实校验，riding Velane）：19/25
  - C 择优台（并行编码 agent best-of-N 裁决，riding ADE）：19/25（与历史 ForkLab 过近）
  - D 复诊 Recheck（2C 就诊闭环，riding ChatGPT Health）：17/25（2C 信号薄 + 医疗归因难诚实呈现）
- 决策：最高分 23/25 ≥ 16 门槛 → 进入 Demo。刻意避开过热的治理/审批/审计/信任邻域（07-21..07-24 已反复警惕），也与 07-24 榫卯（跨 agent 数据形状契约、写入时预防）明确区分（岔口=单会话执行轨迹、事后根因+纠偏）。

## Loop 2 — Demo 设计
- 策略分型：抽象/基础设施类 → 纯前端"模拟体验 + 价值可视化"（会话事件日志回放 + 交互式纠偏分叉重放 + before/after 对比）。
- 三页：① 会话回放 ② 岔口纠偏 ③ 归因台账。核心成功标准：3 分钟看懂"解决什么/怎么用/增量在哪"，并亲手体验"非折返步 fork 结论不变 / 折返步 fork 结论翻转"。

## Loop 3 — Demo 开发
- 技术栈 Vite + React + TS，复用 07-24 已验证的 scaffold（tsconfig / vite.config `base:'./'` / main.tsx / SVG data-URI favicon）。
- 一个确定性引擎 `src/logic/engine.ts` 驱动三视图：给定每步决策（指标列 / 清洗规则）复算逐步状态、目标不变量违反、最终结论；折返步 = 最早"被违反且——单独修正它就能让最终结论翻转为正确——"的步；`applyFork` 用确定性重放证明因果。
- mock 会话：9 步数据分析 agent 会话，第 5 步把 `retained`(D1) 误当 `retained_d7`(D7) → 错误结论"建议全量上线"；第 3 步有真实但非因果的脏数据异常（判别力对照）。

## Loop 4 — 自动验证
- 引擎预校验：esbuild 打包 `_verify.ts` → Node 运行，全部断言通过（折返步=5、fork@3 不翻转、fork@5 翻转且变正确、lift +8pp→-1pp、p 0.008→0.620、价值指标 5/4/-8/1），随后删除临时文件。
- `bash scripts/validate_demo.sh daily/2026-07-26/demo`：**首轮通过（0 修复轮次）**。npm install 成功；`tsc -b && vite build` 成功；dist/index.html 非空且含 `id="root"`；1 个 JS bundle。
- 提交源码并 push（`[new branch]`）后做浏览器实测：本人修复了一处 CSS 隐性 bug（`--muted-2` 十六进制含空格 `#6d7 aa2`，写入时即改为 `#6d7aa2`，未影响 build）。
- 浏览器实测：`npm run preview` @ 4173 + computerUse 子代理走完三页全流程；本人核对 `06-fork-step5-flip.png` 像素，确认关键数字（+8pp→-1pp、p=0.620、全量上线→暂不上线、指标卡 5/4/-8/1）与中文渲染均正确（子代理 OCR 曾把 0.620 误读为 0.020，以代码/像素为准）。截图存 `daily/2026-07-26/screenshots/`（01-replay-default … 07-ledger）。

## Loop 5 — 体验自评
- 见 `evaluation.md`。结论 **PASS**。

## 遇到的问题
- CSS 变量 `--muted-2` 曾误写含空格的十六进制（写入后立即修正）。
- computerUse 子代理对部分中文/数字 OCR 有失真（已知现象），以引擎断言 + 本人截图核对为准。
- 环境：VM 时钟启动瞬间一度显示 07-25，随即校正为 07-26（与 cron 触发时间 2026-07-26T00:00:49Z 一致），确认 DATE=2026-07-26。注意到 `daily/2026-07-25/` 是上一次 run（bc-43c33393）中断留下的**不完整**产物（缺 evaluation/run-log/status.json），属他人历史遗留，不在本次（07-26）任务范围，未改动。

## 最终结论
- 选中机会：**岔口 Forkpoint**，五维 23/25。
- 构建：PASS（首轮通过 + smoke + 引擎预校验 + 浏览器三页实测）。
- status：**PASS / ok**。
