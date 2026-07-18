# Product Hunt AI 雷达 · 2026-07-18

## 今日一句话结论

今天技术向的两个信号都很硬：一是 Moonshot 发布 **Kimi K3**——号称「全球首个开放 3T 级模型」（2.8T 稀疏 MoE、1M 上下文、原生视觉），把开源前沿模型的规模上限又抬高一截；二是 **OpenAI 首款硬件 Codex Micro** 把「监督 coding agent」做成了桌面物理控制面板，再叠加一批「跨工具共享记忆/上下文层（MCP）」新品，说明 Agent 正在同时补齐「大脑」「身份」和「人类监督界面」。2C 端今日仅 **Paradigm**（自适应学习）一款达标，其余多为单点内容生成或非 AI 工具。

## 板块 A：技术向 / B2B / 基础设施 AI

### 今天最值得关注的 A 类产品

**1. Kimi K3 — 全球首个开放 3T 级前沿模型（评分 17/18）**

- 定位：Moonshot（月之暗面）最新旗舰大模型，主打长链路 coding、知识工作与推理。
- 真实问题：开源模型长期在规模与前沿能力上落后闭源；开发者想要「可自托管、无用量墙」的顶配模型。
- 核心机制：2.8T 参数稀疏 MoE，单 token 仅激活约 50B（896 选 16 专家）；自研 Kimi Delta Attention（混合线性注意力）+ Attention Residuals；原生视觉、1M 上下文、默认「最大思考」模式。官方 API 以 `kimi-k3` 调用（cache-hit 输入 $0.30 / miss $3.00 / 输出 $15 每 MTok，Mooncake 分离式推理，coding 场景缓存命中 >90%）。
- 为何关注：官方基准自称仅次于 Fable 5、GPT-5.6 Sol；权重预告 7/27 以「改良 MIT」许可开放——若兑现，是开源侧一次结构性跃迁。
- 失败风险：7/27 前权重未开放，外部无法复核参数量/基准；真实推理成本、部署门槛与生态适配是最大变数。
- 对混元 API/Agent 启发：稀疏 MoE + 混合线性注意力做「大而省」、1M 上下文配合缓存差异化定价、以及「先 API/产品、后开源权重」的两段式发布节奏，都值得对标。
- 链接：kimi.com/blog/kimi-k3

**2. Codex Micro — OpenAI 首款硬件，给 coding agent 的物理控制面板（评分 15/18）**

- 定位：OpenAI × Work Louder 出的 $230 限量宏键盘，专为监督/操控 Codex agent 设计。
- 真实问题：一个人同时挂多个 coding agent 时，「看状态、批/驳、调推理档、切任务」全靠在软件里点来点去，注意力被割裂。
- 核心机制：13 键 + 旋钮 + 平面摇杆；6 颗 Agent Key 用 RGB 实时显示每个 agent 状态（空闲/未读/思考中/待审批/报错）；旋钮调「reasoning effort」，摇杆映射常用工作流（Review PR、Debug、重构），命令键做接受/拒绝/推送对讲/新建会话；蓝牙或 USB-C，Mac/Win。
- 为何关注：这是把「Copilot→Operator」的人机协作范式落成实体交互面板的早期样本，呼应「AI 从屏幕走向硬件」；当一个人要长时间同时盯多个 agent，「状态感知 + 快速批复」的专用交互位会越来越刚需。
- 失败风险：限量、极小众；且有评测指出「一键批准」按钮容易误授权 agent。
- 对混元 API/Agent 启发：agent 监督/审批的「状态可视化 + 一键接管」是可迁移的产品原语——不必是硬件，面板化的 human-in-the-loop 值得在 Agent 平台内做。
- 链接：openai.com（Codex Micro）

### A 类趋势信号

1. **开源前沿模型的规模竞赛回到开源一侧**：Kimi K3 以 2.8T 开放权重把开源模型规模上限再抬高，属大平台/关键生态级结构变化（虽仅一款，但信号重大）。
2. **「共享记忆 / 上下文层」正独立成 MCP 中间件**：In Parallel（团队级会议决策→自更新计划）、Unabyss（个人跨 App 上下文金库）、Kit For AI（agent 的文档记忆/RAG）同日出现，共同指向「记忆不该锁在单一厂商，而应作为可移植、权限可控的 MCP 层」。三者都强调「按 App/文件授权 + 可导出、不锁定」，说明厂商内置记忆的封闭性正被市场当成痛点来攻。
3. **Agent 在「身份」和「人类监督」两端同时补全**：Nitrosend 给 agent 发可自助注册/收发的邮箱、Verse 给每个 AI 员工配邮箱+电话+虚拟卡+钱包（身份端）；Codex Micro 则补人类监督端。

### 其他达到门槛的 A 类产品

