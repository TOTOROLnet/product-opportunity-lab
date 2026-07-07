# 自动体验 / 自测报告 — 2026-07-07

> 以 AI 产品经理 + 目标用户双重视角，对本次 Demo（Reverso）做一次体验检查。结论只能是 PASS / PARTIAL / FAIL。

## 1. 构建结果

- `npm install`：成功（67 packages，约 6s）。
- `npm run build`：成功（`tsc && vite build`，首轮即过，**修复轮次：0/3**）。
- smoke 检查（`scripts/validate_demo.sh`）：通过——`dist/index.html` 非空、含 `id="root"` 挂载节点、含 1 个 JS bundle（index-*.js ≈ 164KB / gzip 54.7KB）、README 存在。
- 逻辑正确性（一次性 esbuild 校验，已删）：5 个场景 verdict 全 PASS，且「保护网」翻转符合预期（db-cleanup / cost-cleanup 由 STOP→CHECKPOINT；refund-flow 因"已发邮件救不回"仍为 STOP）——证明判定是**规则算出、非硬编码**。

## 2. 可用性检查

- 能否本地 `npm run dev` 打开：能（Vite 5，默认 5173）。
- 首屏是否空白：否。首屏即 run verdict 头部 + 场景选择 + 动作时间轴，价值一眼可见。

## 3. 核心流程是否闭合

闭合。主路径：选场景 → 看 run verdict（SAFE/CHECKPOINT/STOP）与可逆/可补偿/不可逆计数 → 时间轴看每个动作可逆性徽章 + 不可逆临界线 → 点动作看回滚手册/爆炸半径/撤销代价 → 切 Before/After 看增量 → 开「保护网」看 verdict 实时翻转 → How it works 看分类法与定位区隔。3 分钟内可走完。

## 4. 首屏是否讲清产品价值

讲清。顶栏副标题「Agent 动作可逆性与回滚规划器 · the backward path」+ 首屏 verdict 头部的一句话结论，直接点出"哪些动作收不回、真出事怎么退、退到哪算到头"。How 页用 forward/backward 两栏把"整条栈只做向前、backward 是空位"讲透。

## 5. 交互是否有断点

无明显断点。场景切换会清空选中项并重算；时间轴↔详情联动正常；保护网开关实时重算 verdict 与徽章；Before/After 与 Analyzer 共享同一份计算结果，切 Tab 一致。小屏（<860px）下网格自动单列。

## 6. 是否只是概念包装（自嗨检测）

- 是否引用了报告中的具体信号：是。直接锚定 Mozaik（失败后重试=向前）、Edgee（路由/fallback=向前）、LongCat-2.0（更便宜更长的 run → 放大不可逆风险）、CodeMote（远程批准=向前）、Nixmac（唯一有回滚但锁死 Nix 窄域）。
- 是否明确了创新切入点与增量价值：是。切入点=把"动作可逆性 + 回滚手册 + 不可逆临界点"变成一等产品对象（跨动作类型、跨运行时的中立层）；增量=整条栈只优化 forward path，它补 backward path。
- 是否是某产品的照抄：否。非 Mozaik/Edgee/Nixmac/CodeMote 克隆（见 opportunity.md 第 5 节），也与本实验室 Fusebox（审批）、Attestor/Datum（证据）、Contour（源码 diff）、Concord（协作诊断）正交。判定逻辑是真实确定性规则（`src/logic/analyze.ts`），非硬编码 verdict。

## 7. Demo 的最大问题

真实世界里"回滚手册可执行、快照/备份真能救回来"才是价值核心，而 Demo 只做规划与可视化、不真正执行回滚；且不同运行时的动作 schema 各异、可逆性规则需大量领域知识沉淀——Demo 用确定性规则演示可行性，真实工程量明显更重。此外可逆性分级本身带主观边界（如"扣款→退款"算可补偿还是准不可逆），产品化需可配置策略。

## 8. 是否建议用户人工体验

建议。三个动作值得亲自试：①切"③数据库清理""④客户退款自动化""⑤清理云资源"看 STOP 与不可逆临界线；②点单个动作看回滚手册与爆炸半径；③开「保护网」看 STOP→CHECKPOINT 的实时翻转（以及 refund-flow 中"已发邮件"仍救不回）。

## 9. 下一步建议

- 让可逆性规则**可配置**（团队自定义某类动作的分级与补偿模板）。
- 从"规划"走向"接管"：真正对接快照/备份/补偿执行，把回滚手册变成一键回滚。
- 接入真实运行时事件 schema（Mozaik / LangGraph）做动作规范化。
- 引入"不可逆动作预算 / 到临界点自动暂停并请求人工确认"的运行时策略。

## 在线体验

- Demo Preview URL：https://totorolnet.github.io/product-opportunity-lab/2026-07-07/

## 结论

**PASS**
（构建与 smoke 全过、核心流程闭合、首屏讲清价值、逻辑为确定性规则且经校验、明确非照抄且与既有产出正交；达门槛 23/25。）
