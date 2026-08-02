# Run Log — 2026-08-02

## 使用的报告
- `source-report.md`（product-hunt-radar，报告日期 2026-08-02），由 `python3 scripts/collect_recent_reports.py --days 1` 自动拉取（`latest = 2026-08-02.md`，当日新鲜、无重复取昨日）。
- 报告特点：本轮 RSS 窗口与 08-01 **高度重叠**，报告自评「真正的新增高价值信号只有一个 = DeepSeek-V4-Flash-0731」，**2C 端今日无新达标产品**。

## Loop 1 — 机会发现（客观 + 创新）
- 客观提取信号：DeepSeek-V4-Flash-0731（唯一新 A 类，16/18；只改后训练、便宜约三分之一、并发 2500、原生 Responses/Codex、MIT）；报告口径提示「厂商未公开 harness 自评、无第三方复现」「换个模型 ID 就享受成本红利」；2C 侧 Pally/Bo AI/SoundGate 均为 08-01 重复投递、无新信号。
- 独立判断：**质疑「换个 ID 就享受」**——$/token 是表面单价，agent 车队真正付的是「每个成功完成任务」的钱；换更便宜模型会改变步数/重试/工具失败率/成功率，单位 token 便宜 ≠ 单位任务便宜、甚至可能更贵。
- 候选（≥3）与评分：
  - A 换挡 Downshift（trace 重放 + 每成功任务成本迁移决策）— **22/25**（初评 24，机制新意因与 08-01 风洞结构相似诚实下调至 3）
  - B 迁前体检 DropInDoubt（换 ID 的行为契约 diff）— 20/25
  - C 榜外 OffBench（厂商 agentic 基准迁移落差拆解）— 18/25
  - D 应承 Keeper（2C 短信助理承诺账本）— 16/25（今日无新 2C 信号，硬做违背客观性，诚实不选）
- 选择：**A 换挡 Downshift（22/25）**，达到 16/25 门槛 → 进入 Demo。
- 客观性把关：今日报告确无新 2C，未硬凑 2C（记忆里的「优先 2C」是条件性建议，条件未满足）。

## Loop 2 — Demo 设计
- 分型：抽象/基础设施类（模型迁移决策）→ 纯前端「模拟体验 + 价值可视化」（before/after + 逐项台账 + 盈亏平衡交互）。
- 3 页：换挡台 / 逐项复盘 / 盈亏平衡。写入 `demo-spec.md`。

## Loop 3 — Demo 开发
- 技术栈 Vite + React + TS，`vite.config.ts` `base:'./'`；复用 08-01 的 tsconfig*/vite.config/main.tsx/vite-env.d.ts，改 index.html 标题/描述/favicon 与 package.json。
- 确定性引擎 `src/logic/engine.ts`（`effInput/costPerTask/analyze/analyzeWith/classifyVerdict/breakEvenSuccess`）；4 个 mock 工作负载 `src/data/workloads.ts`。
- **数值预校验**：先用一次性 `/tmp/verify.mjs` 复算 4 负载，确认落在 4 档裁决（值得换/有条件换/先修再换/别换）后再写 UI，随后删除临时脚本。

## Loop 4 — 自动验证（硬检查）
- `bash scripts/validate_demo.sh daily/2026-08-02/demo`：**首轮通过**（build attempts = 1）。
- 产物：dist/index.html 1.17kB、CSS 8.33kB、JS 159.34kB（gzip 53kB）。
- 提交前 `rm -f` tsc 工件（*.tsbuildinfo / vite.config.js / vite.config.d.ts），暂存干净、无 node_modules/dist。

## Loop 5 — 体验自评
- 浏览器实测（computerUse，截图存 `screenshots/`）：三页均正常渲染、无 Console 报错；滑杆/切换/裁决变色实时正确。
- 引擎数值与界面一致：编码 −75%(0.25×) 值得换；语音 +35%(1.35×) 别换、月度 $1.1k→$1.5k 多花$383；盈亏平衡把 B 成功率拉到 100% → r 1.35×→1.08×、裁决 别换→有条件换。
- 自读 `02-desk-voice.png`：中文渲染清晰、数字与引擎吻合（computerUse 转写有中文/数字误读，属已知 OCR 工件，非应用缺陷）。
- 结论：**PASS**。

## 遇到的问题 / 备注
- shell 早期 `cd` 进 demo 目录导致一次相对路径 `validate_demo.sh` not found，改用 `/workspace` 绝对根路径后正常（无功能影响）。
- 机制与 08-01 风洞相似的风险：已通过对象（模型 vs 运行时）、指标（每成功任务成本+成功率 vs 成本倍率）、命题（价格×能力耦合 vs 阿姆达尔成本地板）三重差异化 + 页脚显式声明处理，并诚实下调机制新意分。

## 最终结论
- status = **PASS**，reason = ok。选中「换挡 Downshift」22/25，build 首轮成功，必需产物齐全（source-report / opportunity / demo-spec / demo / evaluation / run-log / status.json + screenshots）。
- 提交到 `cursor/**` 分支并 push；同步与部署由 GitHub Actions 自动完成；不开 PR。
