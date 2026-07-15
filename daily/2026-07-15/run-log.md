# Run Log — 2026-07-15

## 使用的报告
- `daily/2026-07-15/source-report.md`（`scripts/collect_recent_reports.py --days 1` 从公开 product-hunt-radar 拉取，最新 = 2026-07-15.md）。
- 报告主线：技术向两条（编码 Agent 桌面悬浮化 Claude Overlay；Agent 支付/发卡 Agentcard），外加多智能体"AI 员工团队"（ClawTeams/Pazi）；2C 端仅 VocalVia（文档→可编辑多角色音频）一条，报告称 2C 偏弱不成趋势。

## Loop 1 — 机会发现（关键决策）
- **主动避开 Agent 支付/对账家族**：近 3 天已连做 07-12 明约（授权对账）、07-14 值当（花费对账），边际启发递减，再做即自我重复。
- **主动纠偏组合偏科**：本实验室近 12 天几乎全是技术向"控制/审计/对账"面；`lab-focus` 明确要求不要系统性忽略 2C。故今天优先认真评估 2C。
- 生成 3 个候选并五维打分：
  - A 屏见 ScreenConsent（悬浮 agent 截屏前脱敏/同意层）→ 19/25，但仍属"控制面"家族。
  - B 列队 Standup（AI 员工团队经理可读晨会视图）→ 18/25，属"监督可视化"家族、增量改良。
  - C 耳记 Earmark（把文档→音频从"内容消费"重构为"主动回忆式学习"）→ **22/25**，选中。
- 对报告结论的独立判断：认同报告对 Claude Overlay 护城河薄、VocalVia 赛道拥挤的判断；**质疑**其"2C 不值得跟进"的隐含结论，并**修正**其对"文档→音频"的品类定义（把 JTBD 从"消费"改为"留存"）。
- 门槛判定：最高分 22 ≥ 16 → 进入 Demo。

## Loop 2 — Demo 设计
- 分型：可视化/交互类（消费级学习体验），直接做可点击交互 Demo。
- 三视图：选材台 Library / 收听台 Player（核心：被打断的主动回忆）/ 回顾台 Recap（保留度地图 + before-after + 重听队列）。
- 语音用浏览器原生 `speechSynthesis`（非外部 API、无 key、不上传），不支持则降级为进度条 + 文字高亮。

## Loop 3 — Demo 开发
- 技术栈 Vite + React + TypeScript；`vite.config.ts` 设 `base: './'`。
- 结构：`types.ts` / `data/library.ts`（3 份 mock 语料，含概念单元 + 苏格拉底追问）/ `logic/mastery.ts`（作答×把握度→掌握分、留存估算、重听队列，纯函数）/ `audio/speech.ts` / 三个 View 组件 + `shared.tsx` + `index.css`。
- 设计细节：把"答对×把握度"映射为掌握分，其中"自信地答错（wrong+high）"给最低分并单独标红——教育学上最该纠偏的状态，也是被动听发现不了的盲点。

## Loop 4 — 自动验证
- `bash scripts/validate_demo.sh daily/2026-07-15/demo`：**首轮通过**。
  - npm install 成功；`tsc -b && vite build` 成功；dist/index.html 非空含 `id="root"`；1 个 JS bundle。
  - build 修复轮次：0/3。
- 清理：`tsc -b` 产生的 `*.tsbuildinfo` 与 `vite.config.js|.d.ts` 属构建产物，已加入 `.gitignore` 并从提交中移除（对齐往期产出不含这些文件）。

## Loop 5 — 体验自评
- 用计算机操作子代理在 localhost:4173 真机走查完整主路径：选材 → 收听 → 跳到追问 → 答题（含故意"自信地答错"验证告警）→ 回顾（留存对比 22% vs 78% 更新、保留度地图、重听队列）→ 点重听并再测回到单概念小节并成功回到回顾更新分数。无控制台报错、无断点。
- 截图存于 `screenshots/`（01 选材 / 02 答对反馈 / 03 自信地答错告警 / 04 回顾 / 05 重听后回顾）。
- 结论：**PASS**。

## 遇到的问题
- 中途工具调用出现一次临时故障（RecapView.tsx 首次写入失败），已重试成功写入，未影响结果。
- 首次提交误带入 `tsc -b` 构建产物，已 gitignore 并移除。

## 最终结论
- status = **PASS**，reason = ok。机会 = 耳记 Earmark，评分 22/25（门槛 16），Demo 已构建并真机验证核心闭环。
