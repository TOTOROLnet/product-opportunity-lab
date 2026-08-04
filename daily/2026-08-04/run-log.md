# Run Log — 2026-08-04

## 使用的报告
- `daily/2026-08-04/source-report.md`（`scripts/collect_recent_reports.py --days 1` 自公共 product-hunt-radar 拉取 `2026-08-04.md`）。
- 报告要点：A 类头条 Qwen3.8-Max（17/18，首个开放权重 Max 级模型 + 双协议 + 长程自主）、AgentSky（14/18，托管常驻 Agent 云、中途热切换不丢状态）、Open Minis（14/18，端侧本地 Linux 沙箱）；A 类趋势 = 「Agent 运行时被拆成云/端/协作分别产品化」。B 类唯一像样信号 CoachAI（13/18，iPhone 摄像头端侧 CV 健身教练），B 类趋势 = 「摄像头+端侧 CV 成消费级 AI 实时反馈入口」。报告自评今日榜单近乎整体重复上架。

## 各 Loop 关键决策
- **Loop 1（机会发现）**：日期 2026-08-04（cron triggeredAt / user_info / UTC+CST 三方一致，无时钟漂移）。
  - 客观性：区分了「报告事实」（各产品评分、CoachAI 失败风险原文、趋势）与「我的独立判断」（不硬蹭今日更高分但已被我做腻的技术向；抓 CoachAI 生死线做诚实教练）。
  - 生成 4 个候选并打分：A 有数（诚实置信度教练，2C）21/25；B 该停了（只做喊停）18/25；C 迁移保真 Ferry（AgentSky 状态保真预检，技术向）18/25；D 交没交 Delivered（Qwen 长程自主成果核验，技术向）18/25。
  - 选 A（21/25，最高）。关键理由：①押在报告自评的生死线（CV 纠错准确度/体感）上；②技术向今日几乎每条都落进我已开采家族（换挡/风洞/榫卯/岔口/准星），且「厂商宣称 vs 诚实计算器/预检」形态已连用两天（风洞 08-01、换挡 08-02），第三个会自我重复——记忆明确提示避免；③A 是全新 2C 层（端侧实时动作教练诚实/剂量），形态是会动的骨架+对照+趋势，摆脱了连日的计算器外形。
  - 门槛：21/25 ≥ 16，进入 Demo。
- **Loop 2（Demo 设计）**：分型 = 可视化/交互类，但因端侧 CV 实时反馈依赖硬件，采「模拟体验 + 价值可视化」（脚本化关节数据回放）。3 页：实练台 / 讨好 vs 有数 / 诚实进度。见 demo-spec.md。
- **Loop 3（开发）**：Vite+React+TS，`base:'./'`。复用 08-03 的 tsconfig/vite.config 脚手架。确定性引擎 `src/logic/engine.ts`（置信度→看清判定→达标/纠正/看不清→疲劳喊停→讨好vs有数对照→一周聚合诚实读数）；mock 数据 `src/data/sessions.ts`（今日深蹲 12 次 + 一周 7 天）；参数化 SVG 骨架动画。
  - **建 UI 前预校验引擎**：一次性 `_verify.ts`（esbuild 打包真引擎跑 node），确认今日 session = attempted 12 / seen 9 / unseen 3 / counted 7 / good 5 / fix 2 / overexertion 2 / stopIdx 9；讨好 12+盲纠3+不喊停 vs 有数 7(达标5)+盲纠0+喊停第9+如实未计5；一周 claimed 41 / trusted 34 / 83% / 深度 76→91(+15) / fatigueDays 2。校验后删除临时文件。
- **Loop 4（验证）**：`bash scripts/validate_demo.sh daily/2026-08-04/demo` → **一次通过（build_attempts=1，0 修复轮）**，smoke 全过。
- **Loop 5（体验自评）**：见 evaluation.md，结论 PASS。

## build 轮次与结果
- 第 1 轮：`tsc -b && vite build` 成功；smoke 通过。无需修复。

## 遇到的问题
- 无阻塞问题。tsc 的 `noUnusedLocals/noUnusedParameters` 一次通过（组件参数/导入均有使用）。
- 提交前 `rm -f demo/*.tsbuildinfo demo/vite.config.js demo/vite.config.d.ts` 清理 tsc 复合工程产物，保证暂存干净；`node_modules/`、`dist/` 由 .gitignore 排除；`package-lock.json` 已提交。

## 浏览器实测（computerUse + 自查截图）
- 三标签均正常渲染，控制台无 JS 错误，骨架动画可见运动，红色「该停了 · 第 9 次」卡片如实出现。
- 自查 `screenshots/03-coach-stop.png`、`04-compare.png`：中文清晰、数字与引擎一致（实练台 7 可信/达标 5/看不清未计 2；对照 讨好 12+盲纠3 vs 有数 7(达标5·提醒2)/盲纠0/喊停第9/如实未计5）。
- 截图存 `daily/2026-08-04/screenshots/`（01 初始 / 02 运行中 / 03 喊停 / 04 对照 / 05 进度）。

## 最终结论
- **status = PASS，reason = ok**。选中机会：有数 Yǒushù（诚实的端侧实时动作教练），21/25，达门槛；build 一次成功、产物齐全、浏览器实测无误。
- 产物：source-report.md / opportunity.md / demo-spec.md / demo/ / evaluation.md / run-log.md / status.json / screenshots/。
- 不照抄声明齐全（见 opportunity.md §5）：与 CoachAI 目标函数相反（可信度优先 vs 覆盖率），非克隆。
- 已提交并推送到工作分支 `cursor/**`；不开 PR（由 Sync Action 自动进 main 并部署 Pages）。
