# Product Hunt AI 雷达 · 2026-07-20

## 今日一句话结论

窗口仍与昨日大面积重叠，前沿模型（Kimi K3）、OpenAI 硬件（Codex Micro）、记忆/上下文层（In Parallel/Unabyss/Kit For AI）、人机共编（OpenMarkdown）、agent 数据层（ZooData）等均为近两日已展开项，不重复；今天真正的新信号集中在**技术向底层**：**Rewisp** 把「屏幕上的一切」做成纯文本的本地环境记忆，并通过 MCP 只读地喂给 Claude/Cursor 当上下文；**BaseRT** 用原生 Metal 把 Apple Silicon 的本地推理吞吐推到超过 llama.cpp / MLX。2C 端今日无新达标产品——新入榜的疑似消费品（Spycost 比价、Detourmap 旅行地图）AI 均非核心。

## 板块 A：技术向 / B2B / 基础设施 AI

### 今天最值得关注的 A 类产品

**1. Rewisp — 纯文本的本地环境记忆，经 MCP 供给 agent 上下文（评分 14/18）**

- 定位：macOS 端「环境记忆」应用（yashmitb.github.io/Rewisp，开源，早期个人项目），口号「See it once. Ask forever.」；不同于录屏工具，它只把屏幕上出现过的**文本**抽取并保存在本地，不存视频。
- 真实问题：人一天在几十个 App / 网页间流动，看过的关键信息、答应过别人的事很快遗忘；而现有「记录一切」的产品（Rewind、Recall）靠录屏，既重又踩隐私红线，且这些记忆无法被你正在用的 coding agent 直接调用。
- 核心机制：几点值得记：①**只留干净文本不留视频**——因此能做录屏做不到的事，比如为同一页面保留每个版本、精确显示自上次查看后「增/删/移动」了什么；②**⌘⇧Space 用自然语言提问**，全文检索定位到那一刻、由模型带来源+时间写出答案；③**模型逐级回退**——可设定 Apple 端内模型→本地模型→Gemini→Claude→ChatGPT 的顺序，答得不好就自动落到下一个（默认可全程端上、不外传）；④**承诺追踪**——「周五发给你」这类话在你书写处被捕捉，确认后到期当天提醒一次直到完成；⑤**MCP 只读接口**——Claude Desktop / Claude Code / Cursor 等任意 MCP 客户端可在工作时检索你的屏幕历史、读取你的承诺，只读、纯本地、不消耗你的订阅额度。还附带按 App 统计本地算出的时间去向、每日「发生了什么/还没完成/它学到了你什么」摘要。
- 为何关注：它把「个人记忆」从一个孤立的消费工具，升级成**可被 agent 消费的上下文来源**——这正是近两周记忆/上下文层（In Parallel、Unabyss、Kit For AI）同一命题的消费/端侧切面：区别在于 Rewisp 的输入是**被动的屏幕文本**而非主动接入的 SaaS，且强调 MCP 只读、纯本地。
- 失败风险：环境记忆是 PMF 反复受挫的赛道（Rewind 转硬件后被并购，多个同类项目因「作者自己都不打开」而夭折），「记录一切」的隐私信任门槛高；作为早期个人开源项目，若「文本 diff + 承诺追踪 + MCP 供给」体验不足以形成日常依赖，极易被系统级方案（如 OS 自带回溯）吸收。
- 对混元 API/Agent 启发：「把用户的被动行为流沉淀成结构化、可授权、只读的 MCP 上下文源」是可直接迁移的产品原语；模型逐级回退（端上→本地→云、答不好再升级）也是控成本/保隐私的实用路由范式，值得 Agent 平台参考。
- 链接：yashmitb.github.io/Rewisp（PH：/products/rewisp-an-ambient-memory-for-your-mac）

**2. BaseRT — 原生 Metal 的 Apple Silicon 本地推理引擎（评分 13/18）**

