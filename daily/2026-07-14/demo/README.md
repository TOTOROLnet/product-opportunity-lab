# 值当 Worthwhile — 自主 agent 花费策略 + 对账台（Demo）

> 2026-07-14 · product-opportunity-lab 每日机会 Demo
> 纯前端静态原型（Vite + React + TypeScript），全部数据 mock，**规划算法真实运行**。

## 这是什么

当 agent 能"自己付费、按次计费"（本日报告信号：AgentKey 调用前成本可见 + Loomal x402 按次付费），
新问题随之出现：agent 默认**贪婪调用**（能查就查、一把梭），既不做"最便宜且够用"的取舍，也不去重，
更不会在"边际收益 < 成本"时停手；事后只拿到一坨"$X / N 次调用"的黑账。

**值当（Worthwhile）** 在"价格已知"与"实际付费调用"之间加一层：

- **花前策略**：面对一组带价格的候选付费源，按"每单位成本的边际价值"择优、去重重叠来源、够用即止 / 预算封顶。
- **花后对账**：对每笔调用做价值归因——值 ✓ / 冗余 ⟳ / 浪费 ✗，给出可解释账单与"相对贪婪基线省了多少"。

它**不做支付**（那是 Loomal）、**不做接入**（那是 AgentKey），只解决"这笔该不该花、怎么花最省、花完值不值"。

## 三个视图

1. **任务与预算**：选场景 → 看任务信息需求与付费源市场 → 拖动预算 / 够用标准。
2. **对比运行**：贪婪 agent vs 值当 并排逐步播放，实时看花费分叉与每步取舍理由。
3. **对账收据**：逐笔价值归因表 + 需求覆盖对比 + 省额总结；含 CONTROL 场景验证"不逢事就喊省"。

## 真实 vs mock（诚实边界）

- **mock**：付费源的价格 / 覆盖的信息需求 / 覆盖质量 / 可靠度（手工标注）。
- **真实**：`src/logic/planner.ts` 里的规划算法——有效覆盖折损、按够用线截断的边际价值、
  择优 / 去重 / 够用即止 / 预算封顶、逐笔价值归因裁决。**拖动滑块会真实改变计划与账单。**
- 不接任何后端 / 数据库 / 支付 / x402 结算 / 外部 API / 登录。

## 本地运行

```bash
npm install
npm run dev      # 本地开发预览
npm run build    # 产出 dist/（tsc -b && vite build）
npm run preview  # 预览构建产物
```

- `vite.config.ts` 已设 `base: './'`（相对路径），可部署到任意 GitHub Pages 子目录。

## 目录结构

```
src/
  App.tsx                 视图切换与状态
  types.ts                领域模型
  data/scenarios.ts       3 个 mock 场景（含 1 个 CONTROL）
  logic/planner.ts        真实运行的花费规划 + 价值归因算法
  components/
    SetupView.tsx         任务 / 付费源市场 / 预算与够用标准
    CompareView.tsx       贪婪 vs 值当 逐步对比
    ReceiptView.tsx       逐笔价值归因收据 + 覆盖对比
    shared.tsx            裁决徽章等小组件
```
