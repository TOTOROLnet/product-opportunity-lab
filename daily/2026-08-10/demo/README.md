# 预调 Pretune — 本地后训练的「飞行前副驾」

> 在你敲 `train` 之前，一层**厂商中立、透明可审计**的决策与显存可行性副驾：
> **该不该微调 / 这张卡塞不塞得下 / 该用哪种方法（SFT-LoRA / DPO / ORPO / SimPO / KTO / 蒸馏 / RAG）。**

本项目是 product-opportunity-lab 于 **2026-08-10** 产出的纯前端静态 Demo。灵感信号来自 product-hunt-radar
当日报告中的 **Soup CLI**（逐层流式 + NF4 把 8B 微调压进 4GB 显存）与「后训练下沉到消费级硬件」趋势，
但**不是** Soup 的克隆：Soup 是执行层（跑训练）且黑箱自动决策；本产品是训练**之前**的决策/预算层，
透明、厂商中立、不跑训练。

## 它解决什么问题

后训练在消费级硬件上变得人人可做之后，瓶颈从「跑不跑得起来」转移到：

1. **该不该微调**——很多需求其实用 RAG / prompt 更对，硬微调白烧显存。
2. **塞不塞得下**——跑到中途 OOM，或不知道量化/逐层流式后自己的卡够不够。
3. **该用哪种方法**——SFT / DPO / ORPO / SimPO / KTO / 蒸馏 选错就白跑。

预调把这三件事在**动手前**说清楚，并把每个结论的推理**摊开可审计**（对立于黑箱自动化）。

## 三个页面（Tab）

1. **该不该调** —— 决策树判定 + 理由 + 「什么会改变结论」+ 选错方法的代价。
2. **塞不塞得下** —— 常驻 fp16 / 常驻 NF4 / 逐层流式 三种策略的峰值显存对比条形图 + 逐层流式动画 +
   fits/tight/OOM 判定 + 时间↔显存交叉点（附透明公式）。
3. **怎么调** —— 方法家族对号矩阵（为什么是它、为什么不是其他）+ 生成的可执行训练计划清单。

改左侧任一配置，三屏结论会实时联动。

## 技术栈

- Vite + React + TypeScript
- 无后端、无外部依赖、无网络请求；决策为确定性规则、显存为透明公式，全部数据 mock。
- `vite.config.ts` 设 `base: './'`，可部署到任意 GitHub Pages 子目录。

## 本地运行

```bash
npm install      # 安装依赖
npm run dev      # 本地开发（默认 http://localhost:5173）
npm run build    # 生产构建，产物在 dist/
npm run preview  # 本地预览构建产物
```

## 目录结构

```
src/
  App.tsx                 # 顶层：配置面板 + 三个 Tab
  types.ts                # 全部类型
  logic/engine.ts         # 决策树 + 透明显存公式 + 方法对号矩阵 + 训练计划
  data/                   # tasks / models / hardware / methods（全 mock）
  components/             # ConfigPanel + DecisionTab + VramTab + MethodTab + shared
```

## 重要声明

- 显存/性能均为**教学级透明估算**，用于「动手前」判断可行性，**不等于任何厂商的实测数字**。
- 报告中 Soup 的 3.32GB / 119.6 tok/s / bit-exact 为官方自测、未独立核实，本 Demo 不复用其数字。
- 不接 LLM / 数据库 / 密钥 / 登录 / 支付 / 外部 API，也不真正读取 GPU 或运行训练。
