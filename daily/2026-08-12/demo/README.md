# 随读 Suídú · 自主 Agent 运行的「3 分钟补看」阅读器

> 把一整段过夜/后台自治 agent 运行（含它给项目改了什么、**给自己改了什么**），
> 从散落的原始轨迹 + 大 diff 重构成一条 3 分钟能读懂的**叙事时间线**，
> 并把需要你拿主意的 2–3 个岔口顶出来——**只帮你读懂，不打分、不放行、不判对错**。

这是 product-opportunity-lab 在 2026-08-12 的每日机会 Demo，演示的创新切入点：
**服务 Prime Agent 式"自治 + 会自我改写"agent harness 的下游——把任务委派出去的那个人类，
如何在运行结束后低成本地"接手理解"。** 详见 `../opportunity.md` 与 `../demo-spec.md`。

## 这不是什么（非照抄声明）

- 不是 **Prime Agent** 的克隆：我们不造 harness、不让 agent 自改，只服务其下游的人类理解。
- 不是 **oqoqo** 式 eval：不给 agent 打通过率/摩擦分，产出是一段可读的过程叙事。
- 不是 agent 可观测性 / trace 工具：那类给越全越好的原始 trace 供调试；随读做减法与叙事，给非在场者接手。
- 不是扁平的"会话摘要"：随读可滚动追溯、每句可展开到原始步骤/diff，并显式分出"需要你决定 vs 只是过程"。

## 页面

1. **① 补看**：分章的叙事时间线（发生了什么 & 为什么，可展开 diff/工具调用）+ 织入的
   「假设卡」「悬案卡」+ 右栏「只盯这些」（顶出 3 个该你拿主意的岔口）+
   「只看需要我决定的」过滤开关（折叠"只是过程"的章节）。
2. **② 它改了自己**：Continual Harness 式自我修订（skill/memory 的 add/update）的可读变更日志，
   含 before/after、触发依据、对未来行为的影响；只「看懂 + 标记下次留意」，不放行不回滚。
3. **③ 对照**：原始 41 步日志 + diff（逐行爬 ≈17 分）对比随读叙事（≈3 分）的 before/after，
   用透明启发式公式把"读懂成本"的增量做到可感；可展开自证"不藏信息"。

## 技术栈

- Vite + React + TypeScript，纯前端静态站点。
- `vite.config.ts` 设 `base: './'`（相对路径），可部署到任意 GitHub Pages 子目录。
- 全部数据为 mock（`src/data/run.ts`）；叙事由确定性纯函数引擎（`src/logic/engine.ts`）推导，
  **不接后端 / LLM / 数据库 / 密钥 / 登录 / 支付 / 外部 API**。

## 本地运行

```bash
npm install      # 安装依赖
npm run dev      # 本地开发（默认 http://localhost:5173）
npm run build    # 类型检查 + 生产构建，产物在 dist/
npm run preview  # 预览已构建产物
```

## 目录结构

```
src/
  main.tsx              入口
  App.tsx               外壳：委派任务头 + 三个 Tab
  types.ts              数据模型（AgentRun / Chapter / Assumption / LooseEnd / SelfEdit ...）
  data/run.ts           全 mock 的一段自治 agent 运行轨迹（CSV 导出 + 修 flaky 测试场景）
  logic/engine.ts       确定性纯函数：summarize / attentionItems / decisionChapterIds / 用时估算 ...
  components/
    shared.tsx          PhaseTag / DiffView / kind 元信息
    CatchupTab.tsx      ① 补看：叙事时间线 + 只盯这些 + 决策过滤
    SelfEditsTab.tsx    ② 它改了自己：自我修订变更日志
    CompareTab.tsx      ③ 对照：before/after 读懂成本
  index.css             主题与布局（ink + sky/amber/violet）
```
