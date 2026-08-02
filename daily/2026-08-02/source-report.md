# Product Hunt AI 雷达日报 · 2026-08-02

## 今日一句话结论

本轮 RSS 窗口与昨日（08-01）高度重叠，50 条候选里绝大多数是昨天已展开的产品；真正的新增高价值信号只有一个——**DeepSeek 把 V4-Flash 正式转正（0731），用「只改后训练、不动架构」的方式把小激活量模型的 agentic/coding 能力顶到超过自家 V4-Pro 预览版，价格却只有约三分之一**；2C 端今日无新达标产品。

## 板块 A：技术向 / B2B / 基础设施 AI

### 今天最值得关注的 1 个 A 类产品

**1. DeepSeek-V4-Flash-0731 —— 便宜三倍的「转正版」小型 agentic 模型**（评分 16/18）
- **定位**：DeepSeek 于 7/31 发布的 V4-Flash 官方版（取代 4 月预览版），API 模型 ID 仍为 `deepseek-v4-flash`，同步开放公测（deepseek.com｜HuggingFace `deepseek-ai/DeepSeek-V4-Flash-0731`）。
- **真实问题**：Agent 车队要跑大量并发的工具调用/代码循环，一个任务往往要几十上百次模型往返，最贵的不是峰值能力而是「单位 token 成本 + 并发上限」；旗舰模型太贵、并发太低，跑不起规模化 agent，逼着团队为省钱牺牲工具使用能力。
- **核心机制**：架构完全不变（284B 总参 / 13B 激活的 MoE、1M 上下文、384K 最大输出、带 speculative decoding 模块），全部增益来自一条针对 coding/agent/推理/工具调用重做的后训练管线；官方自评在 Terminal-Bench 2.1（82.7）、DeepSWE、Toolathlon 等 agentic 基准上以远小的激活量反超自家 V4-Pro 预览版；定价 $0.14/百万输入（未命中缓存）、$0.0028 命中、$0.28/百万输出，约为 V4-Pro 输出价的三分之一，并发上限 2500（Pro 的 5 倍）；原生支持 Responses API 与 Codex 集成，MIT 许可、无门禁可商用自托管。
- **为何关注**：它把「小激活量 MoE + 强后训练」这条路走成了可规模化 agent 的经济学答案——不改架构、不改 API、不改延迟画像，仅靠一次重做后训练就把同价档的工具使用能力顶上来，且价格/并发/许可都对 agent 平台友好，是「前沿竞争从峰值能力转向单位成本与吞吐」这条主线的又一记强信号；对已经在跑 Codex 类 agent 的团队，几乎是「换个模型 ID 就享受」的成本红利。
- **失败风险**：基准均为厂商在未公开 harness（DeepSeek Harness）上的自评，尚无第三方复现；宣布的高峰/低谷 2× 计价政策生效时间未定，长跑成本存在变数；同价位开源同侪（GLM/Kimi 等）追平后差异会被稀释。
- **混元启发**：给 API 加一个「小激活量 + 面向 agentic 的后训练」的廉价高并发档，比一味堆参数更贴合 agent 车队的真实成本结构；原生对齐 Responses API / Codex 这类 agent 调用协议，是降低迁移摩擦的关键。
- 链接：deepseek.com｜huggingface.co/deepseek-ai/DeepSeek-V4-Flash-0731

**延续 08-01（本轮窗口高度重叠，以下高价值 A 类为昨日已展开产品，今日不再重复评分/正文）**：agentOS（WASM 进程内 agent 沙箱，成本降两个数量级，17）、MiniMax H3（全模态统一生成，16）、Gemini Robotics 2（Agent 范式延伸进机器人整机控制，15）、Prelint（校验代码是否偏离产品规格，15）、Greplica（coding agent 自更新知识图谱记忆，15）、Task Monki（编排 coding agent 任务→PR，14）、Vela（AI 招聘协调员，14）、/mission·Medley（Claude Code 多 agent 任务树，14）、MemoryCustodian（repo 内 Markdown 记忆，13）、Halo by Scam AI（端侧实时深伪检测，13）、TraceLLM（生产 AI 可观测，12）。详见 `reports/2026-08-01.md`。

### A 类趋势信号

1. **前沿模型竞争继续从「峰值能力」转向「单位成本 + 并发 + agentic 后训练」**：DeepSeek 用一次纯后训练把小激活量模型顶到反超自家更大预览模型、价格却只有三分之一，延续了 07-28（Grok 4.5 / Claude Opus 5 / Kimi K3）以来「拼 token 效率而非拼参数」的主线；对 agent 车队而言，$/token 与并发上限比榜单分数更决定能否规模化，而「原生对齐 Responses API/Codex 协议」正在成为模型的一等能力——谁的调用摩擦更低，谁就更容易被 agent 平台默认接入。
2. **本轮窗口无新趋势成形**：除上条外，今日候选与 08-01 几近同一批，A 类的「coding agent 拥有整条流水线 + 自纠偏」「给 coding agent 造持久记忆」「模型拓宽模态与具身」三条趋势均为昨日已判定，今日未见新增独立证据，不重复计。

### 其他达到门槛的 A 类产品

