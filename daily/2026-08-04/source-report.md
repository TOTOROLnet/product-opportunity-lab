# Product Hunt AI 雷达日报 · 2026-08-04

## 今日一句话结论

今天头条是 Qwen3.8-Max——阿里首个开放权重的 Max 级模型（2.4T/95B 激活、1M 上下文、兼容 OpenAI 与 Anthropic 双协议、内测 16 天无人干预自建 CLI），把前沿竞争推向「开源权重 + 长程自主」；同时「Agent 运行时」正被拆成各种形态分别产品化——AgentSky 做托管云端常驻、Open Minis 把带 Linux 沙箱的 Agent 塞进手机本地；2C 端 CoachAI 把 iPhone 摄像头变成实时纠动作的健身教练。

## 板块 A：技术向 / B2B / 基础设施 AI

### 今天最值得关注的 1-3 个 A 类产品

**1. Qwen3.8-Max —— 阿里首个开放权重的 Max 级前沿模型**（评分 17/18）

- **定位**：阿里 Qwen 家族迄今最强模型，主打编码、真实工作与长程任务（Alibaba Cloud Model Studio，模型 ID `qwen3.8-max`）。
- **真实问题**：企业既想要前沿能力，又要能自托管 / 控成本、直接插进现有 Agent 工具链；且「模型能否真正端到端跑完复杂任务、交出可用成果」尚缺可信证据。
- **核心机制**：2.4 万亿参数 MoE（约 95B 激活）、100 万 token 上下文、多模态；**首次开放 Max 级权重**（下周上 HuggingFace / ModelScope）；同时提供 OpenAI Chat Completions 与 Anthropic 两套 API 协议，直接接 Claude Code / Codex / Qoder / Qwen Code / OpenClaw；`reasoning_effort`（xhigh/medium/low）调节推理深度与成本。官方演示中它以「issue 状态机 + 调度器 + 监控 + watchdog」组成执行循环，16 天无人干预自建出命令行工具 oh-my-cli（265 commits、127 PR、151 issues 全自动）。
- **为何关注**：这是中国厂商把「前沿能力 + 开放权重 + 长程自主」一次凑齐的信号，配套同日公测的 QwenWork（对标 ChatGPT Work / Kimi Work）说明它在做「模型 + 工作平台」组合拳，而非单点刷分。
- **失败风险**：多数编码基准是在 Claude Code harness 里跑的厂商自评、无第三方复现，真实 harness 表现可能缩水；2.4T 权重的自托管门槛极高，「开放」对多数团队更多是象征意义；长程自主案例是精选 demo。
- **对混元 API/Agent 启发**：双协议（OpenAI + Anthropic）兼容让模型「零改造」接入主流 Agent harness，是降低迁移摩擦的关键工程动作；把 `reasoning_effort` 这类「深度 / 成本」旋钮做成一等 API 参数，比只给一个模型名更适合 Agent 场景的成本调度。
- **链接**：alibabacloud.com/blog/qwen3-8-max-a-new-bar-for-coding-and-cowork_603421

**2. AgentSky —— 任意 harness / 任意模型的托管常驻 Agent 云**（评分 14/18）

- **定位**：Agent-as-a-Service，一键把常驻 Agent 部署到云端（huntscreens.com/products/agentsky）。
- **真实问题**：本地跑的 Agent 一关终端就断、状态丢失、换模型 / 换 harness 要重来；把长时任务托管到云上又要自己搭基础设施。
- **核心机制**：一键启动 always-on 云端 Agent；**支持任意 harness 与任意 LLM，且可在任务中途热切换模型 / 架构而不丢历史与上下文**；全渠道触达同一个 Agent（WhatsApp / iMessage / Telegram / Slack / Web / A2A / CLI，状态跨渠道跟随）；一条命令把本地 Agent「克隆」到云端（指令 / 模型 / MCP server 一致、密钥留本地）；持久运行时 + 托管恢复 / 备份 + CLI/REST API。
- **为何关注**：它把「运行时」从本地进程升级为可编程的托管资产，「中途换模型不丢上下文」「本地→云克隆」是两个务实的迁移设计，切中长时 Agent 的运维痛点。
- **失败风险**：Agent 托管正在变红海，差异化靠体验而非壁垒；早期团队、无可观察 traction；跨渠道状态一致性与安全边界是硬骨头。
- **对混元 API/Agent 启发**：「任务中途热切换模型 / harness 而保留状态」值得作为 Agent 平台的一等能力；「本地→云一键克隆、密钥不出本地」是兼顾开发者体验与安全的好范式。
- **链接**：huntscreens.com/products/agentsky

**3. Open Minis —— 手机本地跑的开源 Agent，自带 Linux 沙箱**（评分 14/18）

