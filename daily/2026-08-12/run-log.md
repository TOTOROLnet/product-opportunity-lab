# Run Log — 2026-08-12

## 使用的报告
- `daily/2026-08-12/source-report.md`（product-hunt-radar，日期 **2026-08-11**）。
- Provenance 注记：`collect_recent_reports.py --days 1` 于今日拉取到的最新报告仍是 `2026-08-11.md`（上游今日尚无新报告）。该报告昨天（2026-08-11 的循环）已用过并选了「众读」。因此今天做**完全独立、且刻意区别于昨天**的判断，避开"多 AI 同台 → 接收诊断"那条已被开采的脉络。

## 各 Loop 关键决策
- **Loop 1 机会发现**：从报告提取信号——Prime Agent（17/18，自我改进 harness / Continual Harness）、Paritok（15/18，可逆压缩网关）、oqoqo（14/18，"agent 是软件主要用户"的 eval）、以及"agent 跑更久/更自治/会自改"的 A 类趋势。独立判断：报告都从"平台方能力"视角写，系统性漏了**把活委派出去的那个人类**——当 agent 越自治、还会改写自己，人的**"理解债"**越重。
  - 3 个候选：A 随读 Suídú（自治运行后的 3 分钟补看阅读器，**21/25**）；B 随附手册 Kit-for-Agents（骑 oqoqo，为 agent-用户生成接入手册，19/25）；C 折叠术 Foldcraft（骑 Paritok 可逆压缩，给人读的可逆保真长文画布，18/25）。
  - 选 A（21/25，>16 门槛）。理由：痛点随趋势高频化、机制是天生适合纯前端"模拟体验+价值可视化"的全新原语、踩中本实验室**全新基因**（叙事/阅读理解/帮人读懂，非打分/放行/判决），且对 Prime Agent 最独特处（Continual Harness 自我修订）有专属回答"它给自己改了什么"。
  - **刻意避开** memory 标记的已做穿形态：audit/gate/放行（归位/对表/正名）、preflight/计算器/判决（风洞/换挡/预调）、"AI 诚实认怂"基因（准星/忆证/验己…）、以及昨天的接收模拟（众读）。
- **Loop 2 Demo 设计**：抽象/agent-运行时类 → 纯前端"模拟体验 + 价值可视化"。3 页：① 补看（叙事时间线 + 只盯这些 + 决策过滤）② 它改了自己（自我修订变更日志）③ 对照（before/after 读懂成本）。
- **Loop 3 开发**：Vite + React + TS，`base:'./'`。确定性纯函数引擎（`logic/engine.ts`）+ 全 mock 运行轨迹（`data/run.ts`，CSV 导出 + 修 flaky 测试场景：6 章 / 41 步 / 9 文件 / 3 假设 / 2 悬案 / 2 自我修订）。复用 08-11 的 tsconfig/vite 配置。
- **Loop 4 验证**：见下。
- **Loop 5 自评**：`evaluation.md`，结论 PASS。

## 关键数字（引擎推导，构建前用一次性 `_verify.ts`(esbuild→node) 预校验，已删除）
- steps 41 · files 9 · 净增删 25 行 · chapters 6 · assumptions 3 · looseEnds 2 · selfEdits 2 · 活跃 121 分。
- 读懂用时（透明启发式）：逐行爬 ≈ 41×15s + 9×40s + 25×2s = 1025s ≈ **17 分**；随读 ≈ 6×20s + 3×20s = 180s ≈ **3 分**；省 ≈ **14 分**。
- 「只盯这些」Top3（按"需要你决定"权重降序，非对错分）：A2 同步一次性生成（32）> L2 导出无权限校验/数据越权（30）> A1 导出=筛选还是全表（22）。
- 一致性：所有章节的 related*Ids、假设 evidenceStep 均可解析，integrity problems = none。

## build 轮次与结果
- `bash scripts/validate_demo.sh daily/2026-08-12/demo`：**首轮通过（build_attempts=1）**。npm install OK；`tsc -b && vite build` OK；dist/index.html 非空且含 `id="root"`；1 个 JS bundle；README 存在。
- 无 tsc 溢出产物需清理（`*.tsbuildinfo` / `vite.config.js` / `vite.config.d.ts` 本轮未生成，已确认）。

## 浏览器实机验证
- `npm run preview`（tmux session `suidu-preview`，127.0.0.1:4173）→ computerUse 子代理点完整流程 + 截图 7 张（`screenshots/01..07`）。
- 自查 `01-home.png` / `07-compare.png`：统计 chip = 41/9/3/2/2 与 17→3 分正确；右栏 Top3 = A2/L2/A1 正确；对照页公式与 17→3、省 14 分正确；布局整洁、中文无乱码/重叠。
- 注：computerUse 转写对中文/数字有 OCR 误读（如把"3 个假设"读成"1"），以引擎数字与自查截图为准（memory 已知现象）。

## 遇到的问题
- 无阻断性问题。首轮 build 即通过。唯一需要注意的是"同报告复用"——通过刻意换视角（服务人类理解）与换基因（叙事/补看）确保不与昨天的众读重复。

## 最终结论
- **PASS**：达门槛（21/25）+ build 成功 + 必需文件齐全 + 实机核心交互闭合 + 非照抄。
- 提交：`daily/2026-08-12/` 推到 `cursor/**` 工作分支；由 GitHub Actions 自动同步进 main 并部署 Pages。不开 PR。
