# 收播 Sign-Off — Demo

> 把你的"稍后读/稍后看"积压，做成一档 **AI 主持、每天会结束**的节目。
> AI 只做主持/策展（**选**今天放哪几条、**排**成起承转合的弧线、写**串场口播**与收尾），
> 一个字正文都不生成；节目**刻意有限、放完就收播**（反无限流），且顺手**清空你自己的积压**。

灵感来自 2026-07-29 product-hunt-radar 报告中被低估的一条 2C 洞察（**SUB/WAVE**：让 AI 当电台
DJ / 主持而非内容生成器、刻意反算法），但把它从"自托管音乐直播电台"迁到大众都有的**"稍后读坟场"**，
并叠加"节目会结束 + 清空积压"这一反直觉设计。详见上级目录 `opportunity.md` 的不照抄声明。

## 这是什么类型的 Demo

**可视化 / 交互类**——一个可点击的"每日节目播放器"，你能真正走完闭环：

1. **节目单 Rundown**（首屏）：看今天 AI 从你积压里挑的 6 条、排成的起承转合弧线、每条的"为什么现在放这条"，以及"积压 128 → 122"的清空预告。
2. **播放器 Player**：逐条播放，上方是 AI 主持的串场口播、下方是你自己保存的内容摘录；一条**会收拢的有限进度弧**显示"还剩约 N 分钟然后收播"；可【读完了】或【跳过】。**没有无限自动续播。**
3. **收播 Sign-Off**：放完进入收播页——收尾语、清了几条 / 积压下降 / 连续天数、before-after 积压条形对比，以及一句刻意反 doomscroll 的"没有下一条了，去过你的生活吧"。

顶部有"**主持话痨度**（简洁 / 正常 / 健谈）"开关，直观展示 AI 只做主持、可调、不喧宾夺主。

## 运行方式

前置：Node.js >= 18。

```bash
# 1. 安装依赖
npm install

# 2. 本地开发（默认 http://localhost:5173 ）
npm run dev

# 3. 生产构建（先 tsc 类型检查再 vite 打包，产物在 dist/）
npm run build

# 4. 本地预览构建产物
npm run preview
```

## 关键工程点

- **技术栈**：Vite + React + TypeScript。
- **`vite.config.ts` 设 `base: './'`**（相对路径），保证部署到任意 GitHub Pages 子目录（`/<date>/`）都能正确加载资源。
- **全部数据 mock**：见 `src/data/backlog.ts`（你的积压）与 `src/data/program.ts`（今日节目单 + 主持口播）。
- **确定性编排引擎**：`src/logic/engine.ts` 把节目单与积压 join、算出弧线/总时长/清空后的积压，模拟"AI 编排"的结果且每次可复现。

## 明确不做什么

- 不做登录 / 用户系统。
- 不接数据库 / 支付 / 外部私钥 / 真实 Pocket·Readwise·YouTube API / 任何真实 LLM 调用。
- 不做生产级后端；串场口播是预置 mock 文本（模拟 AI 生成结果）。
- 不做无限流 / 自动续播——这正是本产品要反的东西。

## 目录结构

```
demo/
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── src/
│   ├── main.tsx
│   ├── App.tsx                 # 状态机：节目单 → 播放器 → 收播
│   ├── index.css
│   ├── types.ts
│   ├── data/
│   │   ├── backlog.ts          # mock：你的稍后读积压
│   │   └── program.ts          # mock：今日节目单 + AI 主持口播（3 档话痨度）
│   ├── logic/
│   │   └── engine.ts           # 确定性编排：join / 弧线 / 时长 / 积压
│   └── components/
│       ├── RundownView.tsx
│       ├── PlayerView.tsx
│       └── SignOffView.tsx
```
