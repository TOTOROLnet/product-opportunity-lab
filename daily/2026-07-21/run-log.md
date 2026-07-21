# 运行日志 — 2026-07-21

## 使用的报告

- `daily/2026-07-21/source-report.md`（由 `scripts/collect_recent_reports.py --days 1` 从 public product-hunt-radar 自拉取，最近 1 份 = `2026-07-21.md`）。
- 报告主线（报告事实）：技术向偏重——Inkling（Thinking Machines 开放权重多模态，17/18）、Rex（应收 ops agent，15/18）、Replay QA（自主 QA，14/18）；**明确趋势**「运行公司的自主 ops agent 按职能垂直落地，审批+审计成核心机制」（Rex/Nautis/Lunen/Backdrop/Creed/Skippr）；**2C 端今日无新达标产品**。

## Loop 0 — 准备

- 读取 `config/lab-focus.md` 与 `loops/daily-demo-loop.md`。
- 运行 collect 脚本成功，报告落到 `inputs/product-hunt-reports/2026-07-21.md`。
- 计算北京时间日期 `DATE=2026-07-21`，建 `daily/2026-07-21/`，复制 provenance 到 `source-report.md`。

## Loop 1 — 机会发现（客观 + 创新）

- 客观提取信号，并在 opportunity.md 用表格显式区分「报告事实 vs 我的独立判断」；对报告「把审批+审计当作已解决的机制」提出质疑：它是**半成品闸门**（逐条二元、审计只写不读），真正的空位是**横切所有 agent 的写权限治理面**与「信任一格一格挣」的产品化。
- 生成 3 个候选（均为创新切入点，非报告产品克隆）并五维评分：
  - 候选 A 撤销雷达 Undo-Radar：**20/25**
  - 候选 B 信任阶梯 TrustLadder：**22/25** ← 选中
  - 候选 C 冲突雷达 CrossGuard：**19/25**
- 选中理由：唯一攻击「审批总量随 agent 增多而爆炸」的结构性瓶颈；横切而非垂直；第一个把「信任阶」做成状态机；价值可视化最锋利。
- 门槛判定：最高分 22/25 ≥ 16 → 进入 Loop 2–5。

## Loop 2 — Demo 设计

- 机会属「抽象 / 控制面」型 → 采用「模拟体验 + 价值可视化」：模拟审阅台 + 信任阶梯资源视图 + before/after 对比。
- 写 `demo-spec.md`：3 个页面（审阅台 / 信任阶梯 / 价值对比），核心流程、mock 数据结构、明确不做项、成功标准。

## Loop 3 — Demo 开发

- 技术栈 Vite + React + TypeScript；`vite.config.ts` 设 `base:'./'`。
- 结构：`src/types.ts`、`src/data/scenario.ts`（9 类目 + 27 条脚本化动作）、`src/logic/engine.ts`（信任阶状态机 + 两策略确定性回放）、`src/components/`（Cockpit / Ladder / Compare / ui）、`App.tsx`、`index.css`。
- 关键设计：审阅台与信任阶梯共用同一台状态机；对比页用 `simulate()` 确定性重放，指标非编造。

## Loop 4 — 自动验证

- `bash scripts/validate_demo.sh daily/2026-07-21/demo` → **退出码 0**：npm install 成功、`npm run build` 成功、`dist/index.html` 非空含 `id="root"`、JS bundle 存在、README 存在。
- **build 一次通过，修复轮次 0/3。**
- 额外用 esbuild 把 engine 跑在 Node 里做数值自检，确认对比页数字全部来自引擎实测：
  - manual：人工审阅 27、升级 7、反转 0、覆盖率 0%、40.5 分钟；
  - trustladder：人工审阅 18（−33%）、自动放行 9、升级 6、反转 1、高风险漏审 **0**、可逆错误漏放 1（自愈）、覆盖率 43%、27 分钟；
  - `recv.mid` 因反转由 rung 3→2、auto 关闭；反转横幅命中 p16。

## Loop 5 — 体验自评

- 写 `evaluation.md`：结论 **PASS**。核心闭环可交互走通、数字经校验、明确引用报告信号、非克隆。
- 记录最大问题（单日覆盖率中等、依赖「跨天复利」论断、可逆性为 mock）与下一步（多日累积视图、反转冷却阈值、MCP write-approval 对接原型）。

## 遇到的问题

- 无阻塞性问题。build 首次即通过；引擎数值与文案一致。

## 最终结论

- **status = PASS，reason = ok**。达门槛（22/25）+ build 成功 + 必需产物齐全（opportunity / demo-spec / evaluation / run-log / status + 可运行 demo）。
- 产物将提交到当前 `cursor/**` 工作分支并 push，由 GitHub Actions 同步进 main 并部署 Pages；**不创建 PR**。
