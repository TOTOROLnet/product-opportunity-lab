# Product Hunt AI 雷达日报 · 2026-07-24

## 今日一句话结论

今天技术向最密集的信号在「agent 安全治理」——valv（数据库授权）、HOL Guard（运行时防火墙）、Astartis x Codex（面向 coding agent 的证据化控制面）同日出现，把「执行前授权 + 不可篡改审计」坐实为独立基础设施层；PromptQL 用「多人共享 AI 线程 + 纠错即沉淀」重构协作，Blaxel Agent Drive 补上多 agent 共享文件系统；2C 端 Basement 一款明确达标（把 AI agent 直接嵌进移动浏览器 + 社交 + 代付）。

## 板块 A：技术向 / B2B / 基础设施 AI

### 今天最值得关注的 1-3 个 A 类产品

**1. PromptQL —— 用「多人共享 AI 线程」替代 Slack+插件**（评分 14/18）

- **定位**：Hasura 出品的 AI-native 工作台，目标替掉「Slack + Claude + Glean + 自建 agent」这套拼装栈。
- **真实问题**：AI 被硬贴在为「人对人聊天」而生的工具上，上下文困在各自筒仓里，导致结果不准、知识散失。
- **核心机制**：三件套——跨端多人共享 AI 线程、自维护 wiki、行级/属性级权限；不用 RAG，而让 AI 直接写代码解题；被纠错一次即沉淀成可复用 skill 与团队知识，谁遇到缺口谁在流程里补。
- **为何现在关注**：把「上下文工程」从提示词技巧变成产品机制——纠错在真实工作中自动累积，是 AI 协作形态的结构性变化。
- **失败风险**：无公开准确率对比，「杀死 Slack」更像愿景；单一工作台能否替掉各岗位最优工具存疑。
- **对混元 API / Agent 启发**：多人共享上下文 + 纠错回写 + 权限隔离，可做成 Agent 平台的一等能力，而非让每个 agent 各自维护记忆。
- 链接：https://promptql.io/ ｜ PH: /products/promptql

**2. valv —— 面向 agent 的数据库授权层**（评分 14/18）

- **定位**：给 LLM/agent 一个「能查库、但只能查被允许的部分」的授权中间层。
- **真实问题**：直接把数据库凭证交给 agent，一句坏提示词就可能越权读列、跨租户、注入或误写。
- **核心机制**：模型只发结构化查询（非 SQL），valv 按实时 schema 校验、用 TS 代码写的 per-caller 策略缩放行/列、再编译成 SQL 执行；deny-by-default，查询在服务端重建重校后才生成 SQL；支持 Vercel AI SDK / OpenAI / Gemini，或经 `@valv/mcp` 让 Claude Code 直接安全查库，覆盖 Postgres/MySQL/SQLite/ClickHouse。
- **为何现在关注**：把「不信任模型、信任规则」落到数据面，与 Kastra（动作授权）、HOL Guard（运行时防火墙）共同拼出 agent 治理栈。
- **失败风险**：结构化查询表达力受限、策略维护成本，MCP 原生权限若跟进会挤压中间层。
- **对混元 API / Agent 启发**：数据访问应做成「结构化查询 + 服务端重建重校 + deny-by-default」，而非把裸 SQL 权限直接暴露给模型。
- 链接：npm @valv/mcp-sdk ｜ PH: /products/valv-2

**3. Blaxel Agent Drive —— 多 agent 共享的分布式文件系统**（评分 13/18）

