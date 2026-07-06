# Datum — Agent 交付证据的验收基线与回归哨兵（Demo）

> 纯前端静态 Demo（Vite + React + TypeScript）。全部证据为 **mock 数据**，不接任何真实环境 / 后端 / 数据库 / 支付 / 登录 / 外部 API。

## 这是什么

Agent 产品正在把交付物从「结果文本」升级为「可验证证据」（截图、HTTP trace、日志、测试 artifact）。
但今天这些证据 bundle 是**一次性、跑完即弃**的：judge 只在完成时刻判一次，agent 一旦重跑/换版本，
之前被证明能用的功能可能**静默回归**——而源码 diff 往往「很小很绿」，人不会逐帧重看整份证据。

**Datum** 把一次性证据升级为**可版本化基线**：把每条「验收标准」绑定到它需要的证据，
对 agent 每次重跑做**跨 run 的增量复判**，只把 **PASS→FAIL 的回归**和变化的**证据 delta** 顶到人面前，
并带阈值/容差去噪。全局判定：**HELD（守住）/ REGRESSED（回归）/ IMPROVED（改善）**。

Datum 不产环境、不接真实系统，只做证据的**记忆层 + 跨 run 裁决层**——消费 TryCase / CI / e2e 之类工具的产物。

## 演示内容

左栏 4 个 mock 重跑场景，点击切换：

1. **结账静默回归**（主打）：源码只改 3 行、单测全绿，结账接口却从 200 变 500、成功页变错误页 → REGRESSED。
2. **登录改善**：flaky 测试转绿、登录延迟从 1200ms 回落到 180ms（越过 800ms 阈值）→ IMPROVED，无回归。
3. **大重构守住**（绿色路径）：源码 diff 很大很吓人，但行为证据全绿 → HELD，证明「大改动 ≠ 高风险」。
4. **混合 + 去噪**：一条真回归（按钮 404）+ 一条「看似变慢实为抖动」（延迟在容差内）→ REGRESSED，1 回归。

主路径（3 分钟）：选场景 → 看顶部全局 verdict 与验收矩阵（基线→当前逐条状态翻转）→ 点某条验收项看证据 delta。

## 本地运行

```bash
npm install
npm run dev      # 本地开发，默认 http://localhost:5173
```

## 构建 / 预览

```bash
npm run build    # 产物在 dist/
npm run preview  # 本地预览已构建产物（默认端口 4173）
```

- `vite.config.ts` 设 `base: './'`，保证部署到任意 GitHub Pages 子目录都能正确加载资源。

## 技术栈

- Vite 5 + React 18 + TypeScript 5
- 无外部图片：伪浏览器截图用纯 SVG/CSS 绘制。
- 无网络请求、无第三方运行时依赖（仅 react / react-dom）。

## 目录

```
src/
  App.tsx                 # 主布局与状态
  types.ts                # 证据 / 验收标准 / 场景类型
  data/scenarios.ts       # 4 个 mock 重跑场景
  logic/verdict.ts        # 迁移判定与全局 verdict 汇总
  components/
    ScenarioList.tsx       # 左栏场景选择器
    VerdictHeader.tsx      # 全局 verdict + 统计 + 源码 diff 旁注
    CriteriaMatrix.tsx     # 验收矩阵（基线→当前逐条翻转）
    EvidencePanel.tsx      # 证据 delta 面板（截图/HTTP/日志/测试）
    FakeScreenshot.tsx     # 纯 SVG/CSS 伪截图
    HowItWorks.tsx         # 原理 + before/after 价值对比
```