- **定位**：免费开源（GPLv3）的端侧 AI Agent，iOS / Android / Apple 芯片 Mac / Vision Pro（openminis.app）。
- **真实问题**：手机上的 AI 大多只是「把提示发给云端、返回文字」，既不能真正执行计算 / 文件 / 系统操作，又要把密钥和隐私数据交给第三方。
- **核心机制**：**在设备本地跑一个沙箱化的 Alpine Linux 环境**，给模型一台「真电脑」——可 `apk` 装包、跑 Python、改文件、用命令行，离线可用；自带 API key 接 Claude/GPT/Gemini/DeepSeek/Kimi/OpenRouter 等（按会话切换）；把原生框架（HealthKit / 日历 / 提醒 / HomeKit / 照片 / Vision OCR / 语音）作为工具；内置浏览器自动化、Skills 体系、跨会话持久记忆与多 workspace。定位为 Claude Cowork / OpenClaw 的移动端本地替代。
- **为何关注**：它把「给 Agent 一台真电脑」这件事下沉到手机、且 local-first 开源——在端侧算力足够跑轻量 harness 的当下，代表 Agent 运行时向消费级硬件的扩散。
- **失败风险**：端侧沙箱 + 大模型对电量 / 内存 / 发热是硬约束；BYO-key 抬高普通用户门槛；模型推理仍走云端，「本地」主要是运行时与数据层；安全上把系统权限开给 Agent 需要极强的审批设计。
- **对混元 API/Agent 启发**：「Agent = 模型 + 一台可执行的沙箱电脑」这套抽象在移动端同样成立；把原生系统能力（健康 / 日历 / 智能家居）以权限受控的工具暴露给 Agent，是端侧个人 Agent 的可迁移配方。
- **链接**：openminis.app（github Da-AiXZ/OpenMinis）

### A 类趋势信号

1. **「Agent 运行时」被拆成各种形态分别产品化**：AgentSky 做托管云端常驻、Open Minis 做端侧本地 Linux 沙箱、Murmell 做云端多 Agent 协作工作台，延续 08-01 的 agentOS（进程内 WASM 运行时）——同一件事（给 Agent 一个可执行、可持久、可恢复的环境）正在云 / 端 / 协作三个方向同时长出产品。
2. **前沿竞争推向「开放权重 + 长程自主」**：Qwen3.8-Max 首次开放 Max 级权重、双协议兼容、主打 16 天级自主执行，是继 DeepSeek-V4-Flash 之后中国厂商又一次把「能力 + 开放 + 长程」打包对标西方前沿。
3. **多编码 Agent 的协作与记忆自成一类**：Murmell（多 Agent 共编 + 文件锁）、mpai（让现有会话多人化）、Inventory（跨 Agent 对话检索）指向同一诉求——当开发者同时用多个编码 Agent 时，协作、并发控制与历史检索本身成了新品类。

### 其他达到门槛的 A 类产品

| 产品 | 一句话定位 | 评分 | 链接 |
| --- | --- | --- | --- |
| Murmell | 云端 CDE + 多 Agent 编排：每项目独立常驻 VM（关浏览器仍在跑）、同步私有 GitHub、协作画布把 Agent 显示成「可见队友」，用文件级锁避免多 Agent 改同一文件冲突 | 14/18 | productcool.com/product/murmell |
| Inventory | 本地优先的跨 Agent 对话搜索：只读解析 Cursor/Claude Code/Zed/Codex 本地会话，端侧 embedding 做语义 + 关键词混合检索，找回散落各工具的历史方案 | 12/18 | productcool.com/product/inventory-2 |
| mpai | 让现有 Codex/Claude Code 会话「多人化」：发现本地会话、队友经 Tailscale 私网加入、带身份注入 prompt，宿主控制共享范围（macOS alpha，赛道拥挤） | 11/18 | productcool.com/product/mpai |

## 板块 B：2C 消费向 AI

### 今天最值得关注的 1-3 个 B 类产品

**1. CoachAI —— 用 iPhone 摄像头实时数次数、纠动作的健身教练**（评分 13/18）

