# Product Hunt AI 雷达日报 · 2026-07-29

## 今日一句话结论

今天 RSS 窗口偏滞后（约一半是 07-28 已展开的 Grok 4.5、Rivault、Illume 等），但去重后仍捞出一批扎实新品，集中在三条 A 线：**Agent 评估/可观测正从「看板」升级为运行时「执行层」并合流进自我改进闭环**（Prefactor、Cekura）、**垂直 Agent 从「回复」走向「在真实业务系统里执行并自建流程」**（Conduit、Superunit）、**Agent 记忆/公司大脑被做成用户自持、结构化、带审批的层**（Liminal、FlowTask）。B 端偏薄，仅 Pinery（逐处 diff 审批的书稿协作）与 SUB/WAVE（AI 当电台 DJ 而非生成器）两款单点。

## 板块 A：技术向 / B2B / 基础设施 AI

### 今天最值得关注的 1-3 个 A 类产品

**1. Prefactor —— 把 Agent 评估直接接到运行时的「拦/批/杀」**（评分 15/18）
- **定位**：面向生产环境的 Agent 可观测 + 评估 + 强制执行平台。
- **真实问题**：多数可观测工具只给 trace 和事后看板，"agent 干得好不好、越界了没有" 要人事后翻日志，风险动作已经发生。
- **核心机制**：把每次 run 拆成 span 实时采集（模型调用/工具调用/自定义业务步），按你自定义的 evals（LLM-as-judge + 技术/质性指标 + 数据风险）100% 打分，再把评估结果直接接到运行时动作——hold/approve/block、HITL 审批路由、PII 删除、一键 kill switch；SDK 原生支持 LangChain/Claude/Vercel AI/OpenClaw。
- **为何关注**：它把「评估」从报表变成执行层，正好接上本雷达持续追踪的授权/审批主线（Rivault/Pushary/Openbase），只是触发源换成了「评估分越线」。
- **失败风险**：per-span 计费在高流量下成本敏感；实时判定的误杀/误批会直接打断业务，判官质量是命门。
- **对混元 API/Agent 启发**：把 eval 与运行时 guardrail 合成一层（评估驱动拦截/审批），比"先跑完再离线评测"更适合 agent 平台。
- **链接**：https://www.producthunt.com/products/prefactor

**2. Liminal —— 用你的 Obsidian 库当 Agent 的持久记忆**（评分 15/18）
- **定位**：本地优先、fair-source 的工作 Agent，跨 Slack/Xero/Gmail/M365/Linear/Notion 500+ 工具，跑在你自己的机器、用你已付费的模型。
- **真实问题**：agent 记忆多是厂商黑盒，用户既不拥有、也难审计与迁移，团队更无法共享。
- **核心机制**：双通道记忆——Obsidian 兼容的 markdown 库（带 [[wikilinks]]、实体档案 dossier、MOC）当长期"大脑"，JSON scratchpad 当会话即时记忆；`vault_ingest/recall_relevant` 读写并排序，空闲期 `vault_curate` 做整理/固化；团队版按 workspace 指纹做记忆联邦（workspace 级共享、chat 级私有）。
- **为何关注**：把 agent 记忆落成"用户拥有的纯文本知识图谱 + 可见 provenance"，而非不可查的向量黑盒，正面回应记忆的所有权与可审计难题。
- **失败风险**：本地部署门槛与多设备/团队同步复杂度；纯 markdown 图谱在海量记忆下的检索质量待验证。
- **对混元 API/Agent 启发**：记忆层可做成"用户可读可迁移的文件 + 联邦作用域"，是差异化于托管记忆的可迁移设计。
- **链接**：https://www.producthunt.com/products/liminal-4

**3. Conduit —— 会真动手的酒店垂直 Agent，还自己写流程建工具**（评分 14/18）
- **定位**：面向酒店/民宿/服务式公寓的运营 AI 平台，一套预置 agent（客服、销售、清洁、业主沟通）跨语音与文字执行。
- **真实问题**：行业里的"AI"多半只是更快回复，退款、改单、派工这些真活儿仍落回人工。
- **核心机制**：agent 依权限与业务策略直接执行——处理退款、改预约、派承包商、排清洁、记录偏好、挽回停滞订单，复杂判断升级到统一收件箱由人接管；背后的 "Operator" 会从每次交互中学习，补齐缺失知识、更新 SOP、自建工具；接 PMS/CRM，提供 API 与 MCP、SOC2/HIPAA。
- **为何关注**：延续 07-27 Athena 的走向——垂直 agent 从"给建议"进"改真实系统状态"，且 Operator 的"自写流程/自建工具"是可复用能力沉淀的样板。
- **失败风险**：真金白银动作（退款/改单）的错误代价高，权限与回滚设计是硬约束；重运营、行业 know-how 深，横向复制不易。
- **对混元 API/Agent 启发**：垂直 agent 应内建"预览确认 + 自沉淀 SOP/工具"，让执行力随使用增长而非停在一次性回复。
- **链接**：https://www.producthunt.com/products/conduit-ai

