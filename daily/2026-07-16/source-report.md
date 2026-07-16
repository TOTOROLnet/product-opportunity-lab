# Product Hunt AI 雷达 · 2026-07-16

## 今日一句话结论

技术向今天是"少见的富矿"：一条主线是"AI 员工/团队从编排框架转向治理机制"（YAGNI 把管人的一套 Number/审批/逐级放权搬给 agent），另一条是"文档/画布正成为 agent 可直接写入的一等界面"（Tiptap AI Toolkit、Campus）；2C 端偏弱，仅 V2Fun 这类"端到端生成式 3D 角色创作"一条够格，不成趋势。

## 板块 A：技术向 / B2B / 基础设施 AI

### 今天最值得关注的 1-3 个 A 类产品

**1. YAGNI — 像管人一样管理的"主动式 agent 团队"**

- **定位**：把"多智能体"重述成"你像管理下属一样管理的 agent 团队（Team）"，每个 Team 认领一块真实业务、只背一个可量化的 Number。
- **真实问题**："谁都能雇一个 agent，但没人管得住 agent"——企业不敢把真实业务交给 agent，缺的不是能力，而是授权、审批、追责和渐进信任的机制。
- **核心机制**：用管人的语言定义 Team：自然语言写 Responsibilities，背一个被考核的 Number，签有截止日的 Commitments；它主动提案、你点头才动。可逆的日常自动执行并留下来自源头的 Receipt（回信已收到、会已进日历、款已入账），"有后果"的动作则挂起成一个 Decision 等你拍板（Shipped is not done, Verified is）。信任逐条解锁：每个 Team 从 Training 起步，靠被采纳的提案升到 Supervised，再按 Playbook 规则逐条 Promotion 到 Autonomous，权限有界、全程留痕。
- **为何关注**：它把竞争焦点从"能编排多少 agent"移到"如何治理 agent 劳动力"，与昨日 ClawTeams / Pazi、开源 gruAI / Padiso 同向——这是 agent 真正进企业最结构性、也最缺的一层。
- **失败风险**：管理仪式感可能重于实效；Number / Receipt 的自动核验若做不实，就退化成又一个待办面板；信任建立慢，客户耐心是门槛。
- **对混元 API/Agent 启发**："分级授权 + 可逆自动执行 / 有后果需审批 + 按规则逐条放权 + 来自源头的凭证"，是 Agent 平台补齐 human-in-the-loop 的可抄模板；把"信任"做成随 track record 增长的产品状态，值得借鉴。
- **评分 15/18**（相关 5 / 机制 5 / 启发 4 / 信号 1）。链接：yagni.app

**2. Tiptap AI Toolkit — 让 AI 可靠地"直接在富文本文档里"读写**

- **定位**：老牌开源富文本编辑器 Tiptap 推出的付费扩展，让你现有的 AI/agent 直接、可靠地读写文档，而不是再套一个聊天框；现已 production ready。
- **真实问题**：官方原话——"做聊天机器人很容易，难的是让 AI 在富文本里实时改动，不弄坏表格、不在并发编辑时崩"；用户被迫把内容复制进 ChatGPT/Claude 改完再贴回来。
- **核心机制**：模型 / 框架无关，提供 Vercel AI SDK、LangChain.js、OpenAI、Anthropic、Mastra 等格式的工具定义（tiptapEdit / proofread 等），把你的模型接到 Tiptap 文档层；支持流式插入（首 token 即显）、可审阅 / 可追踪改动、选区与 schema 感知、跨多文档、评论读写；自研 Tiptap Shorthand 编码把 token 成本降最多 80%；可云端 / 私有 / 纯客户端部署。
- **为何关注**：它把"让 AI 可靠地在结构化文档里工作"做成一层通用基础设施，且来自被广泛使用的编辑器生态；与今日 Campus、Mantle Clerk 同指"文档 / 画布成为 agent 可直接写入的一等界面"。
- **失败风险**：依附 Tiptap 生态与订阅；"AI 直接改文档"的信任与回滚体验是硬门槛；Notion / Google Docs 等自带同类能力后会挤压第三方。
- **对混元 API/Agent 启发**："把文档当可被 agent 读写的结构化界面 + 一套跨 SDK 的工具定义 + token 高效编码 + 审阅门"，是构建 AI 写作 / 编辑类产品的范式；review-before-apply 应设为默认。
- **评分 15/18**（相关 5 / 机制 4 / 启发 4 / 信号 2）。链接：tiptap.dev/ai-toolkit

