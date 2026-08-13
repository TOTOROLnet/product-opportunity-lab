# 顺口 Shùnkǒu — 母语差距教练（Native-Gap Coach）· Demo

> 从你的**真实英文产出**里，聚类出让你"不地道"的那几个**反复出现的习惯**，做成一张会随练习**可见收敛**的个人口音图谱，再精准补掉。
> **不碰发音** —— 只做发音之上的地道度。

本 Demo 是 `product-opportunity-lab` 在 2026-08-13 的每日机会循环产物，演示的创新切入点：
**把英语学习的分析单位，从"词（Anki）/ 音素（ELSA/Linforge）/ 单句错误（Grammarly）"升级为"你反复出现的产出习惯（idiolect gap）"。**

## 它解决什么问题

中高级学习者（CEFR B1–B2）的"**能被听懂但一直不地道**"高原期：
逐条改错改完就忘（实例级、不告诉你有哪几个反复出现的习惯），发音 app 只解决音素。
没有工具把"你的真实产出"变成"针对你个人系统性弱点"的训练。

## 三步核心体验（3 分钟看懂）

1. **今日一练 (Practice)**：选一个真实工作场景（PR 改约 / 婉拒 deadline / 给反馈），
   看"你的产出 vs 母语者会怎么说"，差异按**习惯类型**高亮，点开看"为什么"。
2. **我的口音图谱 (Gap Map)**：把 3 段产出放一起，聚类出你**反复出现的 Top 习惯**（频次 + 实例 + 收敛趋势）。
3. **补差牌组 (Drill Deck)**：只针对这些习惯的**间隔微练习**；练对一道，图谱里对应习惯的收敛进度**实时上升**（before/after）。

## 与现有产品的区别（非照抄）

| | 分析单位 | 素材来源 | 核心产物 |
| --- | --- | --- | --- |
| Linforge | 词（Anki 牌组）+ 音素 | 你在背的词表 | 对话 + 发音分 |
| ELSA / Speak | 音素 / 流利度 | 朗读 / 跟读 | 发音评分 |
| Grammarly | 单句错误（实例级） | 事后校对文本 | 逐条改错 |
| **顺口 Shùnkǒu** | **你反复出现的产出习惯** | **你的自由产出 vs 母语改写** | **会收敛的个人习惯图谱 + 精准补差练习** |

## 技术栈与运行

- **Vite + React + TypeScript**，纯前端静态，无后端 / 数据库 / 登录 / 支付 / 外部 API / 真实 LLM / 语音。
- `vite.config.ts` 设 `base: './'`，可部署到任意 GitHub Pages 子目录。

```bash
npm install     # 安装依赖
npm run dev     # 本地开发（默认 http://localhost:5173）
npm run build   # 生产构建，产物在 dist/
npm run preview # 预览构建产物
```

## 诚实说明

- 母语改写、跨样本聚类出"习惯"、按习惯生成练习，均由**脚本化"模拟 AI 引擎"（`src/engine.ts`）+ 全 mock 语料（`src/data/mock.ts`）** 呈现。真实产品由 LLM 完成这三件事。
- 全部语料为手工构造、贴合"中文母语、B1–B2、用英文工作"的真实场景，**非真实用户数据**。
- **刻意不做发音 / 音素评分**——那是 ELSA/Linforge 的地盘，也非本产品切入点。

## 目录结构

```
src/
  App.tsx                 # 外壳 + 三 Tab 切换 + 共享进度 state
  engine.ts               # 「模拟 AI 引擎」：聚类 / 高亮 / 批改
  data/mock.ts            # 全部 mock 语料（任务 / 习惯 / 练习）
  types.ts                # 类型定义
  components/
    PracticeTab.tsx       # 今日一练：产出 vs 母语改写 + 差异高亮
    GapMapTab.tsx         # 我的口音图谱：习惯聚类 + 收敛趋势 + 下钻
    DrillDeckTab.tsx      # 补差牌组：间隔微练习 + 图谱联动收敛
    shared.tsx            # HabitTag / Bar / Pill
  index.css               # 全部样式
```