### A 类趋势信号

1. **Agent 评估/可观测从「看板」升级为运行时「执行层」，并与自我改进闭环合流**：Prefactor 把评估直接接到 hold/approve/block/kill；Cekura 把测试接到「诊断→改 prompt/配置→再验证」的自我改进循环。评估不再只产报告，而是驱动运行时动作与自动迭代。
2. **垂直 Agent 从「回复」走向「在真实业务系统里执行 + 自建流程/工具」**：Conduit（酒店退款/改单/派单 + Operator 自写 SOP 建工具）、Superunit（雇佣核验电话/邮件/传真并行 + FCRA 审计），延续 Athena，agent 直接改真实系统状态并沉淀可复用能力。
3. **Agent 记忆/公司大脑被做成用户自持、结构化、带审批的层**：Liminal（Obsidian 库当记忆 + 团队记忆联邦）、FlowTask（Slack/邮件→skill.md/MCP + "什么能进 AI 记忆"的审批门），记忆从厂商黑盒转向用户拥有的文件/技能图谱 + 准入治理。

### 其他达到门槛的 A 类产品（附录表格，最多 10 个）

| 产品 | 一句话定位 | 评分 | 链接 |
| --- | --- | --- | --- |
| Cekura（原 Vocera） | 语音/聊天 Agent 的自动化 QA + 可观测 + 自我改进循环（诊断→改 prompt→再验证），含红队；YC、75+ 客户 | 14/18 | https://www.producthunt.com/products/vocera |
| Superunit | AI 语音/邮件/传真 agent 直连雇主做雇佣/收入核验，电话/邮件/传真并行、导航 IVR、FCRA 合规审计、按成功付费 | 13/18 | https://www.producthunt.com/products/superunit |
| FlowTask 2.0 | 「AI Agent 的公司大脑」：Slack/邮件/文档自动结构化成 skill.md/MCP 记忆，带"什么进 AI 记忆"的人审门 + 任务路由 | 12/18 | https://www.producthunt.com/products/flowtask |
| MCP-Billing | 给 MCP Server 的鉴权 + 计费样板：OAuth 2.1/PKCE、API Key、Stripe 用量计费，已处理幂等/部分失败/流式只计一次等边界 | 12/18 | https://www.producthunt.com/products/mcp-billing |
| Shofo（RecipeBook by Shofo） | 「视频界的 Common Crawl」：抓取+标注短视频成数据集按小时卖给 AI 实验室（YC W2026）；PH 展示名与数据业务标语不一致，谨慎采信 | 11/18 | https://www.producthunt.com/products/recipebook-by-shofo |

## 板块 B：2C 消费向 AI

### 今天最值得关注的 1-3 个 B 类产品

**1. Pinery（Prose）—— 像审 PR 一样审 AI 的每一处改稿**（评分 12/18）
- **定位**：Mac 上的 AI 书稿写作与自出版工作室，AI 协作者 "Prose" 内嵌在稿子页边。
- **目标用户 & 痛点**：写书/长文的作者想要 AI 帮忙，又怕 AI 把自己的文风改没、怕改动不受控。
- **机制/交互**：Prose 在页边工作而非另开聊天窗，每处修改都以可审 diff 呈现（逐条接受/拒绝），并给出改动类型标签（语法/用词/格式）；可指令"只改错字、别动语气"，出版前一键扫全章一致性。
- **分发/留存假设**：靠"改稿可控 + 保住声音"打动惧怕 AI 味的作者，自出版工作室形成从写到出的闭环；订阅变现，留存来自长稿项目粘性。
- **失败风险**：赛道拥挤（Proselon/Pensive/VSProse/Writers Factory 都主打页边/diff/保声音），"diff 审批"已非独有机制；仅 Mac、面窄。
- **链接**：https://www.producthunt.com/products/pinery

**2. SUB/WAVE —— 让 LLM 当电台 DJ，而不是内容生成器**（评分 11/18）
- **定位**：自托管的个人网络电台，一条所有人同时听的共享流，AI DJ 挑歌并口播。
- **目标用户 & 痛点**：厌倦"千人千面、为你打乱、随时暂停"的流媒体、想要一起听同一条广播感的自托管/homelab 玩家。
- **机制/交互**：从你自己的 Navidrome 曲库选曲（不生成音乐、不替代你的口味），LLM DJ 写台词、报时报天气报台标、克隆声线人设，可用自然语言点歌（点了也只是插进这条共享流、不跳过当前曲）；一条 Icecast 流、可换模型、带 MCP 供 agent 驱动、开源。
- **分发/留存假设**：开源 + "反算法、无跳过"的强概念是天然获客点（自托管社群）；但受众窄、无内建商业模式，留存靠情怀与共享体验。
- **失败风险**：需自备 Navidrome + LLM，门槛高、面窄；AI 只是 DJ 增值，纯 OSS 无变现闭环。
- **链接**：https://www.producthunt.com/products/sub-wave

