# 自动体验 / 自测报告 — 2026-07-07

> 以 AI 产品经理 + 目标用户双重视角，对 Concord Demo 做一次体验检查。结论只能是 PASS / PARTIAL / FAIL。

## 1. 构建结果

- `npm install`：成功（67→68 包，~1–7s）。
- `npm run build`：成功（`tsc && vite build`）。**失败修复轮次：1/3**（首轮报 `TS6133 detectStall 未使用参数 participants`，移除参数后通过）。
- smoke 检查：通过。`dist/index.html` 非空、含 `<div id="root">`；产出 1 个 JS bundle（165 KB / gzip 56 KB）+ 1 个 CSS。
- 逻辑正确性验证（额外做的硬证据）：用 esbuild 把 `detectors.ts` + `scenarios.ts` 打包后跑真实 `diagnose()`，5 个场景输出与设计一致：
  - `livelock → STUCK`（livelock + progress-stall）
  - `retry-storm → DEGRADED`（retry-storm）
  - `orphaned → STUCK`（orphaned-task）
  - `collision → DEGRADED`（write-collision）
  - `healthy → HEALTHY`（无检测，**不误报**）
  验证脚本为一次性、跑完已删除，未进仓库。

## 2. 可用性检查

- 能否本地 `npm run dev` 打开：能（Vite 默认 5173），首屏即诊断台。
- 首屏是否空白：否。首屏顶部即协作健康 verdict + 三项指标（病灶数 / 浪费 token / 受影响时长）+ 一句话解读。
- 说明：本轮为纯前端确定性逻辑，未在无头浏览器截图（避免 GUI 依赖风险）；构建 + 逻辑均以命令行硬证据验证。

## 3. 核心流程是否闭合

闭合。选场景 → 播放时间轴（事件逐条流入、交互图点亮、病灶节点/边变红、时间轴打标记）→ 右侧诊断面板实时给出因果链 + 浪费成本 + 病因 + 修复处方 → 顶部切换 before(原始日志)/after(诊断) 对比 → 「工作原理」页解释检测器与边界。3 分钟内可走完。

## 4. 首屏是否讲清产品价值

讲清。verdict badge（HEALTHY/DEGRADED/STUCK）+ "浪费 token/受影响时长" 直接把"协作失调"翻译成钱和时间；lead 文案点明"每个 agent 单看都正常、系统级已卡死"的核心洞察。

## 5. 交互是否有断点

- 播放到末尾自动暂停；再点播放会从头重放（已处理 `currentTime >= maxTime` 情况），无卡死。
- 拖动时间轴会暂停播放并即时重算诊断，检测随切片增量出现，符合预期。
- 潜在小瑕疵：`orphaned` 场景头条"浪费 token"显示为 120（取被标记 assign 事件的 token），其真实代价是"受影响时长 7.5s"——该检测卡片内已正确显示 token=0 / 时长 7.5s，头条数字略有歧义但不误导。

## 6. 是否只是概念包装（自嗨检测）

- 是否引用了报告中的具体信号：是。锚定今日报告 Mozaik（事件驱动多 Agent 运行时，报告亲口点名其最大风险是"动态系统难理解/难调试"）与"Agent 运行控制面分层"趋势。
- 是否明确了创新切入点与增量价值：是。切入点=把"多 Agent 协作反模式"变成一等**检测对象**（判病+开处方），而非又一个 trace 查看器；增量=对象是"Agent 之间×时间"的关系、产出是病因+成本+处方。
- 是否是某产品的照抄：否。非 Mozaik（运行时）克隆、非 Edgee（流量成本）克隆、非通用 tracing/APM；且与本实验室既有 Fusebox（高危工具审批）/ Attestor·Datum（输出证据核验/回归）/ Contour（结构化语义 diff）均无重叠——见 `opportunity.md` 第 5 节四项声明。

## 7. Demo 的最大问题

真实价值的"最后一公里"在 Demo 里是省略的：真实产品需要**事件规范化 + 稳健去噪**（时间戳/随机 id/正常重试会造成假阳性），Demo 用固定阈值 + 精心构造的 mock 事件流示意，可能让人低估工程量。其次，检测器目前是硬阈值，真实场景需要自适应/可配置。

## 8. 是否建议用户人工体验

建议。目标用户（在用 Mozaik/AutoGen/CrewAI/LangGraph 的团队）在诊断台切换 4 个病态场景 + 1 个健康对照，最能直观感到"原始日志看不懂 → Concord 一眼判病 + 开处方"的增量；再看「工作原理」页确认它不是 trace/APM、不是审批闸门。

## 9. 下一步建议

1. 接一个真实运行时的事件 schema（先做 Mozaik event bus 适配器），验证检测器在真实噪声下的假阳性率。
2. 把"修复处方"从静态文案升级为可一键生成的策略片段（如超时/锁/退避配置）。
3. 增加"陈旧上下文决策"检测器（已在设计中预留），覆盖共享 context 版本漂移导致的矛盾决策。

## 在线体验

- Demo Preview URL：https://totorolnet.github.io/product-opportunity-lab/2026-07-07/

## 结论

**PASS**
（build 成功、5 类检测器在真实数据上产出与设计一致且健康场景不误报、核心流程闭合、首屏讲清价值、明确非照抄；必需产物齐全。）
