# Run Log — 2026-07-28

## 使用的报告
- `daily/2026-07-28/source-report.md`（= `inputs/product-hunt-reports/2026-07-28.md`，由 `scripts/collect_recent_reports.py --days 1` 从公共 product-hunt-radar 拉取，latest = 2026-07-28.md）。
- 报告为「真新品富矿」：A 端 Grok 4.5 + Claude Opus 5（成本/效率战）、Rivault（agent 零知识授权层）、Webhound/localskills.sh/Cynative（agent 可调用服务）；B 端 Illume Labs（iMessage 纵向健康助手）、Rescript（本地开源转写式视频编辑）。

## Loop 1 — 机会发现（关键决策）
- 客观区分「报告事实 vs 我的独立判断」：认同「模型成本战」「授权层被产品化」「健康 AI 转向纵向+主动」三个报告事实，但独立判断为：
  - 授权/审批赛道（Rivault/Openbase/Athena/Pushary）**拥挤且被平台 MCP 收编中、增量递减**，且是本实验室过去 3 周做烂的方向 → 主动回避。
  - 健康 AI「持有数据+主动建议」是必要非充分；报告自陈的软肋「多源融合+主动性能否被**感知**」的答案是「在你身上被**验证有效**才被感知」→ 真正没解决的是「这条建议**对我一个人**有没有用」。
- 生成 3 个候选并五维打分：
  - A 验己（2C 个人健康 n-of-1 自我实验教练）= **20/25** ← 选中
  - C 步账（Agent 步级模型成本预演台，踩成本战）= 19/25
  - B 知授（Agent 授权知情同意智能层，踩 Rivault）= 18/25（机制新意/启发价值因赛道拥挤+本实验室过度重复而诚实减分）
- 门槛：最高 20/25 ≥ 16 → 进入 Demo。
- 选 A 的组合理由：本实验室 07-24~07-27 连续 4 天技术向，**2C 严重欠账**，而今天恰是富 2C 日；且「敢对多数建议说没证据」的诚实气质与实验室一贯押中的形态一致。

## Loop 2 — Demo 设计
- 分型：可视化/交互类（辅以 mock 数据回放 + 价值可视化）；关键价值用 before/after（朴素解读 vs 验己诚实读数）。
- 3 页：① 实验设计台（建议→n-of-1 协议）② 读数（数据回放+诚实结论卡+朴素/诚实对比）③ 实验档案（个人证据库）。
- 见 `demo-spec.md`。

## Loop 3 — Demo 开发
- 技术栈 Vite 5 + React 18 + TS 5，`vite.config.ts` 设 `base: './'`。复用既往可用配置。
- 确定性读数引擎 `src/logic/engine.ts`：基线均值/波动、效应量=|均值差|/波动、ABAB 反转一致性、均值回归与新奇效应启发式 → 结论 + 0–100 证据强度 + 判定依据 + 朴素/诚实文案；`designProtocol` 由指标噪声推算建议天数。
- mock：3 场实验（少吃夜宵/静息心率、睡前补镁/深睡[ABAB]、冷水澡/主观精力）覆盖三种典型结论。
- 组件：DesignView / ReadoutView（含纯 CSS 柱状图）/ LedgerView；纯 CSS，无 SVG。

## Loop 4 — 自动验证（build 轮次与结果）
- 建 UI 前用 esbuild harness（`_verify.ts`）预校验引擎数字：exp1 数据不足(evidence 15, effectRatio 0.67, 均值回归 true)、exp2 有效(75, 3.63, 反转一致)、exp3 疑似安慰剂(10, 新奇衰减 true)。
- 首次校验发现 3 个实验缺 `design` 字段（导致 ABAB/均值回归/新奇分支未触发）→ 补上后数字符合预期。删除 `_verify.ts`。
- 初次跑 `validate_demo.sh` 报缺 `README.md` → 补上 demo/README.md。
- 再跑 `bash scripts/validate_demo.sh daily/2026-07-28/demo`：**npm install + build 首轮成功**（build_attempts=1），smoke 全过。**无需进入 3 轮修复。**

## Loop 5 — 体验自评
- 浏览器实测（preview @4173 + computerUse 全流程点击 + 截图 6 张）：页面非空白、三 Tab/建议卡/指标 pill/before-after 开关/表格跳转均正常；三种诚实结论正确渲染（深睡=有效 / 静息心率=数据不足 / 主观精力=疑似安慰剂）。
- 自查两张截图（03 深睡、05 冷水澡）：中文清晰、数字与引擎一致（62.5/79.3/±4.62/3.63；3.0/3.6/±0.13/4.61），图表把「伪改善」可视化得很直观。
- 结论 **PASS**，详见 `evaluation.md`。

## 遇到的问题
- experiments.ts 漏写 `design` 字段（esbuild 不做类型检查，预校验时暴露）→ 已修复。
- demo 缺 README（validate 拦下）→ 已补。
- computerUse 的 OCR 对部分中文标签有误读（如把「效应量」读成「风险置信度」）——按既往经验以代码/引擎数字为准，已自查截图确认无实际问题。

## 最终结论
- status = **PASS**，reason = ok。机会分 20/25（达门槛），Demo build 首轮成功，必需产物齐全，浏览器验证通过。
- 产物：opportunity.md / demo-spec.md / demo/（源码）/ evaluation.md / run-log.md / status.json / source-report.md / screenshots/。