- **定位**：给多个 sandbox/agent 一块可同时挂载、并发读写的共享 POSIX 文件系统。
- **真实问题**：多 agent 协作时要互传工件与上下文，S3 非 POSIX、volume 只能单挂载，跨 agent 交接得靠序列化或中转服务。
- **核心机制**：自研 FUSE 客户端提供 POSIX 接口，多 sandbox 可同时 RWX、运行中热挂载、按子目录挂载、容量自动扩张且有复制冗余；针对 agent 高并发小文件（笔记/JSON/工具输出）优化，新 sandbox 挂上即续接历史上下文。
- **为何现在关注**：继 box/CreateOS 把「算力+隔离」产品化后，它补的是多 agent 协作所需的「共享记忆/工件」底座（私有预览）。
- **失败风险**：并发写一致性与缓存一致性难做，私有预览、单区域，云厂商对象存储也在补 POSIX。
- **对混元 API / Agent 启发**：多 agent 编排要把「可并发共享、热挂载、跨会话续接的文件系统」当原语，而非每次序列化中转。
- 链接：https://blaxel.ai/agent-drive ｜ PH: /products/blaxel

### A 类趋势信号

1. **Agent 安全/治理下沉为「执行前授权 + 不可篡改证据」层**：valv（数据面授权）、HOL Guard（运行时防火墙+签名审计）、Astartis x Codex（coding agent 证据化控制面）同日出现，延续 07-23 Kastra、07-21 Lunen/Nautis/Skippr，是今天最密集的结构性信号。
2. **Agent 运行时底座从「算力/隔离」扩到「共享状态/文件系统」**：Blaxel Agent Drive 把多 agent 并发读写、热挂载、跨会话续接的 POSIX FS 做成一等原语，是 box/CreateOS 之后多 agent 协作的必要拼图。
3. **AI-native 工作台把「上下文」变成产品机制**：PromptQL 用共享 AI 线程 + 纠错回写替代 Slack+插件，体现 AI 协作形态的结构性变化（当前单一代表，趋势待观察）。

### 其他达到门槛的 A 类产品（附录）

| 产品 | 一句话定位 | 评分 | 链接 |
|---|---|---|---|
| HOL Guard | 「AI agent 的防火墙」：本地优先拦截每个 tool/shell/文件操作，allow/block/人工审批 + 签名可回放审计，核心防护免费、可选 Guard Cloud 做跨设备历史与团队 RBAC（Hashgraph Online 出品） | 13 | github hashgraph-online/hol-guard ｜ PH /products/hol-guard |
| Astartis x Codex | 面向企业开发者的安全「控制面」，围绕证据治理 coding agent 的动作、留可审计记录（官网信息有限，谨慎看待） | 12 | PH /products/astartis-x-codex |
| PenguinHarness | 让 agent 自动为 agent 迭代更优「harness」（提示/工具/编排），每轮约 $0.02，属「harness 优化 / agents 改进 agents」这一新兴方向 | 11 | PH /products/penguinharness |
| LapuAi | 定位「让 AI 用电脑的 OS 驱动」，把 computer-use 下沉到操作系统层的接入能力（信息偏早期） | 11 | PH /products/lapuai |

## 板块 B：2C 消费向 AI

### 今天最值得关注的 1-3 个 B 类产品

**1. Basement —— 把 AI agent 嵌进每个网页的多人移动浏览器**（评分 13/18）

- **定位 / 目标用户**：面向爱社交购物、爱淘价的移动端用户，一个「多人 + AI agent」的手机浏览器（iOS 已上架）。
- **痛点**：手机浏览是孤立体验，比价/追踪/找替代品得手动复制到 ChatGPT、装插件，购物决策低效且没人一起参考。
- **机制 / 交互**：每个用户有个叫 Baseling 的 AI agent，能解析当前页面 DOM、学习偏好与预算、主动比价/追库存/找更优价、并支持代付（单次卡）；同页可与他人实时同房社交，Baseling 之间还能 agent-to-agent 互联找人/找 deal；底层跑在 Venice 上。
- **分发 / 留存假设**：靠 iOS 应用 + 社交飞轮（越多人用 agent 越聪明）获客与留存，代付/导购构成潜在变现。
- **失败风险**：浏览器切换成本高、隐私与代付信任门槛大，社交+购物+agent 三合一易散焦，变现路径尚不清晰。
- 链接：https://basementbrowser.com/ ｜ PH: /products/basement-browser

