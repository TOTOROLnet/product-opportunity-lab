# Run Log — 2026-08-21

## 使用的报告
- `daily/2026-08-21/source-report.md`（由 `python3 scripts/collect_recent_reports.py --days 1` 从 public product-hunt-radar 拉取的 `2026-08-21.md`）。
- 报告核心：技术向「模型—Agent 客户端—治理」三层同日各有新品——Grok 4.6（长程 Agent 模型 + **context compaction** 原语）、Berd/ACP（客户端-Agent 解耦）、Prized（基础设施级安全护栏）；趋势「工具的一等用户从人变成 Agent」；2C 侧 MiniMax Design（并行 Agent 团队多模态创作，一致性是硬门槛）。本批约六成为 08-20 重复上架。

## Step 0 — 准备
- 环境：node v22.14.0、npm 10.9.7、python 3.12.3；无 async-install 状态文件残留。
- 拉取成功，`inputs/product-hunt-reports/2026-08-21.md` 到位，复制为 `source-report.md`。
- 计算日期 DATE=2026-08-21（北京时间，与报告日期一致），创建 `daily/2026-08-21/`。

## Loop 1 — 机会发现（客观 + 创新）
- 客观区分「报告事实 vs 我的独立判断」：报告把 context compaction 当降本特性；我判断它是被**低估的风险/控制面**（压缩=静默替你决定留什么扔什么，扔错硬约束会让 Agent 跑偏）。
- 先扫历史选题避免重复：本实验室已大量覆盖「Agent 控制面/预演台」（07-31 忆证=记忆回忆信任闸、08-07 归位=复跑世界重校、08-16 闸口=护栏爆炸半径、08-14 说戏=成片导演层）。据此刻意选择「压缩这一步」这个更新、更少重复的切口，并在 opportunity.md 显式给出与它们的区分。
- 生成 3 个候选并五维打分：
  - A 留痕（压缩折叠差异 + 保命清单审计台）：4+5+5+5+5 = **24/25**
  - B 连戏（并行 Agent 团队多模态一致性合约）：4+4+4+4+4 = 20/25
  - C 可读（产品的 Agent 体验/AX 审计）：4+4+4+5+4 = 21/25
- 选中 A（24/25 ≥ 16 门槛）→ 进入 Demo。属抽象/基础设施类 → 用「模拟体验 + 价值可视化」。

## Loop 2 — Demo 设计
- 写 `demo-spec.md`：单页 + 3 标签区（原理 / 折叠台 / 回放）；核心=折叠差异 before/after + 保命清单控制面 + 默认 vs 带清单回放对比。全 mock，不接后端/LLM/外部 API。

## Loop 3 — Demo 开发
- Vite + React + TS，`vite.config.ts` 设 `base:'./'`。
- 关键文件：`src/types.ts`、`src/data/trajectory.ts`（mock 支付迁移长轨迹 24 步 / 2 次压缩）、`src/engine.ts`（确定性引擎：输入轨迹+保命清单→折叠差异/风险分/token 账单/跑偏回放/结局）、`src/components/{Explainer,FoldDesk,Replay,ui}.tsx`、`src/App.tsx`、`src/index.css`（深色 teal 主题）。
- 提交并 push 后再进入测试。

## Loop 4 — 自动验证
- `bash scripts/validate_demo.sh daily/2026-08-21/demo`：**一次通过**（npm install + build + smoke 全绿，1 个 JS bundle）。build 修复轮次 0/3。
- `dist/index.html` 使用 `./assets/...` 相对路径，Pages 子目录可用。
- 浏览器实测（preview :4321，computerUse 子代理）：三标签渲染正常、控制台干净、中文无乱码；核心交互验证通过——「一键钉住风险项」使风险分 178→18、折叠项由丢弃改判为保留；回放中「默认压缩」❌ FAIL vs「带保命清单」✅ PASS，账单一致。截图存 `daily/2026-08-21/screenshots/`。

## Loop 5 — 体验自评
- 写 `evaluation.md`，结论 **PASS**。
- 诚实记录最大局限：引擎为确定性 mock；真实产品需拿到厂商「压缩前/后」中间态（自建压缩中间件/harness hook）才能落地，这是从 Demo 到产品的关键工程缺口。

## 最终结论
- status = **PASS**，reason = ok。达门槛（24/25）+ build 成功（1 轮）+ 必需产物齐全。

## 遇到的问题
- 无阻塞性问题。build 首轮即过；仅记录到 npm audit 提示 2 个依赖告警（vite/工具链传递依赖，不影响本 mock Demo 构建与运行）。