- 定位：面向 Apple Silicon 的原生 Metal LLM 推理运行时（github.com/basecompute/baseRT，开源；附 arXiv 论文与 HuggingFace 发布博客），主打「M 系芯片上迄今最高推理吞吐」。
- 真实问题：本地推理正被隐私、延迟、云成本三重力量推向端侧，但主流运行时（llama.cpp、MLX）都带着「不是为 Metal 执行模型 / 统一内存拓扑设计」的抽象层开销，把一部分性能留在了桌面上。
- 核心机制：抛开框架抽象，直接在 Metal 上做**芯片级 kernel 融合、统一内存感知优化、定制 dispatch 逻辑**；支持从 Q2 到 FP16 共 8 种量化格式、全系 M 芯片。官方在 M3 / M4 Pro 上用 Qwen3、Llama 3.2、Gemma 4 家族（Q4/Q8）评测：decode 吞吐最高比 llama.cpp 快 1.56×、比 MLX 快 1.35×，MoE 模型 prefill 最高快 1.81×。规律很清晰——**小稠密模型优势最大**（每 token 固定派发开销占比高，Qwen3-0.6B 快约 56%），随着模型变大、decode 转为「受显存带宽约束」，优势收窄到 1.04–1.07×（这正是瓶颈从软件开销转到硬件极限的预期表现）。
- 为何关注：这是一份**可复现、有基准、机制清楚**的系统工程，而非概念包装；它给「端侧推理」这条使能层加了一块实打实的性能拼图，尤其利好小模型 / 端上 agent 的低延迟场景。
- 失败风险：本质是「更快的推理」而非新范式，收益随模型增大而摊薄，且已有 uzu（Mirai）等原生 Metal 竞品；一旦 Apple 官方（MLX）把同类底层优化补齐，纯性能领先难长期维持，护城河更多要靠生态与易用性。
- 对混元 API/Agent 启发：端侧/本地推理正成为 Agent 落地的关键使能层——「贴着硬件做 kernel 融合 + 统一内存优化」的思路，对自研端上推理、以及为小模型 agent 争取低延迟，都有直接参考价值。
- 链接：github.com/basecompute/baseRT（arXiv:2607.00501；huggingface.co/blog/basecompute/basert-release）

### A 类趋势信号

1. **MCP 正固化为给 agent 供给「记忆 / 数据 / 技能」的标准接口**：Rewisp（把屏幕文本记忆经 MCP 只读喂给 Claude/Cursor）与本仍在窗口内的记忆/上下文层（In Parallel、Unabyss、Kit For AI）、以及本日附录的 OpenSEO（把 SEO 数据 + 可复用 Agent Skills 经 MCP 暴露）从多个切面指向同一件事：不让 agent 自己吞原始网页/散落上下文，而是把干净、可授权的「记忆/事实/技能」经 MCP 标准化供给——多产品同向，是明确趋势。
2. **端侧 / 本地 AI 继续加码**：BaseRT（贴着 Metal 把本地推理吞吐做到最高）与 Rewisp（本地模型 + 端上环境记忆、答不好再升级到云）从「性能」与「隐私」两端印证同一方向——隐私、延迟、云成本正把推理与记忆一起推向本地，本地运行时/端上记忆成为使能层。

### 其他达到门槛的 A 类产品

| 产品 | 一句话 | 评分 | 链接 |
|---|---|---|---|
| OpenSEO | 开源自托管的 Ahrefs/Semrush 替代（MIT，Docker/Cloudflare，数据来自 DataForSEO 自带 key 按用量付费）；卖点是**AI-native**：暴露 MCP server + 一组可复用 Agent Skills（keyword-research/competitor-analysis/link-prospecting 等），让 Claude Code/OpenClaw/Codex 直接跑 SEO 工作流，且强调「别盲信 agent，给你链接回看原始数据」。注意：核心数据引擎是第三方 DataForSEO、SEO 属通用降权品类，此处按「AI 显著重构了工作流/交互」计入，仅列附录 | 11 | github.com/kirc0de/open-seo |

## 板块 B：2C 消费向 AI

### 今天最值得关注的 B 类产品

今日无高价值 2C 类新品（不凑数）。今日新入榜的疑似消费向产品经核实 AI 均非核心：**Spycost**（「又被假折扣骗了？」）本质是价格历史追踪 + 假折扣识别 + 到价提醒，属 Keepa/CamelCamelCamel 一类比价工具，AI 不是核心能力；**Detourmap**（把「值得绕路的地方」汇成一张互动地图）是策展式旅行地图，未见 AI 为核心机制。昨日达标的 Paradigm（自适应学习）已在上一批报告展开，不重复。

