# Product Hunt AI 雷达日报 · 2026-07-26

## 今日一句话结论

今天技术向的清晰信号是「agent 的运行时、集成层与开发环境正被重新做成开源、可自托管的基础设施」：Velane 让 agent 经 MCP 自己写、测、部署集成，OpenComputer 把「托管 agent 循环 + 每会话一台 Linux VM」开源，ADE 把多编码 agent 的并行工作台做成本地优先、多端同步；2C 端则由 OpenAI 的 ChatGPT Health（接入个人病历/健康数据的消费级健康助手，07-23 面向全美用户开放）一款明确达标。

## 板块 A：技术向 / B2B / 基础设施 AI

### 今天最值得关注的 1-3 个 A 类产品

**1. Velane —— agent 能真正掌控的集成基础设施**（评分 16/18）

- **定位**：面向 agent 的开源集成运行时（velane.sh，GitHub abskrj/velane，AGPL 可自托管/托管版）。
- **真实问题**：构建 agent 时，为了调用 Stripe/Slack/Salesforce 得自建后端、处理 OAuth 与凭据、写胶水代码，agent 无法自己完成「连系统」这一步。
- **核心机制**：以 MCP server 形式暴露全部能力，agent 在对话内用 `list_connections` 发现已连账号、`get_integration_docs` 取 API 文档，随后写 Bun/Python 代码、在沙箱里跑测试、读日志自愈，测试通过后 `publish_snippet` 发布为带版本、可回滚的稳定 HTTP 端点；内置 800+ OAuth 集成，凭据由代理自动注入、代码永不接触，可选 Firecracker VM 级隔离。
- **为何现在关注**：把 iPaaS 从「给人用的可视化搭建」翻转成「给 agent 用的 MCP 原语」，让 agent 从工具消费者变成工具的构建者与部署者。
- **失败风险**：多租户沙箱安全与凭据代理是攻击面；800+ 集成的维护成本高，且大模型厂商若原生化工具构建会挤压中间层。
- **对混元 API / Agent 启发**：让 agent 自助发现凭据、写代码、沙箱测试、发布端点的闭环，是 Agent 平台「自建工具」可迁移的产品原语。
- 链接：https://velane.sh ｜ github.com/abskrj/velane

**2. OpenComputer —— 开源的托管 agent 运行时**（评分 16/18）

- **定位**：开源（Apache-2.0）的托管 agent 运行时，对标 Anthropic Managed Agents / Modal（agentsessions.dev，docs.opencomputer.dev）。
- **真实问题**：多数 agent 跑在用完即弃的沙箱上，一旦需要记住装过什么、跨会话保留文件或中途续跑就崩溃；而闭源托管方案又把你绑死在单一模型上。
- **核心机制**：每个会话配一台完整 Linux VM，agent 定义为 `{name, model, prompt, runtime}`，runtime 填 `claude` 或 `codex`、换模型只改一个字段；自带密钥不进沙箱、按已有账号计费；会话返回浏览器安全的 client token，可前端实时观看并中途干预；事件日志可从任意 seq 断点续跑，VM 常驻、可休眠/秒级唤醒、支持 checkpoint 分叉回滚，约 $0.004/分钟。
- **为何现在关注**：把「托管 agent 循环 + 隔离工作区 + 凭据外置」这套被验证的形态开源化、去模型耦合，正对 agent 平台化的续跑与状态持久瓶颈。
- **失败风险**：持久 VM 的成本与安全运维重，作为早期开源项目，生态与稳定性待验证。
- **对混元 API / Agent 启发**：可续跑、可 steer、可 checkpoint 的会话事件日志，是构建有状态 agent 服务的关键运行时设计。
- 链接：https://agentsessions.dev

**3. ADE —— 多编码 agent 的本地优先并行工作台**（评分 15/18）