| 产品 | 一句话定位 | 评分 | 链接 |
| --- | --- | --- | --- |
| Kopai | 无代码「构建/发布/售卖专业 AI agent」市场，含知识库、工具编排与 Stripe 按次计费 | 11/18 | usekopai.com |

## 板块 B：2C 消费向 AI

### 今天最值得关注的 B 类产品

**今日无高价值 2C 类新品。**

本轮候选里偏 2C 的 AI 产品（Pally「住在短信里的个人助理」、Bo AI「短信健康助理」、SoundGate Guitar「实时听你弹的吉他私教」）均为 08-01 已展开并评分的产品，本批 RSS 只是重复投递，无新增信息，不再重复正文（详见 `reports/2026-08-01.md`）。今日新出现的 2C 向候选（EssayKraft「Mac/iPad 原生写作 App」无法独立核实机制、Yamanote 3D 为非 AI 3D 体验）均未达硬门槛。故今日 2C 板块无新达标产品。

### B 类趋势信号

今日 2C 无新达标产品，未形成新的明确趋势信号；08-01 判定的「个人 AI 助理去 App 化、住进消息流」（Pally / Bo AI）与「学习类从生成内容转向实时反馈闭环」（SoundGate）两条信号本轮无新增证据。

### 其他达到门槛的 B 类产品

今日无。

## 我最想跟进的方向

- **技术向**：DeepSeek 这类「小激活量 + agentic 后训练 + 廉价高并发」组合若被第三方基准坐实，会直接改写 agent 车队的模型选型与成本模型，值得对照混元 API 的档位设计与 Responses/Codex 协议对齐做可迁移性评估。
- **2C**：继续观察「短信即入口」的个人助理（Pally / Bo AI）能否跨过新鲜期形成真实留存——这是消费级 AI 助理今年最关键的验证点，但需等新增样本，不在本轮重复展开。

## 已过滤产品摘要

- **AI 核心性存疑 / 混合人力（未达门槛）**：Tandem（AI-native 办公租赁，YC S24、$6.1M、500+ 公司，但 AI 为「co-pilot + 受薪人工经纪」的混合模式，AI 是否核心存疑，评 10<门槛）。
- **crowded / 单点，AI 非核心或同质拥挤**：NudgeForMe（扫已发邮件找漏跟进并起草，品类拥挤：PoliteNudge/Needle/nudge-agent）、Port22（手机上跑 Claude Code/Codex，被 Anthropic 原生 Remote Control 与一堆第三方壳挤压）、AgentMicro/AgentQuartz/tablo/SKI/Claude Code usage by LangWatch（coding agent 用量/菜单栏监控同质拥挤）、Laxis/Sorinai（会议记录拥挤）、Yap/Phantom Voice（本地听写单点）、Memmy Agent（跨 AI 记忆拥挤）、Caimera（时尚视觉，垂直未深核）、Mubert API（音乐生成 API，能力真实但本轮未深展开）、CraftStory（人物视频拥挤旧品）。
- **AI 但机制未独立核实 / 定位模糊**：EssayKraft（写作 App，无独立结果，AI 核心未核实）、Poth Labs、DepthData（AI 花费 SoR）、Screencap（工作流→训练数据）、Cleanlist AI（自然语言获客）、Customer.io Summer Release、AI Search Console、Denovo、NINA、Expert Chase、Focus Room（YouTube 学习壳，AI 摘要附加）、Premation（开源 AE 替代，AI 助手本地版尚未启用→AI 非核心）、Basedash Audit Logs（BI 审计日志，AI 非核心）、Virre（个人 CRM，AI 附加）。
- **非 AI / 工具类**：SyncStaq（Stripe→Google Sheets）、TerminalWidget、Terminal Candy、witr（进程溯源）、mectrics（Mac 状态栏）、docktor（Dock 挂件）、PRNotch（刘海显 PR）、Cursor Crane（键控 Mac）、Yamanote 3D（3D 体验，非 AI）。

## 数据源与限制

- 数据源：`scripts/fetch_producthunt.py` 抓取 Product Hunt RSS（`https://www.producthunt.com/feed`）→ `data/latest.json`，`fetched_at=2026-08-01T23:03Z`，共 50 条，内容窗口集中在 07-27～07-31；本次 RSS 正常，未启用浏览器榜单备用。
- 去重与本轮特点：本批候选与 `reports/2026-08-01.md` **高度重叠**（近乎重复投递），50 条中仅 DeepSeek-V4-Flash-0731、Kopai、Tandem、NudgeForMe、EssayKraft、Port22 等少数为新出现，其余均为 08-01 已覆盖或已过滤项。已对照现存历史报告去重（最新为 2026-08-01；07-30、07-31 缺失）。为避免重复，本报告不重述 08-01 已展开的产品，仅在「延续 08-01」处做指针式索引。
- 核实与口径：产品机制、定价、许可、融资/客户数等均来自官网/官方新闻/YC/HuggingFace/第三方聚合页交叉印证，未独立复现效果；DeepSeek 的 agentic 基准为厂商在未公开 harness 上的自评，非第三方复测，已在正文注明。票数、排名不编造。板块 A 正文 1 个 + 附录 1 个；板块 B 今日无新达标产品。