### B 类趋势信号

今日未形成明确 2C 趋势信号（无新达标产品）。

### 其他达到门槛的 B 类产品

今日无其他达到门槛的 2C 新品。

## 我最想跟进的方向

- 技术向：**端侧推理与端上记忆的合流**——BaseRT（本地推理提速）+ Rewisp（本地模型 + 环境记忆经 MCP 供给 agent），两者叠加最接近「一个隐私安全、低延迟、可被 agent 直接调用的本地智能底座」，对混元端上/端侧 Agent 的架构最有迁移价值。
- 2C：本日无新标的。继续观察「环境记忆 / 个人助理」能否在消费端跨过隐私信任与「日常依赖」这两道坎——但今日无新信号，不强行给结论。

## 已过滤产品摘要

- **AI 非核心 / 非 AI（今日新入榜）**：Spycost（价格历史追踪 + 假折扣识别，比价工具，AI 非核心）、Detourmap（策展式旅行互动地图，AI 非核心）、Kobbe（无 cookie 的隐私优先网站分析 + 收入归因，纯分析工具，非 AI）。
- **已在近日报告覆盖（不重复展开）**：Kimi K3、Codex Micro、In Parallel、Nitrosend、Unabyss、Verse、Kit For AI、Paradigm、OpenMarkdown、ZooData、Clark（均近两日已展开）；Basedash Suggestions、Manta AI、Weave、Zro、River、Graft AI、Amami、ChikitAI、Breadcromb、Aye、Cito、Pebbles Ai、DevSwat、Node Health、The Eureka Database（此前已过滤）；Albato AI（2025 旧品）、Mainichi/WX/Mirage/LiveDemo/Acebuilder/DocuSmart AI（07-19 已判非 AI 或 AI 非核心）。
- **非 AI 或 AI 非核心（碎片/工具类）**：Pocket Screen（悬浮窗）、Scribble Party（白板）、Timely（日程）、PixyCAD（CAD）、Yapper Leaderboard、SIMPLI（分账）、Inbix（邮件基础设施）、Ventorah（浏览器 CFD 仿真）、BrickSolvr（3D→积木）、FlightGlitch（错价机票）、Microflow（单片机）、OpenSEO（见附录，AI 为界面层而非数据核心，SEO 品类降权）。

## 数据源与限制

- 主数据源：Product Hunt RSS（`https://www.producthunt.com/feed`），抓取时间 2026-07-19 23:02 UTC，共 50 条候选；RSS 正常，未启用浏览器榜单备用。
- 交叉核实：各产品官网 / 官方 GitHub / 论文 / API 文档——Rewisp 参考其官方页 yashmitb.github.io/Rewisp，BaseRT 参考 arXiv 论文（2607.00501）与 HuggingFace 发布博客 + GitHub basecompute/baseRT，OpenSEO 参考 kirc0de/open-seo 与 openalternative.co、openseo.so，Spycost/Detourmap/Kobbe 参考各自官方页。
- 同名/歧义提示：Detourmap 与 GitHub 上的 `rgdonohue/detour`（Santa Fe 策展路线原型，非 AI）及一批 AI 旅行规划器（Roadtrippers Autopilot/New Roads 等）不是同一产品，本报告仅据其 PH 标语判定为策展地图、AI 非核心。
- 窗口说明：本批与 2026-07-18/07-19 报告高度重叠，前沿模型 / 记忆层 / 人机共编 / agent 数据层等高价值项多为近两日已展开的重现，本报告只就**新入榜且达标**者展开，其余按「已覆盖/已过滤」处理。
- 限制：RSS 不含票数 / 排名 / 评论 / 官方外链；本报告未引用未经核实的融资、用户量、票数、排名或团队背景；BaseRT 的性能倍数为官方论文/博客口径（M3/M4 Pro、指定模型与量化），未独立复测，实际因机型/模型/量化而异；Rewisp 为早期个人开源项目，成熟度与留存尚待观察。