| 产品 | 一句话 | 评分 | 链接 |
|---|---|---|---|
| In Parallel | 会议中自动捕获决策/承诺→自更新计划，经权限隔离的 MCP 端点把「公司真实上下文」喂给任意 AI 工具，回写需人工审批、每条答案可溯源 | 14 | in-parallel.com |
| Nitrosend | MCP-first 的「给 AI agent 用的邮箱平台」：25 个 nitro_* 工具、人工审批闸、自带 ESP/LLM 密钥、headless 注册即发信 | 13 | nitrosend.com |
| Unabyss | 个人「通用上下文层」：把 Gmail/Slack/Notion/GitHub 等 20+ 源结构化成一份画像，经 MCP 供 Claude/ChatGPT/Cursor 共享，按 App/文件授权、可导出 | 13 | unabyss.com |
| Verse | 一句话「雇」自主 AI 员工，配独立电脑/邮箱/电话/虚拟卡/钱包、Agent Spaces 协作，敏感动作前会向你确认（延续 YAGNI/Pazi 的「自主公司」范式） | 13 | useverse.ai |

（另有 Kit For AI（kitforai.com，agent 记忆/RAG 层，MCP 原生、宣称省 token 90%）计 12 分，归入上文「记忆层」趋势。）

## 板块 B：2C 消费向 AI

### 今天最值得关注的 B 类产品

**1. Paradigm — 「一个人的学校」：真自适应 AI 学习（评分 15/18）**

- 定位：面向个人学习者的 AI 原生自适应学习平台（paradigm.study），Beta 主打 SAT/ACT，引擎与学科无关。
- 目标用户 / 痛点：想高效学一门技能或备考、却被「僵化课表 + 套壳聊天机器人」劝退的自学者；核心痛点是「学习路径不随我的强弱实时变化」。
- 机制 / 交互：AI 导师 Clover 按你的已知/好奇/学习方式实时生成并重写课程、追踪薄弱点；主动提醒 deadline、考前按弱项生成 cheat sheet；对编程课直接开一台真实云 VPS（内置 Claude Code）手把手带做；笔记/练习/辅导统一工作区。
- 分发 / 留存假设：100% 免费层长期存在，靠「自适应真的有效」形成口碑；付费用「和 AI 讨价还价」的定价玩法制造话题传播；留存来自真实练习闭环而非内容生成。
- 失败风险：自适应效果需长期验证，「haggle 定价」是记忆点也可能沦为噱头；教育留存与获客一贯难。
- 链接：paradigm.study

### B 类趋势信号

今日未形成明确 2C 趋势信号：达标的仅 Paradigm 一款，自适应学习尚不足以构成方向级信号。

### 其他达到门槛的 B 类产品

今日无其他达到门槛的 2C 新品（不凑数）。

## 我最想跟进的方向

- 技术向：**独立、可移植的「记忆/上下文层」**（In Parallel / Unabyss / Kit For AI）——它把「上下文工程」从提示词技巧变成可被任意 agent 复用的 MCP 产品机制，对混元 Agent 平台的 memory/context 设计最有迁移价值。
- 2C：**真自适应 + 真工具沙箱的学习闭环**（Paradigm）——验证「AI 教育能否靠效果而非内容量留住人」。

## 已过滤产品摘要

- **AI 但单点 / 套壳 / 机制未验证**：ClipMatch（相册→社媒内容，单点生成无留存）、Basedash Suggestions（既有 AI 数据分析产品的「主动出点子」迭代）、Manta AI（自主 Web 测试 agent，单点）、Cito（面向 agent 的学术检索）、Graft AI / Weave / Amami / DevSwat / Zro / dot. / River / Pebbles Ai / SonOf / Alert Grouping by DrDroid（多为 B2B 单点或机制未充分核实）、Aye / Breadcromb（浏览器 agent，机制深度未核实）、ChikitAI（B2B 医疗分诊 agent，机制未核实）、Node Health（化验单归档，AI 非核心）。
- **非 AI 或 AI 非核心**：Scribble Party（白板）、PixyCAD（CAD）、Timely（日程）、Pocket Screen（悬浮窗）、Ventorah（浏览器 CFD 仿真）、BrickSolvr（3D→积木）、SIMPLI（分账）、Inbix（邮件基础设施）、FlightGlitch（错价机票）、Microflow（单片机）、Copresent（幻灯片遥控）、Cloud Halo（Azure FinOps）、Nuvio（X 简介数据）、Yapper Leaderboard、The Eureka Database。
- **已在近日报告覆盖（不重复展开）**：YAGNI、Tiptap AI Toolkit、Crustdata Recruiter、Campus、Velo 3.0、nudge2.0、CodeNearby 2.0、Flodesk Studio、Basedash SCIM、Albato AI（2025 旧品）。

## 数据源与限制

- 主数据源：Product Hunt RSS（`https://www.producthunt.com/feed`），抓取时间 2026-07-17 23:02 UTC，共 50 条候选；RSS 正常，未启用浏览器榜单备用。
- 交叉核实：各产品官网 / 官方博客 / API 文档，及 huntscreens.com 等聚合页；Kimi K3 另参考 kimi.com 官方博客与 API 平台文档。
- 限制：RSS 不含票数 / 排名 / 评论 / 官方外链，本报告未引用未经核实的融资、用户量、票数、排名或团队背景；Kimi K3 权重与技术报告预告 7/27 发布，当前参数量 / 基准无法外部复核，均按官方口径标注。部分 RSS 条目发布日期较早（如 Paradigm 标注 2026-06-17）为窗口内重现，此前报告未覆盖，按新品评估。
