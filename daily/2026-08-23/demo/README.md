# 编谱 Biānpǔ — 面向 coding agent 的语义改动谱编排台（Demo）

> 2026-08-23 · product-opportunity-lab 每日机会循环产物 · 纯前端静态 Demo

把「让 agent 改代码」从一句**藏着歧义的散文指令**，升级成人能编排、agent 能精确演奏的结构化
**「改动谱」**：在代码的符号/依赖图上编排语义操作（重命名 / 改签名并传播 / 抽取能力 / 改类型），
对散文里没拍板的歧义**拍板参数**，实时看到每个操作展开成的**确切语义编辑**，最后导出一份
**无歧义、机读的操作清单（manifest）**交给任意 coding agent 照谱演奏、零猜测。

## 它解决什么

重度用 coding agent 做**跨文件结构性重构**的人，最常在「一句话交给 agent → 少改/错改/过度改 →
反复纠偏」上损耗。根因：这段「人→agent 的意图交接」今天是**散文、藏着人本该拍板的决策**
（新名字？签名默认值？改动范围？传播到哪些调用点？）、**零结构、零可复核**，agent 只能猜。
编谱把这些猜测**在输入端**消除。

## 三个视图（单页 + 三个 Tab）

1. **编排台**：左侧散文指令（红色虚线 = agent 只能猜的点）+ mock 仓库；右侧启用/停用 4 个语义操作、
   对 `opts 必填/选填`、`Cents 范围` 等歧义拍板 —— 顶部指标条实时重算「待猜点数 4 → 0」。
2. **演奏预览**：每个操作展开成的、逐条可复核的确切语义编辑（锚点 / 传播 / 兼容），标注每步待猜 = 0。
3. **一谱三读**：同一份谱的三种投影 —— 给人的白话摘要、给 agent 的机读 manifest（JSON，可复制）、
   结构级变更预览。

## 关键说明（可信度）

- **纯前端、全 mock、确定性**：`src/data/codebase.ts` 是手工构造的 mock 语义图（`acme-checkout`），
  `src/engine.ts` 是**确定性**展开引擎（纯函数、无随机、无网络），所有数字完全可复现。
- **不接**任何 LLM / 后端 / 数据库 / 支付 / 登录 / 密钥 / 外部 API，**不真正解析或改写**你的真实代码。
- 演示的是「人在意图空间编排、agent 拿无歧义清单执行」这一**创新切入点**，非 Zero（新系统语言）克隆、
  非 IDE 单点重构、非让 agent 直接吃散文。

## 本地运行

```bash
npm install      # 安装依赖
npm run dev      # 本地开发预览（默认 http://localhost:5173）
npm run build    # 产出静态站点到 dist/
npm run preview  # 预览 build 产物
```

## 技术栈

- Vite + React + TypeScript
- `vite.config.ts` 设 `base: './'`（相对路径），保证部署到任意 GitHub Pages 子目录都能正确加载资源。
- 无运行时第三方 UI 库，样式为手写 CSS（`src/index.css`）。

## 目录

```
src/
  main.tsx            入口
  App.tsx             壳：header + 指标条 + tab 切换
  engine.ts           确定性语义改动谱引擎（compose / toAgentManifest）
  data/codebase.ts    mock 语义图（文件 / 符号 / 引用 / 散文歧义）
  components/
    Compose.tsx       Tab1 编排台
    Perform.tsx       Tab2 演奏预览
    ThreeReaders.tsx  Tab3 一谱三读
  index.css           主题样式（深色 studio/score）
```