- **定位**：iOS 端侧计算机视觉健身应用，把手机摄像头变成私人教练的眼睛（coachai.tech）。
- **目标用户**：想在家 / 健身房自练、又请不起私教、担心动作错误受伤或练不到位的普通健身者与新手。
- **痛点**：跟着视频练没人纠错，次数靠自己数容易分心；可穿戴设备只给心率步数，看不见「你这一下姿势对不对」。
- **机制 / 交互**：把后置摄像头当动作传感器，**端侧 CV 追踪全身关节，自动数每一次 rep、并把关节角度 / 活动范围 / 节奏对照标准动作实时纠正**（像教练在旁边喊「再沉一点」）；每次训练回灌，计划按你实际做到的水平自适应；无需任何穿戴设备；视频只在本机处理、不上传，隐私友好。
- **分发 / 留存假设**：「架好手机就能练」的零门槛适合应用商店自然增长与短视频演示；留存来自可感知的进步曲线（次数 / 姿势 / 灵活度周环比）与自适应计划；订阅制。
- **失败风险**：同类正在变挤（如 trainerai 几乎同款：端侧姿态 + Gemini 分析），CV 纠错的准确度与体感是生死线；健身应用留存天然差，热情期过后易流失；复杂 / 器械动作的识别鲁棒性存疑。
- **评分**：13/18（痛点 4 / 新意 4 / 2C 机会 3 / 信号 2）
- **链接**：coachai.tech

### B 类趋势信号

1. **手机摄像头 + 端侧 CV 成为消费级 AI 的「实时反馈」入口**：CoachAI 把「看动作、数次数、纠姿势」放到端侧实时闭环，与 08-01 的 SoundGate（听琴声实时纠错）同向——2C AI 的价值正从「生成内容」转向「用摄像头 / 麦克风做实时反馈」，且强调本地处理保隐私。

### 其他达到门槛的 B 类产品

| 产品 | 一句话定位 | 评分 | 链接 |
| --- | --- | --- | --- |
| Hand Wave | 端侧实时把手语（ASL）转成文字 + 语音，跑在 Ray-Ban Meta 智能眼镜 / iOS / 网页；轻量神经网络、离线、第一人称采集（早期，个人开发者，TestFlight，Meta SDK 暂挡 App Store） | 11/18 | productcool.com/product/hand-wave |

## 我最想跟进的方向

- **技术向**：任务中途「热切换模型 / harness 而不丢状态」+「本地→云一键克隆、密钥不出本地」的托管 Agent 运行时（AgentSky 路线）——它切中长时 Agent 的真实运维痛点，且这两个机制天然可迁移进任何 Agent 平台。
- **2C**：手机摄像头 + 端侧 CV 的实时反馈型应用（CoachAI）——这类产品的生死取决于「反馈准不准、体感即不即时」，本地处理还顺带解决了隐私顾虑，是消费 AI 从「生成」走向「陪练」的现实入口。

## 已过滤产品摘要

- **整体延续**：今日榜单又是 08-01/08-02/08-03 窗口的近乎整体重复上架，绝大多数高分项（DeepSeek-V4-Flash、Gemini Robotics 2、Kopai、TraceLLM、Tandem、Bolcho、UniwebPay、Zinley 等）已在前几日报道，不再展开。
- **The Garden of Mind**：把潜意识做成「每天浇水」的 3D 花园，偏正念 / 日记游戏化，AI 是否为核心无法核实（同名多个项目），过滤。
- **gesture.live**：网页摄像头手势（MediaPipe）弹电子乐，赛道极度拥挤（Maestrum / Aeria / Air DJ 等同款），属一次性 CV 玩法、无留存，过滤。
- **Snapdown**：屏幕转 Markdown 的端侧 OCR 单点，拥挤（OpenMarkdown 等），过滤。
- **其余**：Appllama（App 截图灵感库）、yapyap / Zen Whisper（本地听写单点）、Ctruh Studio（无代码 3D/XR，AI 非核心）、claudemon（等 Claude Code 时刷宝可梦的噱头）、Airtop for Google Ads（营销自动化）、Plethora（互动内容平台，AI 非核心）、MascotAI（吉祥物生成单点）、PassiveShorts（faceless 视频生成，拥挤）、MacDupl / Doxy（非 AI 工具）等为非 AI 或 AI-additive 单点，过滤。

## 数据源与限制

- **数据源**：Product Hunt 官方 RSS（`scripts/fetch_producthunt.py`，抓取 50 条，`fetched_at` 2026-08-03T23:03Z），RSS 正常，未启用浏览器榜单备用。
- **核实**：各产品以官网 + 官方博客 / press + GitHub / App Store + productcool / huntscreens 交叉核实（alibabacloud.com Qwen3.8-Max 官方发布博客、openminis.app + github Da-AiXZ/OpenMinis、huntscreens.com/products/agentsky、productcool.com/product/{murmell,inventory-2,mpai,coachai,hand-wave} 等）；未引用票数 / 融资 / 用户量 / 排名等未经证实数据。
- **限制**：本批 RSS 为前几日窗口的近乎整体重复上架，真正新增 AI 候选仅约 10 个；PH 产品页常返回 403，正文以官网与聚合器 / 代码仓核实为准；Qwen3.8-Max 的编码基准为在 Claude Code harness 下的厂商自评、无第三方复现，AgentSky/Open Minis/CoachAI 的性能与隐私均为厂商自述。
