# Product Hunt 新品监测报告 - 2026-07-05

## 今日一句话结论

今天最大的产品信号是：Agent 产品正在从“会回答/会生成”转向“接入真实工作现场，并把上下文、权限、执行证据和人类审批做成核心产品层”。

## 今天最值得关注的 1-3 个产品

### 1. Adam CAD Copilot

* 一句话定位：运行在 Onshape 和 Autodesk Fusion 内的 AI CAD/硬件工程工作流 Agent。
* 解决的真实问题：垂直 Agent 落地的瓶颈不是生成文本，而是理解专业对象、保持产物可编辑，并接入 CAD、BOM、PLM、供应商邮件和评审材料这些真实链路。
* 核心机制：官方页面和 Onshape 官方博客显示，Adam 可在 CAD 内用自然语言编辑零件、引用选中几何、清理 feature tree、抽取变量，并保持模型可维护；主站还强调连接 CAD/PLM、供应商目录和团队工具，生成分支模型、BOM、ECO、RFQ 等可审查产物。Adam 博客将底层思路概括为“代码生成 + 截图反馈”。
* 为什么值得关注：它不是另造 3D 生成器，而是站在专业软件内部改真实对象，并把审批、引用来源、BOM/ECO 影响纳入产品承诺，展示了“专业对象图谱 + 原生工具动作 + 可回滚产物”的组合。
* 如果这个产品失败，最可能输在哪里：风险在信任和集成深度。若模型破坏设计意图、难处理复杂装配，或企业因 CAD/IP 权限和审计要求不愿授权，它会停留在演示级 copilot。
* 对混元 API / Agent 产品的启发：垂直 Agent API 不应只提供通用 tool calling，还要支持对象级上下文、可审查 diff、来源引用、审批、回滚和领域 benchmark。
* 评分：17/18（相关度 5，机制新颖度 5，产品设计启发 5，市场信号 2）
* 官方链接：https://adam.new/copilot ，https://adam.new/blog/bitter-lesson-ai-cad ，https://www.onshape.com/en/blog/adam-ai-app-store-cad-co-pilot ，https://www.producthunt.com/products/adam-cad-copilot

### 2. Termi Protocol

* 一句话定位：把本地 AI coding agent 的读文件、写代码、跑命令、成本和检查点可视化成 3D 控制室。
* 解决的真实问题：coding agent 能长时间在终端里执行，但用户常只看到滚动日志，难判断它读了什么、改了什么、何时失控。信任瓶颈在可观测、可暂停、可回放和多 Agent 冲突控制。
* 核心机制：官网说明它连接 Claude Code、Codex、Gemini CLI、Aider 等 CLI agent，本地优先、用户自带 key；每个 agent 有真实 shell、任务板、检查点、项目记忆、实时成本，文件读写和命令转成 3D 动作，并支持暂停、审批、回滚和文件锁。
* 为什么值得关注：3D 层有游戏化噪音，但命题扎实：Agent 执行过程需要从不可读日志升级为可理解的运行时界面，把“如何监督 Agent”变成主体验。
* 如果这个产品失败，最可能输在哪里：风险在使用频率与信息密度。专业开发者可能更偏好结构化 trace、diff 和日志搜索；若 3D 房间不能比 IDE/终端更快暴露风险，或多 CLI 适配不稳定，它会被视为有趣但低效的皮肤。
* 对混元 API / Agent 产品的启发：Agent 平台应标准化 run trace、成本、权限请求、检查点、冲突锁和接管通知，而不是只返回最终答案。
* 评分：16/18（相关度 5，机制新颖度 5，产品设计启发 5，市场信号 1）
* 官方链接：https://termiprotocol.com/ ，https://www.producthunt.com/products/termi-protocol

### 3. Flowly

