# Product Hunt AI 雷达 · 2026-07-21

## 今日一句话结论

技术向今天有分量：**Thinking Machines（Mira Murati）放出首个开放权重模型 Inkling**——975B/41B 稀疏 MoE、原生 text/image/audio、1M 上下文、Apache 2.0，可直接在 Tinker 微调；同时一批「运行公司的自主 ops agent」按职能垂直落地——**Rex**（应收/O2C）、Backdrop、Nautis、Skippr，共同机制都是「读全量上下文→自主干可逆的活→关键动作先审批+留痕」。2C 端今日无新达标产品。

## 板块 A：技术向 / B2B / 基础设施 AI

### 今天最值得关注的 A 类产品

**1. Inkling — Thinking Machines 首个开放权重多模态模型（评分 17/18）**

- 定位：Thinking Machines Lab（前 OpenAI CTO Mira Murati 创立）发布的通用开放权重模型，「Open weights, ready to tinker」，权重已上 Hugging Face（thinkingmachines/Inkling），并可在自家微调平台 Tinker 上调用与微调。
- 真实问题：开源阵营在「可微调 + 原生多模态 + 长上下文」三者兼备的**基础底座**上一直缺位——要么强但闭源（GPT-5.6/Gemini/Claude），要么开源但多模态或微调链路不完整；下游团队想在自己领域做定制，缺一个「够全面、拿得到权重、还有成熟微调工具」的起点。
- 核心机制：66 层 decoder-only 稀疏 MoE（每 token 路由 6/256 专家 + 2 个常驻共享专家），**975B 总参、41B 激活**；原生多模态——图像/视频经分层 patch 编码、音频经离散 token 编码，投影到同一隐空间联合处理；注意力 local/global 混合，且用**相对位置编码而非 RoPE**；1M 上下文（Tinker 上 64K/256K），45T token 预训练，另发更轻的 Inkling-Small（12B 激活）。官方明说「不是当下最强」，定位「适合定制的开放底座」：SWE-bench Verified 77.6%（高于 Nemotron 3 的 71.9%）、VoiceBench 91.4%（Gemini 3.1 Pro 为 94.4%）。
- 为何关注：重要实验室对「开放权重」的一次实质加注——不是又一个 chat 模型，而是把「多模态 + 可控思考 + 一体化微调（Tinker Cookbook/Playground）」打包成可被下游改造的地基，代表关键生态变化。
- 失败风险：性能非 SOTA，若开源同侪（Nemotron/GLM/DeepSeek/Kimi）同价位追平，「可微调多模态」的差异会被稀释；975B 总参对自托管推理仍是高门槛，实际使用高度依赖 Tinker 及第三方推理商生态。
- 对混元 API/Agent 启发：「开放底座 + 官方微调平台 + Cookbook/Playground」是把开源模型转成生态的完整打法；原生把音频/图像编码进同一隐空间、「可控思考 effort」的产品化，都值得混元多模态与推理档位参考。
- 链接：thinkingmachines.ai/news/introducing-inkling（huggingface.co/thinkingmachines/Inkling；PH：/products/tinker-2）

**2. Rex — 跑「订单到收款」的自主应收 agent（评分 15/18）**

- 定位：面向企业 order-to-cash（O2C）的 AI 运营伙伴（rex.inc，YC）；由 Sequence（a16z）原班团队创立，是 Vercel AI Accelerator 2,500 支队伍里的第 1 名。
- 真实问题：O2C 是一个约 600 亿美元靠外包堆人力的职能——催收、对账、争议，每个客户上下文都不同、异常不守规则、下一步常埋在邮件/门户/某人记忆里，传统 RPA 的固定脚本啃不动。
- 核心机制：多个专职 agent（催收/现金匹配/争议）持续跑在整个应收账簿上——读每个账户与来往邮件的状态、决定下一步、跨现有 ERP/门户/邮件去执行，按付款历史调整催收口吻，收到款自动做（含部分/短付的）现金匹配，遇策略外情形（信用冻结、分期、法务威胁）带着上下文升级给人；衡量标准是**回收现金与 DSO 下降**，不是「生成了多少建议」。
- 为何关注：它是「垂直 ops agent」里少见地**有可核实落地**的一个——官方称已在 pre-IPO 科技公司上线、管理逾 5 亿美元 F100 客户应收、把跟进周期从数周压到数小时（Synthesia 为其客户）；代表 agent 从「dashboard 化」走向「对业务结果负责」。
- 失败风险：接入真实 ERP/门户/资金动作的可靠性与合规门槛极高，一次错误催收或错配就损伤客户关系；财务强监管、低容错，「自主执行」的信任要一格一格挣。
- 对混元 API/Agent 启发：把「读全量上下文→自主执行→按可逆性/金额分级升级给人」做成可审计闭环，是垂直 Agent 接入真实业务系统的范式样本，对混元做行业 Agent 极具迁移价值。
- 链接：rex.inc（ycombinator.com/companies/rex-inc；PH：/products/rex-7）

