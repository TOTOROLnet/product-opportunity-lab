# 常青 Evergreen — 活文档鲜度守护 agent（Demo）

把"鲜度（freshness）"变成活文档的一等属性：agent 将文档里每条**承重论断**（价格、时限、政策、
API 版本、SLA 等）绑定到它依赖的**真实来源**；当来源发生变化，agent 精确定位到**具体那句话**、
生成**最小改写补丁**、并维护一个**文档鲜度分**。人只需 review-before-apply 一键采纳；
无法自动改写的（口径变模糊等）升级为"需人判断"，由人拍板。

> 这是一个**纯前端静态 Demo**，用来演示我们分析出的创新切入点（"写入之后的鲜度维护"），
> 不是 Tiptap（写入可靠性）/ Mantle Clerk（cap-table 入表）/ Notion 的克隆。

## 场景

一份中小 SaaS/电商的「客服退款处理 SOP」，被一线客服每天引用。它依赖 5 类会变的来源
（退款政策时限、跨境手续费、支付网关接口、到账时效、争议口径）。过去 30 天这些来源悄悄变了，
但 SOP「看起来」没变——鲜度只剩 **58%**（12 条承重论断里 7 条仍与来源一致，5 条已失真）。

## 三个页面

1. **文档 · Document**：带**逐句鲜度高亮**的 SOP（绿=鲜 / 红=已腐 / 橙=需人判断）+ 文档鲜度分。
   点任意高亮句看它绑定的来源与版本历史；点「回放这 30 天」，亲眼看它如何在无人察觉中变腐
   （鲜度 100% → 92% → 83% → 75% → 67% → 58%）。
2. **来源 · Sources**：来源变更时间线 + 每个来源当前值 + 依赖它的论断影响面。
3. **补丁 · Patches**：agent 提议的最小补丁（旧句 → 新句 + 变更原因），逐条采纳/驳回；
   一键"采纳全部可自动修复项"把鲜度拉回 **92%**；剩下 1 条"需人判断"由你选定改写口径后达 **100%**。

## 本地运行

```bash
npm install
npm run dev      # 本地开发，默认 http://localhost:5173
npm run build    # 产物输出到 dist/
npm run preview  # 预览已构建产物
```

- 技术栈：Vite + React + TypeScript。
- `vite.config.ts` 设 `base: './'`，保证部署到任意 GitHub Pages 子目录都能正确加载资源。

## 真实 vs 模拟（诚实说明）

- **真实**：`src/logic/engine.ts` 是确定性引擎——按时间线位置计算每个来源的当前版本、
  逐条判定论断鲜/腐、生成补丁文本、算出鲜度分。before/after 的数值是**实测**，不是写死的。
- **模拟**：真实产品里"把哪句话绑到哪个来源""来源语义变化到什么程度算腐"由 **LLM** 完成；
  本 Demo 将这些关系**预编码**在 `src/data/`（`sources.ts` / `claims.ts` / `timeline.ts`）里。
- 全部数据均为围绕"退款处理"场景**虚构**的 mock；不接后端 / 数据库 / 支付 / 登录 / 外部 API。

## 目录

```
src/
  data/       sources.ts（来源+版本）、claims.ts（论断+绑定）、timeline.ts（来源变更事件）
  logic/      engine.ts（确定性鲜度引擎）
  components/ DocView / SourcesView / PatchesView / shared
  App.tsx     顶层状态与三页装配
  types.ts
```