- **定位**：Agentic Development Environment，本地优先、开源，一处编排所有 AI 编码 agent（ade-app.dev，GitHub arul28/ADE）。
- **真实问题**：同时用 Claude Code、Codex、Cursor、Factory Droid、OpenCode 时，分支/文件冲突、上下文在设备间来回拷贝、无法并行跑多个 agent。
- **核心机制**：每个任务独占一个 git worktree（自带分支、终端、端口、历史），多个 agent 并排平铺并行工作；一个常驻本地 `brain` 进程持有项目目录与执行权，桌面、`ade` CLI、iOS 端作为客户端实时同步；可在应用内建/审查/合并 PR，甚至在手机上批准某个 agent 的 diff。
- **为何现在关注**：把「一任务一 worktree + 多端同步 + 本地 brain」做成并行 agent 的控制面，延续编码 agent 从「生成代码」走向「编排一支 agent 队伍」的工作流变化。
- **失败风险**：本地优先架构的同步复杂度高，编码 agent 编排赛道拥挤，差异化能否持续存疑。
- **对混元 API / Agent 启发**：worktree 级隔离 + 证据（截图/录屏/trace）绑定 PR，是多 agent 并行开发的可迁移工程范式。
- 链接：https://ade-app.dev

### A 类趋势信号

1. **Agent 基础设施走向「开源 + 用户自持」**：Velane（集成运行时 AGPL）、OpenComputer（托管 agent 运行时 Apache-2.0）、ADE（本地优先 agent 开发环境）同向，且与今日结转的 Second Brain v2（把记忆层自托管到你自己的 Cloudflare）呼应——闭源托管的 agent 运行时/集成/记忆正被逐一「开源化、去锁定」（满足 ≥2 产品同向）。
2. **agent 从工具消费者变成工具的构建者**：Velane（agent 自己写/测/部署集成）、FluentDB（agent 经 MCP 控制数据库）、OpenComputer（agent 循环即托管服务），共同把 agent 推向「自建后端、连系统、发端点」的主动角色。

### 其他达到门槛的 A 类产品（附录）

| 产品 | 一句话定位 | 评分 | 链接 |
|---|---|---|---|
| FluentDB | AI 原生 macOS 数据库客户端（PG/MySQL/SQLite/SQL Server）：AI 读 schema、写并解释 SQL、跑语句读回结果；带护栏（只上传 schema、行数据不外泄、逐条 SQL 需批准），支持自带模型与 MCP 让外部 agent 管连接/执行 | 13 | https://fluentdb.ai |
| Second Brain v2（结转） | 自托管 MCP 记忆层，桌面 App 两分钟在你自己的 Cloudflare（D1/Vectorize/Workers AI 免费额度）内建成，一个 Worker URL 供 Claude/ChatGPT/Cursor 共享记忆；核心机制 07-13 已展开，本次新增 Mac/Windows 桌面 App | 12 | https://thesecondbrain.dev |

## 板块 B：2C 消费向 AI

### 今天最值得关注的 1-3 个 B 类产品

**1. ChatGPT Health（OpenAI）—— 接入个人病历的消费级健康助手**（评分 16/18）

- **定位 / 目标用户**：ChatGPT 内的专属健康体验，面向想更主动管理自身健康的普通消费者；07-23 面向全美 18 岁以上、free/Go/Plus/Pro 各档用户在 web 与 iOS 开放。
- **痛点**：健康是 ChatGPT 最高频用途之一（每周数亿人问健康问题），但个人的病历、检验单、可穿戴数据分散各处，通用聊天缺乏你自己的健康上下文。
- **机制 / 交互**：可经 b.well 安全连接 Apple Health、MyFitnessPal、Function，及 Epic/Oracle Health、One Medical 等病历系统，让回答基于你自己的数据（读检验单、备诊、给饮食/运动建议、比较保险方案）；置于独立隔离、专用加密的空间，对话不用于训练基础模型，并有独立的健康记忆；明确定位为「帮助理解与备诊」而非诊断。
- **分发 / 留存假设**：借 ChatGPT 全量分发，健康记忆 + 连接的数据源形成切换成本，随现有订阅体系变现。
- **失败风险**：医疗建议的安全与责任边界（已有相关诉讼），隐私与合规是长期高压线，效果与信任需持续验证。
- **评分**：痛点 5 / 新意 4 / 2C 机会 5 / 信号 2。
- 链接：https://openai.com/index/introducing-chatgpt-health