**3. Replay QA — AI 造的 app，由自主 QA agent 来测（评分 14/18）**

- 定位：Replay.io（2021 年成立、SF）从「时间旅行调试器」转出的自主 QA 产品，「AI wrote the app. Replay QA finds what broke.」——给个 URL 或接上 GitHub repo 即可。
- 真实问题：AI 编码把开发周期从数周压到数小时，一个人一天就能上线一个 app，但**测试方式没变**——仍要工程师写用例、QA 跑、有人 triage；结果 AI 造的 app 普遍没测试覆盖，第一份「诚实测试」来自用户抱怨。
- 核心机制：像真实用户一样自主探索 app（点流程、填表单、走结账），自动写自己的 Playwright 用例并在真实浏览器跑；底层用**确定性录制的完整浏览器运行时**（DOM 变更、网络时序、状态与重渲染链、逐帧 JS 调用），交付的不是截图而是「可回放到出错那一刻」的根因 + 建议修复并贴上 PR；并经 Replay MCP 把这份运行时上下文喂给 Claude Code/Codex/Cursor，让 coding agent 有据可修而非空想。
- 为何关注：它与 Inkling 这类 agentic-coding 能力正好构成闭环——「AI 写代码」变廉价后，「AI 测代码 / 供运行时可见性」成为新瓶颈；对开放构建者免费，区别于要人力维护用例的 QA Wolf、只跑既有用例的 BrowserStack。
- 失败风险：自主探索的覆盖度与「误报/漏报」是硬门槛，复杂鉴权/有状态流程易探不全；随着 coding agent 自带更强测试能力，独立 QA 层价值可能被平台吸收。
- 对混元 API/Agent 启发：「把确定性运行时录制经 MCP 作为 agent 的调试上下文源」是可直接迁移的原语——给 Coding Agent 补上「看得见运行时」这一课。
- 链接：replay.io（replay.io/how-it-works；PH：/products/replayio）

### A 类趋势信号

1. **「运行公司的自主 ops agent」按职能垂直落地，「审批 + 审计」成核心机制**：Rex（应收/O2C）、Backdrop、Nautis、Skippr，叠加前几日 YAGNI/Pazi/Verse——多产品同向；共同套路是「读全量上下文→自主干可逆的活→关键动作先审批 + 留痕」，Nautis、Lunen 更把「allow reads / approve writes + 审计日志」做成产品主轴。明确趋势。
2. **开放权重底座再进一位**：Inkling 是 Thinking Machines 首个开放权重模型（975B/41B、原生多模态、Apache 2.0、配套 Tinker 微调），代表重要实验室/生态的结构性动作。
3. **AI 写代码 → AI 测代码 / 供运行时上下文**：Replay QA（自主 QA + 经 MCP 把浏览器运行时喂给 coding agent）与 Inkling 的 agentic-coding 能力从两端指向同一闭环——AI 编码变廉价后，测试与运行时可见性成为新瓶颈。

### 其他达到门槛的 A 类产品

| 产品 | 一句话 | 评分 | 链接 |
|---|---|---|---|
| Skippr AI | 「嵌进产品里的实时 AI 员工」：SDK 一行接入的多模态语音+看屏 agent，为每个用户做 onboarding/演示/答疑，并**经你的 API 或 MCP 直接操作产品**（而非只点 UI）——把「agent 作为产品界面」做成平台 | 14 | skippr.ai |
| Backdrop | YC 出品，给团队两名云端 AI coworker：Alex（PM/运营）+ Sam（工程，写码/审 PR），接 Slack/Notion/Linear/GitHub 并维护**组织级共享记忆**，主打「AI 对话正变成新知识孤岛」 | 13 | backdropagent.com |
| Nautis | 「AI-native 创业公司操作系统」（印度）：一个读遍融资/财务/CRM/招聘/文档的 AI 伙伴，跨模块做链式动作（起草邮件、建 data room、更新 CRM），共享智能层 + **每步须你批准** | 13 | getnautis.com |
| Creed | 「给所有 agent 的个人上下文文件」（开源）：一份 10 段 Markdown 画像，任意 agent 经 MCP 回答前先读，学到新事实以 diff 提议、按分区权限审批合入，含 Company 团队版——延续记忆/上下文层 | 13 | creed.md |
| Lunen | 治理优先的 agent 构建器（REDspace）：自然语言描述→自动生成带命名工具/受限数据的结构化执行计划；每个 MCP 工具都是策略开关（读放行、写需审批），用户与 agent 动作汇入同一审计日志 | 13 | lunen.ai |
| Deck | 「有自己收件箱的 AI 助理」：给助理独立邮箱地址，CC 进线程即工作，安静读、只在需要你时私下提醒，起草跟进、做晨报——单点邮件助理、赛道拥挤 | 11 | hellodeck.ai |

