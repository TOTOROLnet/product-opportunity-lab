# Product Hunt AI 雷达 · 2026-07-19

## 今日一句话结论

今天是典型的「窗口重叠日」——RSS 与昨日几乎同批，前沿模型（Kimi K3）、OpenAI 硬件（Codex Micro）、记忆/上下文层（In Parallel/Unabyss）等昨日已展开，不重复；真正的新信号集中在**技术向的「人机共同编辑本地文件」与「给 agent 喂结构化数据」两条链路**：**OpenMarkdown** 把「你和 agent 在同一份 .md 上实时协作编辑」做成了产品原语，**ZooData** 把「URL→干净结构化 JSON」做成了 MCP 上按字段计费的 agent 数据层。2C 端今日无新达标产品——Mainichi、WX 均 AI 非核心，Paradigm 昨日已覆盖。

## 板块 A：技术向 / B2B / 基础设施 AI

### 今天最值得关注的 A 类产品

**1. OpenMarkdown — 你和 agent 在同一份 .md 上实时协作编辑（评分 14/18）**

- 定位：本地优先、macOS 原生的极速 Markdown 编辑器（openmarkdown.dev，Rust 内核，冷启动亚秒级），本身**不内置 AI**，而是把编辑器变成人和 agent 的「共享白板」。
- 真实问题：今天人和 coding agent 协作，文档要么在 agent 的聊天框里（人看不见过程），要么靠复制粘贴在编辑器和对话之间搬运；「我在看哪一段、agent 改了哪一段」缺一个共享的可视界面。
- 核心机制：通过 CLI / 插件 / MCP 接入你已有的 agent（如 Claude Code）。三点机制值得记：①**按小节实时改**——agent 只重写某个标题下的内容，其余不动，改动以「远程编辑」方式落到你正打开的文件，光标/滚动位置不变、不闪烁，你可以在一段里继续打字而它在另一段编辑；②**@agent 任务行**——在被监视的文件里写一行 `- [ ] @agent …`，它会自动接单；③编辑器「感知你正在看哪一段」并把决策交回给你。所有笔记都是磁盘上的纯 .md，无账号、无云、无锁定。
- 为何关注：这是把「上下文工程」从聊天框搬到**共享文档**上的一个具体范式样本——不是「文档里加个 chatbot」，而是让人与 agent 在同一份文件上以最小摩擦分工，呼应 07-16 的 Tiptap AI Toolkit（agent 可靠读写富文本）与 Campus（人+agent 同一空间画布）。
- 失败风险：极早期（GitHub 仅个位数 star）、仅 macOS、纯 Markdown 场景窄；「共享白板」体验若不比现有 IDE diff 明显更好，容易被 Cursor/VS Code 生态直接吸收。
- 对混元 API/Agent 启发：「人机共编面」是可迁移的产品原语——按小节的可回溯远程编辑、`@agent` 任务行、「agent 感知用户当前焦点」，都可作为 Agent 产品里 human-in-the-loop 的交互底座，而不必依赖聊天框。
- 链接：openmarkdown.dev

**2. ZooData — 给 AI agent 的结构化数据层，按字段计费（评分 13/18）**

- 定位：面向 agent 的商业数据基础设施（zoodata.ai），把任意 URL 转成「决策就绪」的干净 JSON，主打电商/商品情报（Amazon、TikTok Shop）。
- 真实问题：agent 直接吞原始 HTML 既贵又脏——token 浪费在标签和噪声上，还要二次清洗；而传统爬虫/人用仪表盘不是为「agent 自动消费」设计的。
- 核心机制：输出干净 JSON，官方称把 LLM 解析成本降低约 75–80%；提供 API / CLI / MCP，OpenAPI 3.0 规范一键接入 LangChain / CrewAI / AutoGen / Claude MCP；覆盖价格/库存/BSR 等实时字段（15–30 分钟刷新）叠加 2 年以上历史用于时序分析；**按调用/按字段计费**（无席位费），面向 7×24 的 agent 工作负载；官方演示了选品 Agent + 定价 Agent + 上架 Agent 的数据互通。
- 为何关注：它把「给 agent 喂什么数据」标准化成 MCP 上一个可计费的中间件——和昨日的记忆/上下文层（In Parallel / Unabyss / Kit For AI）是同一大方向的不同切面：前者管「组织/个人上下文」，ZooData 管「外部世界的结构化事实」。「pay-per-field」这种为 agent 用量而非人头设计的定价也值得关注。
- 失败风险：垂直在电商情报，护城河取决于数据覆盖与新鲜度；一旦大模型厂商/浏览器 agent 自带「网页→结构化」能力，纯数据中间件易被压缩；合规与反爬风险长期存在。
- 对混元 API/Agent 启发：把 RAG/工具调用的「数据供给」产品化为标准 MCP 端点 + 按字段/按用量计费，是 Agent 平台数据生态可借鉴的形态；「agent-native JSON（省 token）」也提示 API 侧可提供更适配 agent 消费的结构化返回。
- 链接：zoodata.ai

### A 类趋势信号