### B 类趋势信号

今日 2C 新品稀薄，两款均属单点，未形成明确多产品趋势，仅记两条方向：一是**消费级 AI 创作强调"你审每处改动、保住你的声音"**（Pinery 的逐处 diff 审批 + 只改错字），本周多款 Mac 写作工具同向但高度同质；二是**把 AI 当"策展/主持"而非"内容生成器"**（SUB/WAVE 用 LLM 当 DJ、刻意反个性化），是有意思但受众窄的孤例。

### 其他达到门槛的 B 类产品（附录表格，最多 5 个）

今日无新增达到门槛的 B 类附录产品。

## 我最想跟进的方向

- **技术向**：Agent「评估即执行」层（Prefactor 这类把 eval 直接接到运行时 hold/approve/block/kill + HITL）——当 agent 普遍拿到真实读写权，"由评估驱动的运行时拦截/审批"可能比离线评测更关键，且与授权/审批中间件天然合流。
- **2C**：用户自持、可控的 AI 协作（Pinery 的逐处 diff 审批 + 保声音）——消费级 AI 创作的信任与留存，可能来自"每处改动都可审、文风不被抹平"，而非更强的一键生成。

## 已过滤产品摘要

- **新增·非正文（属 AI 但降权/拥挤/难核实）**：Lamoom（在 Claude 里跑/卖 agent 应用的市场，概念有趣但仍属个人 cohort 早期、独立信息薄）、EasyCircuit（自然语言→电路/PCB 的"硬件 vibe-coding"，是 AI 核心但同概念工具扎堆，未独立核实该具体品）、Tag Your Photos（Apple Photos 本地 AI 打标，单点无留存）、G.I.A.ac（一句话生成 App，text-to-app 拥挤、验证薄）、Tackly（AI 思维导图，Mappy/Mindlify 等同质）、Estera（AI 电话/WhatsApp 接待，语音接待拥挤）、AI YC interview（Gstack 进 Meet 给反馈，novelty）、HeyZoku/Comms/Notate（语音指挥/部署/同名难核实，延续 07-28 过滤）、Artifacts by Databox（BI 加 AI 分析师，AI 附加）、Tunio/Adomate/Robynn AI/Repaint Socials（垂直/营销/建站）。
- **非 AI 核心 / 工具类**：Cercle（好友"信号灯"社交，非 AI）、Cardzen（信用卡权益/积分追踪，AI 非核心）、qsa.sh（`curl` 跑 nmap/nuclei 的外部扫描封装，非 AI）、Phantom（同名产品众多，无法确认 PH 具体品）、FindDiskKiller、superfile、ZenithBar、Space-Bin、Snapr、Lottie Creator 2.0、Jotform Website Widgets、Hardbook、Ycode、Audos Summer Camp（学分促销，非产品）。
- **滞后旧品（07-24～07-28 已展开，不重复评分）**：Grok 4.5、Rivault、Illume Labs、Cynative、Webhound、localskills.sh、Leaping AI、Prefactor 之外的已覆盖同类、ChatBeacon AIX。

## 数据源与限制

- 数据源：`scripts/fetch_producthunt.py` 抓取 Product Hunt RSS（https://www.producthunt.com/feed ），本次 50 条，`fetched_at`=2026-07-28T23:03Z（窗口新鲜、未再滞后），RSS 未失败、未启用浏览器榜单备用。
- 本批约一半为 07-28 已展开的旧品，去重后新增合格品集中在 Agent 评估/记忆/垂直执行三线；票数、融资、排名、用户量均未编造。
- 核实：Prefactor（prefactor.tech）、Liminal（vireondynamics.com/liminal，非 liminal.ai）、Conduit（conduit.ai，YC）、Cekura（cekura.ai，原 Vocera，YC）、Superunit（superunit.com）、FlowTask（flowtask.work）、MCP-Billing（mcp-billing.com）、Shofo（shofo.ai，YC W2026）、Pinery（pinery.app）、SUB/WAVE（getsubwave.com + github perminder-klair/subwave）均经官网/GitHub 核实。Phantom（slug phantom-6）因同名众多、EasyCircuit 因未见其独立官网、qsa.sh/Cercle/Cardzen 因非 AI 核心，未进正文。