* 一句话定位：本地优先、跨桌面与手机的个人 AI agent runtime。
* 解决的真实问题：个人 Agent 只在云端跑会带来隐私和控制疑虑，只在本机跑又缺少移动监督、持续运行和跨渠道入口；落地需要把本地控制、移动接管、记忆、权限和集成放在连续体验里。
* 核心机制：官网和文档显示，Flowly 以桌面应用为主控，支持 iOS/Android 同步监督、BYOK、多模型、私有记忆/知识图谱、主动提醒和多渠道集成；文档还列出权限模式、命令审批、audit log、skills、artifacts、cron、MCP 连接以及把 Flowly 暴露为 MCP server。GitHub 仓库存在但早期信号较弱。
* 为什么值得关注：它不是单个助手功能，而是在拼个人 Agent 的运行面：桌面 runtime、移动控制、权限、记忆、渠道和 MCP，让用户拥有可监督、可扩展的私人执行环境。
* 如果这个产品失败，最可能输在哪里：风险在安全与工作流黏性。用户要授权本地命令、邮箱和消息渠道，若权限解释、审批体验、审计记录或错误恢复不够可靠，很难进入高价值任务；同时个人助理高频场景容易被系统级助手或现有聊天应用替代。
* 对混元 API / Agent 产品的启发：个人 Agent runtime 需要本地/云端可切换、权限分级、移动监督、记忆编辑、MCP 插件和任务审计。
* 评分：15/18（相关度 5，机制新颖度 4，产品设计启发 5，市场信号 1）
* 官方链接：https://www.useflowlyapp.com/en ，https://www.useflowlyapp.com/en/docs ，https://github.com/Nocetic/flowly ，https://www.producthunt.com/products/flowly-6

## 这些产品背后的趋势信号

1. Agent 正在进入专业工作现场：Adam 进 CAD/PLM，Termi 接管终端执行现场，Flowly 放在桌面和手机之间，Saldor 则进入采购/AP 流程。
2. 可控性正在从后台能力变成前台产品：Termi 做暂停、审批、检查点和文件锁；Adam 强调分支结果与人工批准；Flowly 把权限模式、命令审批和 audit log 写进文档。
3. 上下文不再只是提示词，而是运行环境：Adam 读几何、BOM 和团队消息；Flowly 组织个人记忆和跨渠道上下文；Vida 也把主动理解桌面上下文作为卖点。

## 我作为 AI 产品经理最想跟进的方向

最想跟进“Agent 执行证据与审批层”。现在值得跟进，是因为今天多个产品都把信任问题前置：用户需要知道 Agent 在什么上下文里做了什么、哪些动作需批准、如何回滚、如何审计成本和风险。建议下一步动作：深入拆解 Termi 的运行时可视化和 Adam 的 CAD diff/审批机制，沉淀混元 Agent 的 run artifact、permission request、checkpoint、audit log 与 approval 字段草案。

## 其他达到门槛的产品

| 产品名 | 分数 | 一句话理由 | 链接 |
| --- | ---: | --- | --- |
| Saldor | 14 | YC 页面和官网显示其 AI-native procurement/AP 平台覆盖采购请求、审批、供应商沟通、PO、发票匹配，并提到 AI agent 与 MCP，适合作为垂直业务 Agent 流程样本。 | https://saldor.com/ |
| Vida | 13 | PH 外链为 vida.app，官网主打主动理解跨 App 上下文、记忆、偏好校准和提前准备任务，但可核实的集成边界与实际执行能力仍偏笼统。 | http://vida.app |
| CentryAI | 11 | 用只读 Gmail/iCloud 扫描订阅收据、识别“僵尸订阅”并给取消路径，启发点在隐私授权与低风险自动发现。 | https://centryai.app |

## 已过滤产品摘要

已过滤的主要是：ChecklistFox 这类 AI 清单/PDF 生成器，机制仍是单点内容生成；普通消费订阅/计划工具；以及近几天已覆盖的 Glaze、Osloq、Vox、Archify、Needle、Context.dev、scritty、Basedash Actions、Macuse、PieterPost MCP、Banger Mail、Stigg、Retrace、Tabstack、N71、Acti、Humalike 等重复条目。

## 数据源与限制

本次 `python3 scripts/fetch_producthunt.py` 成功，主数据源为 Product Hunt RSS，抓取时间为 2026-07-05 00:01 UTC，共 50 条，未使用备用浏览器榜单。RSS 不提供票数、排名和评论，且包含跨日期重复产品；Product Hunt 产品页通过带浏览器 UA 的请求可访问并用于核对标题、描述和外链。候选机制主要通过官网、文档、GitHub、官方博客、Onshape 博客和 YC 页面核实；无法第三方验证的信息均未写成确定事实。
