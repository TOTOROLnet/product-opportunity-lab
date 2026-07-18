# Run Log — 2026-07-18

## 使用的报告
- `daily/2026-07-18/source-report.md`（由 `python3 scripts/collect_recent_reports.py --days 1` 自公共 product-hunt-radar 拉取，latest = `2026-07-18.md`）。
- 报告关键信号：技术向 Kimi K3（3T 开放模型）、Codex Micro（监督 coding agent 的硬件面板）、共享记忆/上下文层（In Parallel / Unabyss / Kit For AI）、agent 身份（Nitrosend / Verse）；2C 仅 **Paradigm**（自适应学习）达标。

## Loop 1 — 机会发现（关键决策）
- 客观性：认同「今日技术向信号更硬」这一事实，但质疑「= 今日最该做的机会」这一结论；对纯前端、诚实优先、且被要求不要系统性忽略 2C 的实验室，Paradigm 暴露的「自适应信任缺口」更锋利、更可诚实演示。
- 去重把关：查近 10 日产出，发现 agent 监督/授权/记忆治理/对账被密集覆盖（07-08 ClaimLadder、07-12 明约、07-13 记衡、07-14 值当）。据此**排除**记忆治理类（会自我照抄 07-13 记衡）与并行 agent 审批舱（落回重复区）。
- 候选与评分（五维/25）：A 明镜 GlassTutor **23**、B 值守面板 AgentDeck 19、C 缓存工坊 CacheCraft 16、D AgentID 台账 15。
- 选中 **候选 A（23/25）≥ 16 门槛** → 进入 Demo。

## Loop 2 — Demo 设计
- 定型：可视化/交互类 + before/after 价值可视化。三页：学习舱 / 认知地图（玻璃盒）/ 对比。
- 明确不做：不生成课程、不开 VPS、不玩 haggle 定价、无登录/DB/支付/外部 API/LLM（避免克隆 Paradigm 且守纯前端约束）。

## Loop 3 — Demo 开发
- Vite + React + TS；`vite.config.ts` `base:'./'`。
- 核心是 `src/logic/engine.ts` 确定性掌握度引擎：IRT-lite 掌握度更新 + 置信度增长 + 前置就绪门控 + 近期降权的选题打分 + 三种校正（手滑回调/兴趣调整/手动设定）+ 对比模拟。
- **上线前对引擎做了独立数值验证**（node type-strip/esbuild 复算）：先用一次性脚本调参，确认「黑盒被手滑卡住反复复习已会内容 / 玻璃盒校正后转投薄弱点」的对比成立，再据此定稿引擎常量（SLOPE=5、CONF_GAIN=0.28、就绪门控指数 2.0、近期降权、对比用"课程中段"warm 起点 + 强制 WHERE 手滑）。复算结果：saved=4（black=5, glass=1）。

## Loop 4 — 自动验证（build）
- `bash scripts/validate_demo.sh daily/2026-07-18/demo`。
- 第 1 轮：**失败**——`KnowledgeMapView.tsx` 有未使用 import `skillName`，触发 `noUnusedLocals`。修复：删除该 import。
- 第 2 轮：**成功**——`tsc -b && vite build` 通过；`dist/index.html` 非空含 `#root`，1 个 JS bundle，相对路径资源；smoke OK。
- 之后一次纯视觉微调（WINDOW→WIN 短名、viewBox 高度）后重跑 build 仍成功。
- 计入 build 尝试：**2 次（1 失败 + 1 成功）**。

## Loop 5 — 体验自评
- 浏览器实测（:4173）三页交互闭合、无空白/无错误遮罩、无文字溢出；截图存 `screenshots/`（01 学习舱、02 作答、03 手滑校正、04 认知地图、05 对比）。
- 对比页页面数字（5 vs 1，省下 4）与引擎独立复算一致。
- 结论 **PASS**。

## 遇到的问题
- 引擎调参：初版对比对照不明显（黑盒会"自愈"或双方都被前置门控卡死）。通过引入「课程中段 warm 起点 + 强制手滑 + 近期降权轮换」使对照既真实又清晰，且指标（无效操练题数）由引擎算出而非写死。
- 一处 TS 严格模式未使用 import 导致首轮 build 失败，已修。

## 最终结论
- **PASS**：达门槛（23/25）+ build 成功 + 必需产物齐全（opportunity / demo-spec / evaluation / run-log / demo）+ 交互闭合 + before/after 由真实引擎计算并复算校验。
- 诚实边界：mock 引擎/题库能讲清「透明+可校正」的机制与价值逻辑，但不证明真实自适应估计质量；对比为代表性场景而非平均收益（已在 evaluation §7 标注）。
