# Run Log — 2026-08-25

## 使用的报告

- `daily/2026-08-25/source-report.md`，源自 product-hunt-radar 的 `reports/2026-08-24.md`。
- **provenance 关键点**：今天是 2026-08-25，但 `python3 scripts/collect_recent_reports.py --days 1` 拉到的最新报告
  仍是 **2026-08-24.md**——上游 radar 落后了一天，本轮拿到的是**昨天用过的同一份报告**。这是客观事实（非选择重复）。
  依据"不照抄/不重复"纪律，今天**换切入形态**：不重复昨天(08-24)的「召算 · 运行时成本×毛利沙盘」，
  也避开记忆中已做旧的审计/回放/对齐/成本沙盘等形态。

## 各 Loop 关键决策

- **Loop 1 机会发现**：报告唯一真正新的 AI-core 仍是 Construct Computer（每个 agent 一台按需云电脑）+「agent 运行时层/
  不可能三角」趋势，2C 侧无信号。生成 3 个候选并诚实打分：
  - A 现成 Xiànchéng（跨 agent「已验证做法」检索与复用层）—— **21/25**
  - B 编队（委派拓扑/并发编排规划器）—— 16/25（与已做过的 合流/并笔 重叠、AI 核心弱，不选）
  - C 可玩（2C prompt→可玩→feed）—— 11/25（报告无可核实 2C 信号；AI 核心在纯前端无法真实生成；近 Pocket 照抄，不选）
  - **选中 A（21/25）**，达 16 门槛，进入 Demo。理由：骑上报告唯一新信号，但换到"跨 agent 做法复用"这一没人做、
    记忆标记为"仍开放"的中间层；痛点随舰队规模放大且高频；纯前端可诚实演示。
- **Loop 2 Demo 设计**：判定为抽象/基础设施类 → 采用「模拟体验 + 价值可视化」：可搜索面板 + 资源/结构视图 +
  原始运行 vs 蒸馏配方 before/after 对比。3 个 Tab：检索台 / 配方 / 来源与信任。
- **Loop 3 Demo 开发**：Vite + React 18 + TS，`base:'./'`。复用历史证明稳定的 tsconfig（noUnusedLocals=false）。
  手写 SVG 评分环（无图表库，零额外依赖）。确定性检索打分（意图 55% + 环境指纹 45%）模拟语义检索；
  确定性省下估算（步数差 × 带标注 mock 单价）。mock corpus = 10 条舰队历史运行（含原始痕迹 + 蒸馏配方）+ 5 张预置意图卡。
- **Loop 4 验证**：见下 build 轮次。
- **Loop 5 自评**：结论 PASS（详见 evaluation.md）。

## 数值预检（信 UI 前先核对）

- 用 esbuild 打包 throwaway node 脚本跑真实数据+逻辑：确认
  I1(Cloudflare) top=Cloudflare 运行 100 分、Vercel 运行 65 分且产出「平台」适配、Astro(未验证)54 分；
  I2(Playwright) top 100、Cypress 52(2 处适配)；跨主题落 15~23 分；
  省下=原始步数−配方步数；fleetMonthlyTotal(10)=$34、(3)=$10、(50)=$171。**无标定 bug**（不同于 08-24 需修 2 处）。

## build 轮次与结果

- 第 1 轮：`bash scripts/validate_demo.sh daily/2026-08-25/demo` → **成功**（npm install + `tsc -b && vite build` +
  smoke 全通过；dist/index.html 含 `id="root"`，1 个 JS bundle）。**build_attempts = 1，零修复。**

## 浏览器验证

- tmux 起 `npm run preview --port 4173`，computerUse 子代理走通 6 步主路径并截图到 `screenshots/`（01~06）：
  默认检索台 / 切 Playwright 任务 / 移除 Cloudflare 指纹后分数重算 / 配方 before-after / 舰队滑块联动($9→$42) / 来源与信任页。
  我另抽查 01、04 两张截图确认渲染无误。computerUse 报告无布局 bug、无控制台报错。（其对中文/数字偶有 OCR 误读，属工具伪影，非应用 bug。）

## 遇到的问题

- 无阻断性问题。报告重复（radar 落后一天）已按纪律换形态处理。build 一次过。
- `tsc -b` 可能在 demo 目录产出 `*.tsbuildinfo` / `vite.config.js` / `vite.config.d.ts` 等产物——提交前已清理（见提交步骤）。

## 最终结论

- status = **PASS**，reason = **ok**。
- 选中机会：现成 Xiànchéng（跨 agent「已验证做法」检索与复用层），21/25。
- Demo：vite-react-ts，simulation 策略，build_attempts=1。产物齐全（opportunity / demo-spec / demo / evaluation / run-log / status + screenshots）。