### B 类趋势信号

今日仅 ChatGPT Health 一款明确达标 2C 新品，且为大平台的结构性动作（满足「大平台/重要生态变化」条件）：**消费级 AI 的护城河正从「聊天能力」转向「接入个人真实数据 + 隔离/记忆」**。其余 2C 端未形成多产品同向趋势。

### 其他达到门槛的 B 类产品（附录）

今日无其他达标 2C 类新品。（Speechius、Mufal 等为单点/拥挤同质工具，未达门槛。）

## 我最想跟进的方向

- **技术向**：Velane / OpenComputer / ADE 代表的「开源、自持的 agent 运行时与集成层」，能否在企业采纳中真正替代闭源托管方案，是 Agent 平台竞争的关键变量。
- **2C**：ChatGPT Health 式「接入个人真实数据 + 专属隔离记忆」的消费健康助手，能否在安全与信任约束下形成长期留存，值得跟踪其数据连接的采纳与合规表现。

## 已过滤产品摘要

- **非 AI / AI 为附加**：Islet（Mac 刘海模拟灵动岛）、Capsomnia（Caps Lock 防休眠）、Browser FX（网页音频实时特效）、ShellMate（SSH 工作区）、Banquish（网页剪藏画布）、Seller by Facebook（Marketplace 卖货）、Hotspot Meter/HealthyNotch/MinkNote/NotifyBridge/Fedica 2.0 等均非 AI 核心。
- **单点 / 拥挤同质**：Wisprkey（对 Mac 应用说话，语音输入单点）、Heard（给 Claude Code/Codex 加语音，拥挤通知类）、Speech To Markdown（本地语音转笔记）、Speechius（语音跟随提词器，单点且拥挤）、Mufal（不可见会议 copilot，同 Cluely 类拥挤且用途存疑）、Liso（划词 TTS）。
- **延续 / 已覆盖（本批 RSS 大量为往日结转）**：HarnessRouter、Pushary、Freesolo Flash、Fluree AI、The new Firecrawl /search、Buzz、Prosed、RunEvr、Astartis x Codex、LapuAi 等均为 07-24/07-25 报告已展开项，未重复评估。
- **营销/SEO/发现型 / 同名难核实 / 娱乐**：PromptScout（品牌 AI 可见度）、YC has it（发现型小工具）、Findborg（无广告搜索）、Fathom/AskCodi/Drawsy/Plow Mac App（拥挤或早期信息不足）、Basedash AI Kit（分析嵌入 AI 附加）、Teable 3.0（AI 为附加）、Speakworld/Motionly（同名难核实）、xPitch/Squishy/Fikry（非 AI/娱乐），均降权过滤。

## 数据源与限制

- 主数据源：Product Hunt 官方 RSS（`scripts/fetch_producthunt.py`，本次成功抓取 50 条候选，抓取于 2026-07-25 23:03 UTC），RSS 正常，未触发浏览器榜单备用。
- 核实方式：官网 / 官方博客 / 新闻稿 / GitHub / huntscreens 等公开来源交叉验证；PH 产品页常返回 403，故不依赖其抓取。
- 限制：本批 RSS 约半数为 07-24/07-25 已覆盖的跨日结转项，去重后新条目主要集中在板块 A。不编造票数、排名、融资、用户量。Velane「800+ 集成/沙箱自愈/发布端点」、OpenComputer「每会话一台 VM/断点续跑/$0.004 每分钟」、ADE「worktree/多端同步」、FluentDB「护栏/只传 schema」、ChatGPT Health「病历接入/隔离加密/健康记忆」等均为官方自述，未独立验证效果；Second Brain 为 07-13 已展开项，仅因 v2 桌面 App 属新信息而在附录注明。
