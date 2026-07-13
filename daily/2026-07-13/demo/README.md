# 记衡 Mneme — 跨工具自持记忆的调阅治理层（Demo）

> 入库 ≠ 可信，接通 ≠ 全看。在记忆被 `recall` 注入进某个 AI 工具的上下文之前，先按**作用域**过滤（最小权限），再做**卫生**治理（出处 / 矛盾 / 过期 / 投毒），只放行干净、正确、最小的上下文。

本 Demo 为 **纯前端静态原型**（Vite + React + TypeScript），全部数据为 mock，不接登录 / 数据库 / 支付 / 外部 API / 真实记忆存储。它演示的是我们分析出的**创新切入点**（recall → 注入之间的治理面），不是被参考产品 Second Brain（记忆存储/管道）的克隆。

## 背景（报告信号）

来自 product-hunt-radar 2026-07-13 报告趋势 1：「记忆 / 状态层正从『厂商内建』走向『用户自持 + MCP 标准化』」（Second Brain 自托管 MCP 记忆层 15/18、FetchSandbox 有状态 API 沙箱 13/18）。报告建议把记忆做成一等服务，但**未点出**"记忆在注入前需要治理"这一层——正是本机会的切入点。

## 它做什么

一份"自持"记忆接进多个 AI 工具后，会涌现出存储层根本不解决的新问题。记衡站在 `recall` 与"注入进工具上下文"之间：

- **作用域（least-privilege）**：按工具的授权作用域过滤记忆，越界即硬性拦截（如把代码库密钥泄漏给旅行 agent）。
- **卫生（trust at recall）**：逐条标注**出处**（哪个工具/agent 写入、何时、用户陈述 vs agent 推断），检测**矛盾**、标记**过期**、拦截**投毒**（某 agent 写入的幻觉经 recall 扩散到所有工具）。

## 怎么体验（核心流程 3 分钟）

1. 默认「旅行规划 agent + 裸调阅」：看 recall 命中的 8 条被**照单全收**（含密钥泄漏、过期住址、矛盾偏好、agent 幻觉），顶部信任仪表标红。
2. 切到「记衡治理」：同一份 recall 被逐条治理——越界项拦截、过期/矛盾/投毒项扣留待裁决。
3. 交互裁决：点矛盾项二选一保留、点未确认项确认或退休、点任一项展开**出处卡**；右侧「最终注入上下文」实时更新为干净、最小、可信的集合。
4. 切到「日程 agent（对照）」：读取的都在作用域内、新鲜、无矛盾 → 记衡"**全部放行·无需干预**"，证明治理层不逢事就拦（反 crying-wolf）。

## 本地运行

```bash
npm install
npm run dev      # 本地开发预览
npm run build    # 生产构建，产物在 dist/
npm run preview  # 预览已构建产物
```

- Node 18+；构建产物 `dist/index.html` 含 `<div id="root">` 挂载节点。
- `vite.config.ts` 设 `base: './'`（相对路径），可部署到任意 GitHub Pages 子目录。

## 目录结构

```
src/
  types.ts                 # 记忆 / 工具 / 治理结果 类型
  data/scenarios.ts        # 2 个 mock 场景（旅行 agent 风险场景 + 日程 agent 对照）
  logic/mneme.ts           # 治理核心：classifyBase / governRecall / summary（纯函数）
  components/
    TrustMeter.tsx         # 顶部信任仪表（横幅 + 计数）
    MemoryCard.tsx         # 单条记忆的裁决卡（出处 / 动作）
    InjectedPreview.tsx    # 最终注入上下文预览
  App.tsx                  # 编排：场景切换 / 裸-治理开关 / 交互裁决
```

## 明确不做

- 不做登录 / 用户系统、不接数据库 / 支付 / 外部私钥 / 真实 API。
- 不做真实语义检索 / 真实矛盾检测模型（用 mock 标注展示价值）。
- 不复刻 Second Brain 的记忆存储管道；本 Demo 只演示"注入前治理"这一增量层。