## 板块 B：2C 消费向 AI

### 今天最值得关注的 B 类产品

今日无高价值 2C 类新品（不凑数）。新入榜疑似消费向产品经核实 AI 均非核心或属旧品重现：**Scriptyard**（可视化故事开发工作台）是本地无登录的无限画布 + 卡片编排，导出 Markdown/Fountain/Final Draft，**全程未见 AI 为核心机制**；**Kogvio**（不离开页面就理解一切）是浏览器 AI 侧栏划词问答，属 Bravo 一类拥挤单点，未过门槛；**Backbeat Forge** 是鼓点转谱单点工具；Mainichi/WX/Paradigm 则为旧品重现，不重复。

### B 类趋势信号

今日未形成明确 2C 趋势信号（无新达标产品）。

### 其他达到门槛的 B 类产品

今日无其他达到门槛的 2C 新品。

## 我最想跟进的方向

- 技术向：**自主 ops agent 的「治理即产品」机制**——Rex/Nautis/Lunen/Backdrop（+ YAGNI/Pazi/Verse）都在把「按可逆性/金额分级：读可自动、写要审批、全程审计留痕」做成企业级落地的信任骨架，对混元做行业 Agent 平台最有迁移价值。
- 2C：本日无新标的，不强行给结论。

## 已过滤产品摘要

- **非 AI / AI 非核心（今日新入榜）**：Scriptyard（本地故事画布，非 AI）、Kogvio（浏览器划词问答，拥挤单点）、Backbeat Forge（鼓点转谱单点）、CaptureKit（自动整理截图）、Free AI Tools（免登录小工具聚合，套壳）、Autoplot（autoplot.ai 科研数据分析 IDE，垂直极窄且与老牌非 AI 的 autoplot.org 同名易混）、Reignat/Kobbe（隐私分析，AI 非核心）、NeuroVidz（广告神经反应预测，B2B 营销单点）。
- **营销 / 增长 / 广告类（降权）**：Fuzzy AI、LnkFlow、Loova Ads Studio、LayerProof Mylar（同名产品族 06-20 已附录）、OpenSEO（07-20 已附录）。
- **Crypto / Web3 概念（降权）**：BlockscopeChat（加密调查 agent）。
- **已在近日报告覆盖（不重复展开）**：Kimi K3、In Parallel、Unabyss、Paradigm、Clark、OpenMarkdown、ZooData、Rewisp、BaseRT、Basedash Suggestions、Aye、Pebbles Ai、The Eureka Database、Mainichi、WX、Acebuilder、DocuSmart AI、LiveDemo、Mirage、Spycost、Detourmap（分别为此前已展开 / 已过滤 / 07-20 已处理）。
- **非 AI 碎片/工具类**：PixyCAD、Pocket Screen、Scribble Party、Timely、Yapper Leaderboard。

## 数据源与限制

- 主数据源：Product Hunt RSS（`https://www.producthunt.com/feed`），抓取 2026-07-20 23:00 UTC，共 50 条候选；RSS 正常，未启用浏览器榜单备用。
- 交叉核实：各产品官网 / 博客 / 模型卡 / GitHub / YC 页——Inkling 参考 thinkingmachines.ai 公告与模型卡、huggingface.co/thinkingmachines/Inkling 及 VentureBeat；Rex 参考 rex.inc 与 YC 页；Replay QA 参考 replay.io；Skippr/Backdrop/Nautis/Creed/Lunen/Deck 参考各自官网（含开源库 connorhpbrn/creed）。
- 事实口径：未引用未经核实的融资、用户量、票数、排名或团队背景；Inkling 的架构与基准（975B/41B、SWE-bench 77.6%、VoiceBench 91.4%）为官方模型卡/公告口径，未独立复测；Rex「逾 5 亿美元应收 / F100 客户 / 数周→数小时」为其官网与 YC 页自述，非独立核实。
- 同名/歧义提示：PH 上「Inkling」对应 slug `tinker-2`，指 Thinking Machines 的开放权重模型（非同名教育平台）；「Autoplot」存在老牌非 AI 的 autoplot.org 与新 AI 版 autoplot.ai 两个同名品，本报告仅就后者判定且因品类极窄不列正文；「Deck」指 hellodeck.ai 的邮件助理（非 DeckAssistant/DeckAI）。
- 窗口说明：本批与 2026-07-18/19/20 报告高度重叠，Kimi K3、记忆/上下文层、OpenMarkdown、ZooData、Rewisp/BaseRT 等多为近几日已展开项，本报告只就**新入榜且达标**者展开，其余按「已覆盖/已过滤」处理。
