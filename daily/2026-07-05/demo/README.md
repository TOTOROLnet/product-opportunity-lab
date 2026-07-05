# Contour — 结构化产物的语义评审层（Demo）

> 看清 Agent 改动的真实轮廓：把 AI Agent 对结构化产物（云基建 / 数据库 schema / CI / CAD feature tree）的改动，从**行级 diff** 升级为**语义 diff + 意图/不变量核验**，把"行级看着很小、语义上却高危"的破坏设计意图的改动顶到最前，并给出 before/after 评审判定。

本 Demo 对应 `daily/2026-07-05/` 的产品机会分析（见同目录 `opportunity.md`、`demo-spec.md`）。
它是**纯前端静态原型**，全部数据为 mock，不接任何真实后端 / 数据库 / 支付 / 登录 / 外部 API / LLM。

## 解决什么问题

AI Agent 越来越多地直接编辑**结构化产物**。但现在的评审工具（GitHub / IDE 的行级 diff）是**语义盲**的：
它只告诉你"这几行变了"，不告诉你"一个约束被删了 / 一个网络被放开了 / 一个下游依赖被打断了 / 一个默认值改变了行为"。
于是一次 `+3/-1` 行、看起来很小的改动，语义上可能是一次高危变更——reviewer 要么全信、要么逐字段人肉重审。

## 怎么用（3 分钟主路径）

1. 左侧**改动收件箱**：每条是一个 Agent 交付的结构化产物改动 + 它自己的一句话自述，右上角是风险概览。
2. 点开一条 → 先看到顶部 **before/after 判定 banner**（Agent 说"改动很小 ✅" → Contour 的意图保真分与 BLOCK/REVIEW/SAFE 判定），下面是那份"看起来很小"的**行级 diff**。
3. 点 **「语义 diff · 意图核验」** 切换：
   - 左列 = **语义树**（产物被解析成实体 / 关系 / 约束，改动标注在语义结构上）；
   - 右列 = **意图/不变量 findings**，Critical 顶到最前，每条标注"**是否在行级 diff 里看不见**"和"**判定依据**"。
4. 点任一 finding → 高亮定位到语义树对应节点；用严重度 chip 筛选 Critical/Warn/Info。
5. 顶栏 **「为什么行级 diff 不够？」** 有价值主张说明与内置不变量清单。

内置 5 个场景，覆盖 SAFE / REVIEW / BLOCK 全档（含一个真正安全、判定为"可放心 merge"的场景，证明它不是一味报警）。

## 本地运行

```bash
npm install
npm run dev      # 本地开发，打开终端提示的 http://localhost:5173
```

## 构建 / 预览

```bash
npm run build    # 先 tsc 类型检查，再 vite build，产物在 dist/
npm run preview  # 本地预览 dist/
```

- 技术栈：Vite + React + TypeScript。
- `vite.config.ts` 设 `base: './'`，保证部署到任意 GitHub Pages 子目录都能正确加载资源。

## 目录结构

```
src/
  App.tsx                    主布局：收件箱 + 评审视图 + 状态
  types.ts                   语义模型 / finding / 场景 的类型
  data/scenarios.ts          5 个 mock 场景（自述 / 行级 diff / 语义树 / findings）
  logic/scoring.ts           确定性的意图保真分与 SAFE/REVIEW/BLOCK 判定
  components/
    Inbox.tsx                改动收件箱列表
    VerdictBanner.tsx        before/after 判定 banner
    DiffPane.tsx             行级 diff（"语义盲"的对照视角）
    SemanticTree.tsx         语义 diff 树（实体/关系/约束级）
    FindingsPanel.tsx        意图/不变量核验结论
    HowItWorks.tsx           价值主张与不变量说明
```

## 不做什么（这是评审镜片，不是别的东西）

- 不替用户产生任何改动（不是 CAD authoring copilot）。
- 不可视化执行过程（不是 run trace / 终端可视化）。
- 不核验 Agent 的自述文字是否有证据（那是另一层）。
- 不做真实的多语言解析器：用确定性预置的语义模型 mock 来演示价值。
