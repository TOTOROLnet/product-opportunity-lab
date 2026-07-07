# Demo 设计说明 — 2026-07-07

## 1. Demo 名称

**Concord — 多 Agent 协作失调诊断器（Coordination-Failure Detective）**

## 2. 一句话定位

一层中立的诊断层：吃事件驱动多 Agent 运行时的运行事件流，自动判出"协作反模式"（活锁 / 重试风暴 / 无主任务 / 重复写入冲突 / 空转），给出因果链、浪费成本与修复处方。

## 3. 目标用户

正在用 Mozaik / AutoGen / CrewAI / LangGraph 等构建**并行、自组织多 Agent 协作**的工程团队；他们的 run"看起来在动、实际卡死/空转烧钱"，单个 agent 日志查不出问题。

## 4. 使用场景

一次多 Agent run 跑了很久还没出结果，token 花了一堆。把这次 run 的事件流喂给 Concord，30 秒内看出：是 planner 和 coder 在 ping-pong 活锁 / 是 reviewer 的任务无人接（黑洞）/ 是两个 coder 抢改同一文件，以及这烧掉了多少 token，怎么修。

## 5. Demo 策略分型（重要）

- 本机会属于：☑ 抽象 / CLI / API / 基础设施类产品（运行时诊断层，无 GUI 原生形态）
- 采用的演示方式：纯前端**"模拟体验 + 价值可视化"**，组合三种形式：
  - **网页版模拟运行回放**：脚本化重放一次多 Agent run 的事件流（时间轴可播放/暂停/拖动）。
  - **资源/结构视图**：把抽象的"多 Agent 协作"可视化为**交互图**（participant 节点 + handoff/message 边），随时间点亮，病灶红线高亮。
  - **before / after 对比**：同一段事件，切换"原始事件洪流（看不懂）"vs"Concord 诊断（一眼病因 + 处方）"。
- 演示的是**我们分析出的创新切入点**（协作反模式诊断层），不是 Mozaik（运行时）的克隆。
- **关键**：检测逻辑是对事件流的**真实确定性分析**（在 `src/logic/detectors.ts` 中实现，不是硬编码 verdict），随时间轴回放增量触发，保证"不是空壳"。

## 6. 核心流程

（用户从进入到"看懂价值"的主路径，3 分钟内可完成）

1. 进入 Console，首屏顶部是**协作健康 verdict**（HEALTHY / DEGRADED / STUCK）+ 检测到的病灶数 / 浪费 token / 浪费墙钟时间。
2. 左侧选择场景（活锁 ping-pong / 重试风暴 / 无主任务黑洞 / 重复写入冲突 / 健康 run）。
3. 点"播放"，中间的**交互图**随事件流点亮，**时间轴**上事件逐条流入；当某检测器触发，时间轴出现病灶标记、图上相关节点/边变红。
4. 右侧**诊断面板**列出检测到的反模式：每条含 因果事件链、涉及的 agent、浪费的 token/时间、一句话病因、**修复处方**。
5. 顶部切换 **"Concord 视图 / 原始事件日志"**，直观感受 before/after：原始日志是一长串看不懂的事件，Concord 视图是一眼病因 + 处方。

## 7. 页面结构（<= 3 个主要页面）

- 页面 1（Console，主）：verdict 头 + 场景选择 + 交互图 + 时间轴回放 + 诊断面板 + before/after 切换。
- 页面 2（How it works）：讲清"为什么涌现式 ≠ 编排式故障"、6 类检测器原理、输入模型（任意事件流）、定位（中立诊断层，不做运行时/不做闸门）、不照抄声明。
- （无第 3 页；before/after 的"原始日志"作为 Console 内的切换视图，不单列页面。）

## 8. 关键交互

- 时间轴 **播放 / 暂停 / 拖动**：`currentTime` 状态驱动，只对 `t <= currentTime` 的事件切片跑检测器，检测结果随时间**增量出现**。
- 交互图：SVG 圆形布局，participant 为节点（按角色着色、按最近活动脉冲），handoff/message 为边；触发病灶的节点/边高亮红色。
- 诊断卡点击：高亮其因果链在时间轴上对应的事件。
- Console 顶部 toggle：Concord 诊断视图 ⇄ 原始事件日志（before/after）。

## 9. 使用的 mock 数据

- 全部为 mock，**不接真实运行时 / 后端 / 外部 API**。
- `src/data/scenarios.ts`：每个场景含
  - `participants`：{ id, name, role(planner/coder/reviewer/observer/tool), avatarHue }
  - `events`：有序数组 { id, t(ms), type(message|function_call|error|state|handoff|assign), from, to?, resource?, tokens, summary }
  - `expected`：人读说明（供 How it works 解释；verdict 与检测由代码实时算出，非取自此字段）
- 5 个场景：`livelock`（planner↔coder ping-pong 空转）、`retry-storm`（coder 对同一工具反复失败重试升级）、`orphaned`（reviewer 任务被派后无主超时）、`collision`（两个 coder 抢写同一文件）、`healthy`（正常完成，作为对照，verdict=HEALTHY）。

## 10. 明确不做什么

- 不做登录 / 用户系统
- 不接数据库 / 支付 / 外部私钥 / 真实 API / 真实运行时
- 不做生产级后端
- 不接真实 Mozaik / AutoGen，事件流全部为脚本化 mock
- 不做真实的事件规范化 / 去噪引擎（真实产品的重活，Demo 用固定阈值示意）

## 11. 成功体验标准

- 用户 3 分钟内能说出"它解决什么问题（多 Agent 协作失调不可见）、怎么用（喂事件流、看诊断）、增量在哪（不是 trace 查看器，而是判病 + 开处方 + 算浪费成本）"。
- 至少能在 3 个病态场景里看到不同的病灶被正确判出，并对照"健康 run"确认不误报。
- before/after 切换让人直观感到"原始日志看不懂 → Concord 一眼看懂"。