### A 类趋势信号

1. **"AI 员工 / 团队"从"编排框架"转向"管理 / 治理机制"**：YAGNI（Number / Commitments / Receipt / Decision + 按规则逐条放权）叠加昨日 ClawTeams / Pazi、开源 gruAI / Padiso，2+ 产品同向且是结构性变化——竞争焦点从"能编排多少 agent"转到"如何授权、审批、追责、渐进放权"。
2. **Claude 生态外溢：Skill 即产品 + Claude Code 协作工具**：Crustdata Recruiter（把招聘判断沉淀成 6 个 Claude Skill + 自有数据 MCP）、ccshare（Claude Code 会话分享 / 多人）叠加昨日 Claude Overlay / Clui / ClaudeHUD，Claude 的 Skills / MCP / CLI 正成为第三方"产品化"的底座。
3. **文档 / 画布成为 Agent 可直接写入的一等界面**：Tiptap AI Toolkit（结构化文档内可靠编辑）+ Campus（无限画布上 human 与 agent 协作、agent 可操作画布）+ Mantle Clerk（在 cap table 平台里直接执行操作），交互从"聊天框"移向"可被 agent 读写的工作面"。

### 其他达到门槛的 A 类产品

| 产品 | 链接 | 一句话 | 评分 |
|---|---|---|---|
| Crustdata Recruiter | crustdata.com/solutions/claude-for-recruiting | 把招聘判断编码成 6 个 Claude Skill + 自有数据 MCP（mcp.crustdata.com，8 亿+档案）：读 JD 建打分 rubric→检索打分候选（附一句理由）→按反馈迭代→补邮箱电话→写回 ATS 并发外联，跨会话记忆；Skill+数据护城河的样板 | 15 |
| Campus | huntscreens.com/products/campus | FlutterFlow 团队做的 macOS 无限画布工作台：终端（常驻 PTY）、浏览器、笔记、文件、Claude/Codex 都是画布上的 tile，CLI 让 agent 自己移动 tile、输入提示、点 webview；human 与 agent 共处同一空间上下文，本地优先 | 14 |
| Mantle Clerk | withmantle.com/equity/mantle-clerk-early-access | cap table 的"常驻股权专家"：读你上传的注册证书 / SAFE / offer / 董事会决议并抽取入表、每个数值回链原文；懂建表的先后次序，会在"股类还没建就想做转换"这类无效操作前拦你，并直接在平台里起草授予 / 处理转换 / 更新章程 | 14 |
| Velo 3.0 | usevelo.ai | "面向工作的 AI 视频基础设施"：把公司上下文（文档 / 截图 / 通话记录 / KB）生成结构化视频（演示 / 培训 / SOP / 支持），agent 浏览器录制并克隆音色配音，视频↔文档双向；提供 API/SDK 让开发者在自家产品里按需 / 批量生成视频 | 13 |

## 板块 B：2C 消费向 AI

### 今天最值得关注的 1-3 个 B 类产品

**1. V2Fun — 浏览器里的端到端"生成式 3D 角色"创作平台**

- **定位**：文本 / 图片就能生成、贴图、绑骨、动画的一站式 3D 角色创作平台，全程在浏览器云端。
- **目标用户**：不会建模的独立游戏开发者、内容创作者、想快速产出 3D 资产的初学者。
- **痛点**：传统 3D 角色制作（建模、UV、贴图、绑骨、动捕）门槛高、耗时、要贵设备，个人创作者几乎做不动。
- **机制 / 交互**：文本 / 图片 → 3D 网格（Diffusion+NeRF、干净拓扑）→ 自动 PBR 8K 贴图 → 自动绑骨与蒙皮 → 从普通视频提取动作做 AI 动捕（无需动捕服）→ 文本驱动动画 / 内置动作库；一键串起整链、无需导入导出来回切，导出 FBX/GLB 直进 Unity/Blender。
- **分发 / 留存假设**：创作者按订阅 / 额度付费；一键出"可用资产"是留存钩子；差异在"生成 + 贴图 + 绑定 + 视频动捕 + 动画"整链打通，而非单点生成。
- **失败风险**：赛道拥挤（Meshy、Tripo、Rodin、混元 3D 等），单点生成质量易被追平；游戏级资产对拓扑 / 绑定质量要求高，从"能用"到"好用"差距大。
- **评分 13/18**（痛点 4 / 新意 4 / 机会 3 / 信号 2）。链接：v2fun.ai ；producthunt.com/products/v2fun

