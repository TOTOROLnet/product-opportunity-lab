# Run Log — 2026-07-19

## 使用的报告
- `daily/2026-07-19/source-report.md`（= product-hunt-radar `2026-07-19.md`，由 `scripts/collect_recent_reports.py --days 1` 拉取；今日 radar 已发布，未复用昨日）。
- 报告要点：典型「窗口重叠日」。A 类新达标：**OpenMarkdown（14/18，人机共编本地 .md）**、**ZooData（13/18，agent 按字段计费数据层）**、Clark（13）。趋势 #1「AI 从聊天框走向共享文档/画布」（OpenMarkdown + 07-16 Tiptap/Campus）。**B 类（2C）今日无新达标产品**（Mainichi/WX 经核实 AI 非核心）。

## Loop 1 — 机会发现（客观 + 创新）
- 客观性：区分「报告事实」与「我的独立判断」。核心分歧——报告把 OpenMarkdown 的「按小节隔离 + 不闪烁渲染」当作解决了人机共写；我判断那只是**渲染层承诺**，真正没被解决的是**并发写仲裁 / 执笔权移交**（消解冲突而非回避冲突）。
- 3 个候选 + 五维评分（25 制，独立重评，不搬报告 18 制分数）：
  - **A 并笔 CoBaton（22/25）**——编辑器之下的执笔权协调引擎（区域所有权 + 接力棒 + 延后/再校验）。coordination 新家族。
  - B 字段账 FieldLedger（16/25）——riding ZooData 按字段预算规划；与 07-14「值当」spend 家族重叠，且演示必编成本数字、诚实度低 → 否。
  - C 共识锚 IntentAnchor（18/25）——共写行内活约束校验；偏 review 家族、比 A 窄 → 次选。
- 选中 **A 并笔 CoBaton（22/25）**，达门槛（≥16）→ 进入 Demo。
- 家族多样性：刻意跳出近期反复的 governance/审查/审批家族，选并发协调（coordination）这一新家族。

## Loop 2 — Demo 设计
- 分型：抽象/基础设施类 → 纯前端「模拟共写会话回放 + 玻璃盒所有权可视化 + before/after 对比」。
- 3 Tab：① 共写台（活文档 + 模式开关 + 时间轴回放 + 解说）② 执笔权地图（玻璃盒：所有权/延后队列/逐事件日志）③ 对比（同序列两模式可测指标）。
- 写入 `demo-spec.md`。

## Loop 3 — Demo 开发
- 技术栈：Vite 5.4 + React 18.3 + TS 5.6，复用 07-18 config 骨架（tsconfig/vite.config base:'./' 等）。
- 真实确定性引擎 `src/logic/engine.ts`：事件归约 + 区域所有权状态机（free/human/agent）+ claim/defer/revalidate + 指标计算；两模式（naive / cobaton）跑同一条 mock 事件序列。
- mock 数据：`src/data/doc.ts`（《退款 SOP》5 小节）+ `src/data/timeline.ts`（19 个事件，含人聚焦/编辑/离开、agent 领任务/声明/落改、人删除）。
- **上线前用 esbuild --bundle harness 离线校验引擎数字**（避免仅靠 UI 猜）：naive={lost2,intr3,waste1,preserved0/2,inconsistent}，cobaton={0,0,0,preserved2/2,consistent}——与设计一致。harness 校验后删除。

## Loop 4 — 自动验证
- `bash scripts/validate_demo.sh daily/2026-07-19/demo`：**首轮通过（0 修复轮次）**。npm install 成功；`tsc -b && vite build` 成功；dist/index.html 非空含 root 挂载；1 个 JS bundle（158KB/gzip 52.6KB）。
- 构建产物（*.tsbuildinfo / vite.config.js / vite.config.d.ts）已加入根 `.gitignore`，提交保持干净。

## 浏览器实测（computerUse @ preview 4173，session cobaton-preview）
- 5 张截图存 `daily/2026-07-19/screenshots/`（01-stage-initial、02-stage-cobaton-end、03-stage-naive-end、04-ownership-map、05-compare）。
- 全流程走通、无 visual bug；屏幕读到的指标与离线引擎校验**完全一致**：并笔 0/0/0 保留 2/2 ✅一致；朴素 2/3/1 保留 0/2 ❌不一致。模式开关、播放/单步/重置、Tab 切换、小节点击筛选日志均正常。

## 遇到的问题
- 无阻塞问题。build 首轮即过；无 CSS 变量踩坑；SVG 未使用（本 Demo 无图谱节点，无 07-18 的短名裁剪问题）。

## 最终结论
- **status = PASS，reason = ok**。达门槛（22/25）+ build 成功 + 三 Tab 核心流程闭合 + 必需产物齐全 + 指标经离线与浏览器双重验证一致。
