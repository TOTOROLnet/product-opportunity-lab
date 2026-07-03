# Gavel — Agent 动作审批驾驶舱（Demo）

纯前端交互 Demo，全部数据为 mock，不接任何后端 / 数据库 / 外部 API。

一句话定位：让高风险 Agent 动作在几秒内被安全裁决——附带决策上下文，且每次裁决都会沉淀为策略。

## 三屏体验
1. 审批收件箱：待裁决的高风险 Agent 动作队列。
2. 决策详情：决策上下文卡片（推理链 + payload + 影响范围 + 历史相似裁决）+ 一键裁决。
3. 策略与学习：由历史裁决沉淀的策略与效率指标。

## 运行

```bash
npm install
npm run dev       # 本地开发预览
npm run build     # 构建到 dist/
npm run preview   # 预览构建产物
```

## 技术

Vite + React + TypeScript。`vite.config.ts` 使用 `base: './'`，构建产物可部署到任意子路径。
