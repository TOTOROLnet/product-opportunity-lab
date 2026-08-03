# Run Log — 2026-08-03

## 使用的报告
- `daily/2026-08-03/source-report.md`（自 public product-hunt-radar 拉取，`python3 scripts/collect_recent_reports.py --days 1` → latest = 2026-08-03.md）。
- 报告基调：近乎整体是 08-01/08-02 窗口的重复上架，真正新增约 4 个。新增信号：UniwebPay Skill（A，13）、Bolcho AI（A，12）、**Zinley（B，13）**；今日无新前沿模型/基础设施信号。

## 各 Loop 关键决策

### Loop 1 — 机会发现
- 记忆提示：最近 5 天 4 天技术向、仅 1 个 2C（07-30 收播），**若有像样新 2C 应强烈优先做 2C**。今日 Zinley 是唯一像样的新 2C 信号 → 决定做 2C。
- 独立判断（区别于报告叙事）：不盲从"独立身份=卖点"；抓报告自陈的生死线「信任设计 > 功能多少 / 一次出格就崩」作为创新切入点。
- 候选：A 分寸 Poise（上岗前分寸彩排+授权边界，21/25）；B 出场前一句（口吻试音，17）；C 名义回执（事后日结，17）；D 落地表 Skillsmith（技术向 UniwebPay 路线，19，因今日应还 2C 债 + 与师承/榫卯/governance 相邻 + "诚实计算器/lint"形态连用两天会腻 → 记录不选）。
- 选中 **A 分寸 Poise，21/25 ≥ 16** → 进入 Demo。
- 不照抄声明：Zinley 是执行型分身（有号码、真行动）；Poise 厂商中立、不执行任何对外动作，是上游信任校准台，动机相反，非克隆。

### Loop 2 — Demo 设计
- 分型：可视化/交互类 → 直接做可点击交互 Demo。三段闭环：情境拍板 → 分寸画像（话题×风险热力矩阵）→ 一周回放（差点出格 + 收紧重算 + 对比）。

### Loop 3 — 开发
- 技术栈 Vite5 + React18 + TS5.6，`vite.config base:'./'`；复用 08-02 的 tsconfig/vite 配置。
- 确定性引擎 `src/logic/engine.ts`：授权随风险单调收紧（cellAutonomy）、出格贴近度=授权数值×风险权重、阈值 6、classifyWeek/tightenTopic/profileArchetype。
- **先验证后建 UI**：用 esbuild 打包真实引擎 + 临时 `_verify.ts` 跑一遍（跑完即删）。确认：默认回放 处理6/拟稿6/退回3/拦下0、4 件出格（w6/w7/w8/w14）、偏放手型 avgMid 2.25；收紧 negotiate+access 后 0 件出格、偏协作型 avgMid 2.00；family 红线整行禁碰、拦下 2 件。数字与设计预期一致。
- 修正 1 处 CSS 无效 hex（`#1a2burn`→`#1a2b55`）。

### Loop 4 — 自动验证
- `bash scripts/validate_demo.sh daily/2026-08-03/demo`：**npm install + npm run build + smoke 全通过，首轮成功（build 修复轮次 0/3）**。

### 浏览器验证
- tmux 起 `npm run preview`（127.0.0.1:4173，200 OK）；computerUse 子代理走完三 Tab 全流程 + 截图 6 张到 `screenshots/`。
- computerUse OCR 一贯误读中文/数字（记忆已记录）：首轮它在彩排里点了很多"放手"，回放看到的是它自己的激进画像（8 件出格），非默认值——属预期。
- **我本人核对截图**：01 彩排台首屏、04 分寸画像渲染正常；重抓的 05/06 干净回放截图与引擎完全吻合——默认 6/6/3/0 + 4 件出格「偏放手型」；一键收紧后 4/6/5/0 + 0 件出格 + 绿色 banner「偏协作型」，平均授权 2.25→2.00。

### Loop 5 — 自评
- 结论 **PASS**。见 evaluation.md。

## 遇到的问题
- CSS 一处无效 hex，已修（记忆里的经典坑，构建前 eyeball 时发现）。
- computerUse OCR 误读 + 首轮把画像点激进，导致 05/06 截图非默认态 → 重跑一次（不动彩排、刷新后直接进③）抓到干净的 4→0 截图。均已解决。

## 提交
- commit#1：source-report + opportunity + demo-spec + demo 源码（build 前，含 package-lock，排除 node_modules/dist）。已 push（[new branch]）。
- commit#2：evaluation + run-log + status.json + screenshots。push 后由 GitHub Actions 同步进 main 并部署 Pages。
- 未开 PR（cursor/** 由 Sync Action 秒删）。

## 最终结论
- status = **PASS**，reason = **ok**，selected = **分寸 Poise**，score = **21/25**，build 首轮成功，产物齐全。
