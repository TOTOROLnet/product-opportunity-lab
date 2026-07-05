# 自动体验 / 自测报告 — 2026-07-05

> 以 AI 产品经理 + 目标用户（要为 Agent 改的结构化产物签字的 reviewer / SRE / DBA）双重视角，对本次 Contour Demo 做体验检查。结论只能是 PASS / PARTIAL / FAIL。

## 1. 构建结果
- `npm install`：成功（67 packages，无阻断错误）。
- `npm run build`：成功（`tsc && vite build` 均通过，**第 1 轮一次成功**，无需修复）。产物 `dist/index.html` 0.92kB、JS bundle 164kB。
- smoke 检查（dist 首屏非空、含 `id="root"` 挂载节点、README 存在、有 JS bundle）：**通过**（`scripts/validate_demo.sh` 输出 OK）。

## 2. 可用性检查
- 本地 `npm run preview`（端口 4173）：HTTP 200，页面正常加载。
- 首屏是否空白：否。首屏即呈现左侧 5 个改动收件箱卡片 + 右侧 before/after 判定 banner + 行级 diff。
- 经 computerUse 子代理实机走查（Chrome）：5 个场景切换、行级/语义 diff 切换、finding 点击定位语义树、严重度筛选、"为什么行级 diff 不够"说明页均正常；控制台除一个已修复的 favicon 404 外无报错（本轮已补内联 SVG favicon 并重新 build 通过）。

## 3. 核心流程是否闭合
闭合。主路径可 3 分钟内跑通：收件箱选改动 → 顶部判定 banner（Agent 自称 100% vs Contour 意图保真分 + BLOCK/REVIEW/SAFE）→ 看"骗人的"行级 diff → 一键切到语义 diff（实体/关系/约束级）→ 意图/不变量 findings 按严重度排序、Critical 顶到最前、标注"行级 diff 里看不见" → 点 finding 高亮定位语义树。绿色通道（SAFE 场景）也走得通，证明不是一味报警。

## 4. 首屏是否讲清产品价值
是。首屏 banner 直接把"Agent 说改动很小 ✅（100%）"与"Contour 意图保真分 58% / BLOCK"并排对比，配合下方看起来只有 +2/−3 行的行级 diff，制造出"看着安全、实则高危"的张力，一眼说清 Contour 要解决的问题。

## 5. 交互是否有断点
无致命断点。行级↔语义切换、场景切换、finding→节点定位、严重度筛选、说明页往返均可用且有高亮反馈。轻微项：finding 点击会自动切到语义视图（预期行为），已在文案上提示。

## 6. 是否只是概念包装（自嗨检测）
- 是否引用了报告中的具体信号：**是**。直接锚定当日最高分产品 **Adam CAD Copilot**（17/18）的"可审查 diff / 保持产物可编辑 / **破坏设计意图**"信号，并把它抽象成跨产物类型（IaC / schema / CI / CAD）的通用问题；CAD 场景（Fillet-3 悬空引用 + 壁厚跌破工艺下限）即对 Adam 信号的正面回应；也对照了 Termi（过程可视化）、报告作者"执行证据与审批层"方向。
- 是否明确了创新切入点与增量价值：**是**。切入点=把 Agent 对结构化产物的改动从行级 diff 升级为"语义 diff + 意图/不变量核验"，狙击"行级看不见、语义上高危"的改动；增量相对行级 diff / Adam（CAD authoring）/ Termi（过程可视化）/ Attestor（自述文字核验）均在 opportunity.md 逐条列明。
- 是否是某产品的照抄：**否**。不产生改动、不绑定单一领域、不可视化执行过程、不核验自述文字；核心（跨产物类型语义 diff + 意图核验 + 破坏意图狙击 + before/after 判定）在报告任一产品中都不存在。

## 7. Demo 的最大问题
真实产品的价值高度依赖"每种产物类型的解析器 + 不变量库"的覆盖面与准确率，这在本 Demo 里是用确定性预置的语义树/findings 来 mock 的——即演示的是"评审体验"，尚未证明"自动解析任意真实产物"的工程可行性。这是从 Demo 到产品最大的落地缺口（已在 opportunity.md 风险节与 README 中如实标注）。

## 8. 是否建议用户人工体验
建议。核心"顿悟"（行级 diff → 语义 diff 的切换、Critical 的"行级看不见"标记）需要亲手点一次才最有冲击力；SAFE 场景也值得一看以确认它不是纯报警器。

## 9. 下一步建议
- 接一个真实解析器切片（如 Terraform plan JSON 或 SQL AST）验证"自动生成语义 diff + 不变量核验"的工程可行性。
- 让不变量库可配置/可插拔，并与 policy-as-code（OPA/Conftest）互通，把它们的判定纳进 findings。
- 增加"把某条 finding 标记为已知/可接受"的评审动作，向真正的评审工作流靠拢。

## 在线体验
- Demo Preview URL：https://totorolnet.github.io/product-opportunity-lab/2026-07-05/

## 结论
**PASS** —— 达门槛（24/25）、build 一次成功、必需产物齐全、核心流程闭合且实机走查通过；明确引用报告信号（Adam）、给出创新切入点与增量价值，非照抄。
