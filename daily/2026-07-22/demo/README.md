# 付前一秒 CommitGuard — AI 消费 agent 的成交守门人（Demo）

> 2026-07-22 每日产品机会循环产出的纯前端交互 Demo。
> 灵感信号来自当日 Product Hunt AI 雷达「transactable web」：CartAI 把「交易清算」做成 agent 原语、
> Manifest 把网页动作结构化、支付网络铺 agent pay 轨道。CommitGuard 是这条链上**唯一站在消费者一侧**的一层。

## 这是什么

一层夹在你的 **AI 消费 agent** 与你的 **钱包** 之间的「成交守门人」。当 agent 即将点下「确认支付」的前一秒，
CommitGuard 把它要成交的那一单摊开成人话核验单：

1. **意图对齐 diff**：你交代的约束 vs agent 真要买的，逐条 ✓/✗；
2. **真实总价拆解**：首屏标价 vs 含税费/服务费/隐藏费的真实总额，标出被藏起来的金额与占比；
3. **陷阱雷达**：自动续订、预勾选加购、drip pricing、不可退、越权成交等 dark pattern，逐条定级；
4. **可逆性评分 0–100**：退款窗口/退款难度/取消路径 + 一句「买错了怎么办」。

你一键 **批准成交 / 让 agent 改（附修改指令）/ 拒绝**，并在「价值对比」页看到本次会话
「省了多少可疑支出、拦下几个陷阱、避免几笔不可逆承诺」的 before/after 战报。

## 与 CartAI 等清算层的本质区别

CartAI 等玩家站在**卖家 / agent-builder 一侧**，目标是让交易「更容易成交」，且常按成交额分佣；
CommitGuard 站在**消费者一侧**，激励与「拦住坏单」对齐，坐在谈判桌的对面。方向相反、用户相反、发生时刻相反（成交时 vs 成交前）。

## 运行方式

```bash
npm install      # 安装依赖
npm run dev      # 本地开发预览（默认 http://localhost:5173）
npm run build    # 生产构建，产物在 dist/
npm run preview  # 预览构建产物
```

## 技术说明

- 技术栈：Vite + React + TypeScript。
- `vite.config.ts` 设 `base: './'`，保证部署到任意 GitHub Pages 子目录都能正确加载资源。
- 主要页面（≤3）：`守门台`（逐单核验 + 决策）、`价值对比`（before/after 战报 + 拦截账本）、`它是什么`（创新切入点 + 诚实声明）。
- 目录：
  - `src/types.ts` — 数据模型
  - `src/data/scenario.ts` — mock 场景（1 个委托任务 + 4 笔待成交订单）
  - `src/logic/engine.ts` — 确定性核验引擎（真实总价 / 隐藏费 / 风险 / 可逆性 / 会话战报）
  - `src/components/*` — 守门台 / 核验单 / 价值对比 / 关于 等界面

## 诚实边界（这是一个 Demo）

- 所有订单、费用、陷阱、评分均为**预置 mock 数据**，由**确定性核验引擎**计算得出。
- **不接**真实支付 / 数据库 / 登录 / 外部 API，也**未运行**真实的 dark pattern 识别模型。
- 真实产品中，核验单的每个字段应由 AI 解析任意商户结账页得出；本 Demo 用确定性数据代理，
  仅用于演示「成交前核验」这一创新切入点的**机制成立与价值形态**，不代表真实识别质量。
