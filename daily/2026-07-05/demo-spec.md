# Demo 设计说明 — 2026-07-05

## 1. Demo 名称
**Contour** — 看清 Agent 改动的真实轮廓（结构化产物的语义 diff + 意图/不变量评审层）

## 2. 一句话定位
Agent 改了一份结构化产物（云基建 / DB schema / CAD feature tree），行级 diff 看起来只有几行、很安全；Contour 把它升级成"**语义 diff（改了哪些实体/关系/约束）+ 意图/不变量风险**"，把"行级看不见、语义上高危"的改动顶到最前，让 reviewer 在几十秒内决定"能不能 merge"。

## 3. 目标用户
用 Cursor / Copilot / Devin / Claude Code 等让 Agent 改**结构化配置 / schema / 基建 / CAD** 的开发者、code reviewer、SRE / 平台 / DBA，以及对 Agent 交付负责的 AI PM / 团队 lead——共同动作是"在 merge / apply / accept 之前判断这次结构化改动安不安全"。

## 4. 使用场景
一个 Agent 提交了对结构化产物的改动，并附上一句自信的自述（"小幅修复，改动很小"）。reviewer 打开 Contour：先看到那份"骗人的"行级 diff（+3/-1），一键切到语义 diff，立刻看到"约束被删 / 网络被放宽 / 下游依赖被打断"，按严重度排序的意图/不变量风险直接告诉他"先看这三处"，并给出 before/after 评审判定。

## 5. Demo 策略分型（重要）

- 本机会属于：☑ 抽象 / CLI / API / 基础设施类产品（结构化产物的评审层，非可视化终端产品本身）
- 采用的演示方式：纯前端"**模拟体验 + 价值可视化**"，组合三种形式：
  - **before / after 对比**：同一份改动，行级 diff（语义盲）vs 语义 diff（实体/关系/约束级）一键切换 —— 直观展示增量价值。
  - **资源/结构视图**：把结构化产物解析成语义模型（实体 + 关系 + 约束），把改动标注在语义树上。
  - **可搜索/可筛选面板**：意图/不变量 findings 按严重度（Critical / Warn / Info）筛选与定位。
- 演示的是**我们分析出的创新切入点**（跨产物类型的语义评审 + 破坏设计意图狙击），不是被参考产品（Adam 的 CAD authoring copilot / Termi 的过程可视化）的克隆。

## 6. 核心流程
（用户从进入到"看懂价值"的主路径，3 分钟内可完成）
1. 进入 **改动收件箱**：看到 3 个跨领域的 Agent 改动（云基建 / DB schema / CAD feature tree），每条带 Agent 自述一句话 + 一个"语义风险"红/黄/绿概览 chip。
2. 打开一个改动 → 首屏先显示 **行级 diff（+3/-1，看起来很小）** 与 Agent 自述"改动很小 ✅" —— 制造"看起来安全"的第一印象。
3. 点击 **切到语义视图**：产物被解析成语义实体树，改动以"新增/删除/修改的实体·关系·约束"呈现（不是行）；右侧 **意图/不变量 findings** 按严重度排序，每条注明"**为何行级 diff 看不见**"+"**判定依据**"。
4. 顶部 **before/after 评审判定 banner** 从"Agent 说：改动很小 ✅"翻转为"Contour：2 处 Critical 意图风险 / 1 处约束被破坏 → 需人工复核，先看这里"；给出 **意图保真分**（Agent 自称 vs Contour 判定）。
5. 用严重度筛选，点任一 finding 高亮定位到语义树对应实体 —— 完成"看清真实轮廓"的闭环。

## 7. 页面结构（<= 3 个主要页面）
- 页面 1：**改动收件箱（Inbox）** —— 3 个跨领域场景卡片 + 自述 + 语义风险概览。
- 页面 2：**评审视图（Review，核心页）** —— 顶部 before/after 判定 banner + 意图保真分；左列"行级 diff ↔ 语义 diff"切换；中列语义实体树（标注增删改）；右列意图/不变量 findings（可按严重度筛选、点击定位）。
- 页面 3（轻量，作为 Review 内的可展开面板/说明区，不单独占页）：**"为什么行级 diff 不够？"** —— 一段 before/after 对照说明 + 不变量规则清单，强化价值主张。

## 8. 关键交互
- 场景切换（收件箱卡片 ↔ 评审视图）。
- **行级 diff ↔ 语义 diff 一键切换**（核心"顿悟"交互）。
- findings 按严重度（Critical/Warn/Info）筛选。
- 点击 finding → 高亮语义树上对应实体/关系，并展开"为何行级看不见 + 判定依据"。
- 顶部意图保真分随所选场景动态显示（Agent 自称 100% vs Contour 判定分）。

## 9. 使用的 mock 数据
（全部为 mock，不接真实后端 / 外部 API / 凭证 / 模型）
- `src/data/scenarios.ts`：3 个场景，每个含：
  - `agentSummary`：Agent 的一句话自述（乐观）与其自称行级改动量（如 +3/-1）。
  - `lineDiff`：手写的行级 diff 片段（展示"看起来很小"）。
  - `semanticBefore/after` 或 `semanticNodes`：解析后的语义实体树（实体/关系/属性/约束）及每个节点的变更标记（added/removed/modified/unchanged）。
  - `findings`：意图/不变量核验结果，每条含 `severity`、`title`、`detail`、`invisibleInLineDiff`(bool)、`rationale`（判定依据）、`nodeId`（定位目标）。
- `src/logic/scoring.ts`：确定性地由 findings 计算"意图保真分"（Critical 重扣、Warn 轻扣），以及整体评审判定（SAFE / REVIEW / BLOCK 建议）。
- 三个场景内容：
  1. **云基建（Terraform 风格）**：Agent"修复健康检查超时"，行级 +4/-2；语义上却把安全组 ingress `22/tcp` 源从 `10.0.0.0/8` 放宽到 `0.0.0.0/0`、删除容器 `memory_limit`。
  2. **数据库 schema/migration**：Agent"加一个 `status` 列"，行级 +5/-1；语义上却删掉了 `orders.customer_id` 的 `NOT NULL` 与外键、把 `amount` 默认从 `0` 改为 `NULL`。
  3. **CAD feature tree / BOM**（呼应 Adam）：Agent"简化模型、清理 feature tree"，行级像"删掉几个节点"；语义上删除了被 `Shell-1` 依赖的 `Fillet-3`（打断引用）、把壁厚参数改到低于材料工艺下限（破坏设计意图）。

## 10. 明确不做什么
- 不做登录 / 用户系统。
- 不接数据库 / 支付 / 外部私钥 / 真实 API / 真实 LLM。
- 不做真实的多语言解析器（用预置的确定性语义模型 mock）。
- 不做生产级后端、不做真正的 CI gate。
- 不做 Agent 本身、不替用户产生任何改动（只做"评审镜片"）。

## 11. 成功体验标准
- 用户 3 分钟内能说出"它解决什么问题（Agent 改结构化产物、行级 diff 语义盲、危险改动被伪装）、怎么用（切到语义 diff 看意图/不变量风险）、增量在哪（跨领域语义评审 + 破坏意图狙击 + before/after 判定，vs 行级 diff / Adam 的 CAD authoring / Termi 的过程可视化 / Attestor 的自述核验）"。
- "行级 diff → 语义 diff"切换那一刻能产生"原来这么危险"的顿悟。
- 至少一个 Critical finding 明确标注"行级 diff 里看不见"，直击核心价值主张。