### B 类趋势信号

今日 2C 端未形成明确趋势信号：合格新品仅 V2Fun 一条（端到端生成式 3D 角色），不足以构成"2+ 产品同向"。这条"生成式 3D / 角色创作平台化"的线延续 Meshy / Tripo / 混元 3D 生态，可继续观察是否成势。

### 其他达到门槛的 B 类产品

今日无其他达到门槛的 B 类新品。

## 我最想跟进的方向

- **技术向**：agent 劳动力的"治理层"（YAGNI 式的 Number / Commitment / Receipt / Decision + 逐规则放权）。它比"能编排多少 agent"更决定 agent 能否真正进企业，是 Agent 平台最该补的一层。
- **2C**：生成式 3D / 角色创作的"端到端平台化"（V2Fun 式：生成→贴图→绑定→视频动捕→动画一条龙）。关注它能否把门槛降到让普通创作者产出可直接用于游戏 / 短视频的资产。

## 已过滤产品摘要

- **nudge 2.0**：AI 周计划排程，但核心是贪心排程算法（50 任务 <500ms），AI 主要做 Markdown 解析 / 导入，非核心 → 降权过滤。
- **MentalHappy 3.0**：团体治疗 / 支持小组运营平台（YC、HIPAA），AI 仅作健康评估 / 风险识别辅助，本体非 AI 核心 → 过滤。
- **QuickQuill / RecordMeeting / EQK**：本地会议纪要 / 通话转写 / 动态 AI EQ，AI 尚属核心但均为拥挤单点品类，未达门槛。
- **Review by Eddie AI**：视频带时间戳的团队 + AI 反馈，偏协作单点，未达门槛。
- **Agently**：宣称"整套技术栈自动运行"的自治运维 agent，本批未能核实具体机制（信息不足 / 同名拥挤），存疑不展开。
- **广告 / 营销素材生成降权**：Branda、Goose Ads Remixer、Flodesk Studio。
- **非 AI 或 AI 非核心的工具 / 消费类**：Keepresso、Jam-Pod、DeskMat、Copresent、Flyout、Portero、PgDog、Altersend、TailMux、Marked QL、Mojave Paint、Animos、Breva、Sales Studio、Trump Accounts、Knockoff、CodeNearby（开发者 Tinder，AI 非核心）。
- **往期已展开 / 已过滤、本期不重复**：Claude Overlay、Agentcard、ClawTeams、Pazi、BugShot、VocalVia、NoMac、Simba、Playground/Nyx、Sourclip、AutoShelf、ClipFlow、loopclub、UnitPay、IFTTT（本批 RSS 约一半为往期候选）。

## 数据源与限制

- **数据源**：Product Hunt RSS（producthunt.com/feed），经 `scripts/fetch_producthunt.py` 抓取 50 条写入 `data/latest.json`，fetched_at 2026-07-15T23:01Z。RSS 未失败，未启用浏览器榜单备用。
- **核实方式**：PH 产品页对脚本与直连仍易 403，改用各产品官网、GitHub、YC、huntscreens 等交叉核实官方链接与机制。
- **局限**：本批约一半为往期候选（Claude Overlay / Agentcard / ClawTeams / Pazi 等昨日已展开，不重复）；ccshare 存在"会话分享 vs 实时多人"及同名歧义，Agently 机制未能核实，均按存疑处理；未引用票数、排名、融资、用户量等未经证实数据。报告日期按北京时间（2026-07-16）。
