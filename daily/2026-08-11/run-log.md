# Run Log — 2026-08-11

## 使用的报告
- `daily/2026-08-11/source-report.md`（由 `scripts/collect_recent_reports.py --days 1` 从 public product-hunt-radar 拉取，latest = `2026-08-11.md`）。
- 日期核对：cron triggeredAt 2026-08-11T00:01Z，VM `date -u` 与 `TZ=Asia/Shanghai` 均为 8-11，无时钟抖动。

## 报告要点（报告事实）
- 技术向"零历史命中"较多：Prime Agent（17/18，自我改进 harness：RLM + Continual Harness）、Paritok（15/18，可逆学习式 token 压缩网关）、oqoqo（14/18，测"agent 能否用你产品"的评测平台）。
- **久违的新 2C 信号两个**：SecondBrain Note by GenSpark（14/18，端侧 AI 录音器→记忆→代办）、AI Group Call（12/18，输入目标进入六个 AI 实时语音辩论）。

## Loop 1 — 机会发现（客观 + 创新）
- 独立判断：连续多日（08-07/08/09/10）技术向 + audit/gate/preflight/calculator 形态已做穿；今天出现真实 2C 信号，换维度补 2C。
- 生成 3 个候选并按五维打分：
  - A **众读 Zhòngdú**（骑 AI Group Call，反转为读者接收模拟）：4+4+4+5+4 = **21/25**
  - B 分歧地图 Crux Map（多 AI 给分歧点而非答案）：4+3+4+4+3 = 18/25（决策辅助拥挤 + 触碰已做旧的"诚实/不确定性"基因）
  - C 递归剧场 RLM Playground（骑 Prime Agent RLM 的设计期模拟器）：3+4+4+4+4 = 19/25（受众窄 + 贴已重度开采的 agent-runtime 脉络）
- 最终选择：**A 众读（21/25）**，达 16/25 门槛 → 进入 Demo。

## Loop 2 — Demo 设计
- 分型：可视化/交互类，读者反应用脚本化预计算 mock 驱动。
- 三 Tab：① 围读台（逐句回放）② 接收热力图（词/句级 + 诊断）③ 改前改后（改法开关 + 接收分对比）。

## Loop 3 — Demo 开发
- 技术栈：Vite 5.4 + React 18.3 + TypeScript 5.6，`vite.config.ts` `base:'./'`（复用近期已验证配置）。
- 结构：`types.ts` + `logic/engine.ts`（确定性纯函数：resolveReactions / readerTrace / replayEvents / buildHeatmap / topFrictions / analyze）+ `data/`（readers 6 画像池、samples 3 段样本各含完整 panel×sentences 基线反应 + 3 改法）+ `components/`（ConfigBar / ReadingRoom / HeatmapTab / BeforeAfterTab / shared）+ `App.tsx`。
- 数值预核对：一次性 `_verify.ts`（esbuild→node）确认三样本 BEFORE 36/43/43、目标第 4 句流失；AFTER 95/91/90、读到底、无摩擦点；核对后删除 `_verify.ts`。

## Loop 4 — 自动验证（build 轮次）
- 第 1 轮：`bash scripts/validate_demo.sh daily/2026-08-11/demo` 失败——`BeforeAfterTab.tsx` 误写 `data.sample.edits`（应为 `data.edits`），TS2339。
- 修复后第 2 轮：**成功**。`dist/index.html` 非空、含 `id="root"`、1 个 JS bundle。build_attempts = 2。
- 提交前清理 tsc 产物（`*.tsbuildinfo`、`vite.config.js`、`vite.config.d.ts`）。

## 提交与测试顺序
- commit#1（测试前）：source-report + opportunity.md + demo-spec.md + demo 源码 → push（`[new branch]`）。
- 浏览器验证：tmux 起 `npm run preview`（127.0.0.1:4173，200），computerUse 全流程点击 + 6 张截图存 `screenshots/`；自查 01/04 截图确认中文清晰、无报错、数字与引擎一致（36→95，第 4 句流失→读到底）。
- commit#2（本次）：evaluation.md + run-log.md + status.json + screenshots → push。

## 遇到的问题
- 首轮 TS 属性引用错误（已修，见上）。
- computerUse 转写对横幅中文有 OCR 误读——属其转写工件，非应用缺陷（已用自查截图核对，实际渲染正确）。

## 最终结论
- 达门槛（21/25）+ build 成功 + 必需产物齐全 + 核心流程闭合 → **status = PASS，reason = ok**。