### B 类趋势信号

今日 2C 端仅 Basement 一款明确达标（ReExplain 勉强及格入附录）。可观察到「把 AI agent 直接嵌进浏览器/网页并叠加社交与代付」的消费级苗头，但单一产品尚不足以成势，**今日 2C 端未形成明确趋势信号**。

### 其他达到门槛的 B 类产品（附录）

| 产品 | 一句话定位 | 评分 | 链接 |
|---|---|---|---|
| ReExplain | 「你讲给 AI 听，它帮你发现哪里不会」：用费曼技巧让用户口述/写下概念，AI 追问、找知识盲点、把 PDF 转成 Q&A、生成掌握度地图（同类应用较多，差异化有限） | 11 | PH /products/reexplain |

## 我最想跟进的方向

- **技术向**：agent 的「三层安全栈」——运行时隔离（box/CreateOS/Blaxel）、动作授权（Kastra/HOL Guard）、数据面授权（valv）。三者叠起来可能成为 agent 进企业的标配底座，值得观察谁做成平台级默认层。
- **2C**：AI agent 直接嵌进消费级浏览器 + 代付（Basement）——能否跑通信任与留存，是「agentic commerce」触达普通消费者的一个可观察样本。

## 已过滤产品摘要

- **AI 非核心 / 单点工具**：Wispro、Megaphone（语音转写单点）、Chimlo、Vizhi（Codex 会话监控/键盘外设，拥挤单点）、Cubby Clipboard（截图 OCR 剪贴板）、Nugget（语音速记）、AuraSpeak（扫码翻译单点）、Basedash AI Kit（GPT-5.6 分析嵌入，AI 为附加）、Rehello（个人关系 CRM，AI 附加）、PodcastorAI（AI 分身播客，单点内容生成）。
- **营销 / SEO / 增长 / 调研**：PromptScout（品牌 AI 可见度/AEO）、CrawlRaven（SEO Hub）、Trend Seeker（市场调研）。
- **编码 agent / 工具（拥挤或信息不足）**：OpenCode Superapp、Quaso/Notte、AgentLoop、AskCodi、Cosyra 2.0、SwiftScale、Moxie Docs、Drawsy、Caw、Plow Mac App、canitbebuilt（多为拥挤同质或早期信息不足，暂不展开）。
- **非 AI / 硬件 / 娱乐 / 数据可视化**：HonorBox、Squishy、NotifyBridge、xPitch、El Niño、GTA DataCity、Ombrelle、Findborg、Fikry、Rechroma、Teable 3.0（AI 为附加）。
- **信息不足 / 同名难核实（未进正文）**：Speakworld（与巴西同名语言学校混淆，PH 侧沉浸式语言学习游戏信息不足）、Motionly（AI motion graphics 编辑器，检索多指向 Osmo/Hera，难独立核实）、Fable Flight、Vevey、Swenest、Fathom。

## 数据源与限制

- 主数据源：Product Hunt 官方 RSS（`scripts/fetch_producthunt.py`，本次成功抓取 50 条候选），未触发浏览器榜单备用。本批候选与近日报告去重后基本为新条目。
- 核实方式：PH 产品页常返回 403，核实主要依赖官网、GitHub、npm、docs 与 Web 搜索交叉验证。
- 限制：不编造票数、排名、融资、用户量。valv「结构化查询/deny-by-default」、Blaxel Agent Drive「并发 RWX/热挂载/私有预览」、HOL Guard「本地优先/签名审计」、Basement「Baselings/代付/跑在 Venice」等均为官方自述，未独立核实；Astartis x Codex、LapuAi、PenguinHarness 官方信息偏早期或有限，评分从严并已在附录注明；Speakworld/Motionly 存在同名或来源指向不一，未进正文。