1. **AI 从聊天框走向「共享文档/画布」**：OpenMarkdown（人机共编本地 .md）延续 07-16 的 Tiptap AI Toolkit（agent 可靠读写富文本文档）与 Campus（人+agent 同一空间工作台），共同指向「协作面从对话框迁移到可视、可回溯的共享编辑面」——至少 3 个产品体现同一方向，是明确趋势。
2. **agent 的「数据供给层」正独立成 MCP 中间件**：ZooData（外部结构化事实）与昨日仍在窗口内的记忆/上下文层（In Parallel / Unabyss / Kit For AI）从两端夹逼同一命题——「不要让 agent 自己吞原始网页/散落上下文，而是把干净、可授权、可计费的数据经 MCP 喂给它」。
3. **「有自己电脑的自主 AI 同事」持续成簇**：Clark（自带持久云电脑的 computer-use 同事）与昨日的 Verse、以及更早的 YAGNI/Pazi 同属「自主员工/公司」范式，说明这一方向仍在快速试错，但同质化明显、尚未跑出机制护城河。

### 其他达到门槛的 A 类产品

| 产品 | 一句话 | 评分 | 链接 |
|---|---|---|---|
| Clark | 「有自己云电脑的 AI 同事」：computer-use agent 常驻一台持久云电脑（浏览器/终端/文件/交付物），断线后仍继续跑，支持定时任务与异步 agent 收件箱，运行历史可检视、凭证按需隔离（clarkchat.com；注意与同名开源 web agent、以及本地 IDE「Clark Code」区分） | 13 | clarkchat.com |

## 板块 B：2C 消费向 AI

### 今天最值得关注的 B 类产品

今日无高价值 2C 类新品（不凑数）。今日新入榜的疑似消费向产品经核实 AI 均非核心：**Mainichi**（学日语）本质是间隔重复背单词 + 「按都道府县解锁」的地图游戏化，AI 不是核心能力；**WX**（可演奏的生成式合成器）靠「受控随机化」生成音色，属程序化生成而非 AI。昨日达标的 Paradigm（自适应学习）为上一份报告已展开，不重复。

### B 类趋势信号

今日未形成明确 2C 趋势信号（无新达标产品）。

### 其他达到门槛的 B 类产品

今日无其他达到门槛的 2C 新品。

## 我最想跟进的方向

- 技术向：**人机共编面（OpenMarkdown）**——把「上下文工程」从聊天框变成人和 agent 在同一份文件上的可视、可回溯协作，对混元 Agent 产品的 human-in-the-loop 交互底座最有迁移价值。
- 2C：本日无新标的，继续观察 AI 自适应学习（Paradigm 方向）能否靠「效果」而非「内容量」形成留存——但今日无新信号，不强行给结论。

## 已过滤产品摘要

- **AI 非核心 / 单点 / 非 AI（今日新入榜）**：Mainichi（间隔重复背单词 + 地图游戏化，AI 非核心）、WX（受控随机化生成式合成器，非 AI）、Mirage / LiveDemo（把 SaaS 转可点击演示，交互录制类，AI 非核心）、Acebuilder（落地页搭建，AI 非核心）、DocuSmart AI（2026-03 旧品，知识整理，机制未核实）。
- **已在近日报告覆盖（不重复展开）**：Kimi K3、Codex Micro、In Parallel、Nitrosend、Unabyss、Verse、Kit For AI、Paradigm（均 07-18）；Basedash Suggestions、Manta AI、Weave、dot.、Zro、River、Graft AI、Amami、ChikitAI、Breadcromb、Aye、Cito、SonOf、Pebbles Ai、Alert Grouping by DrDroid、DevSwat、Node Health、ClipMatch、The Eureka Database、Nuvio（均此前已过滤）；Albato AI（2025 旧品）。
- **非 AI 或 AI 非核心（碎片/工具类）**：Pocket Screen（悬浮窗）、Timely（日程）、PixyCAD（CAD）、Yapper Leaderboard、Scribble Party（白板）、SIMPLI（分账）、Cloud Halo（Azure FinOps）、Inbix（邮件基础设施）、Ventorah（浏览器 CFD 仿真）、BrickSolvr（3D→积木）、FlightGlitch（错价机票）、Microflow（单片机）。

## 数据源与限制

- 主数据源：Product Hunt RSS（`https://www.producthunt.com/feed`），抓取时间 2026-07-18 23:02 UTC，共 50 条候选；RSS 正常，未启用浏览器榜单备用。
- 交叉核实：各产品官网 / 官方 GitHub / API 文档，及 huntscreens.com、neurokitai.com 等聚合页；OpenMarkdown 参考官方 GitHub Releases，ZooData 参考 zoodata.ai 与其 OpenAPI 文档，Clark 参考 clarkchat.com。
- 同名陷阱提示：Clark 官方为 clarkchat.com（Clark Labs），与同名开源 web agent（GitHub SalihAwesome/Clark-main）及其自家本地 IDE「Clark Code」均不同；WX 与开源项目 T5ynth（生成式 AI 作振荡器）非同一产品，勿混淆。
- 窗口说明：本批与 2026-07-18 报告高度重叠，前沿模型/记忆层/自主员工等高价值项多为昨日已展开的重现，本报告只就**新入榜且达标**者展开，其余按「已覆盖/已过滤」处理。
- 限制：RSS 不含票数 / 排名 / 评论 / 官方外链，本报告未引用未经核实的融资、用户量、票数、排名或团队背景；ZooData 的「省 token 75–80%」为官方口径，未独立复测。
