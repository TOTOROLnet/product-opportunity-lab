# Product Opportunity Lab — 需求与约束

## 0. 一句话目标

基于 `product-hunt-radar` 每日扫描报告，每天早上 8 点自动分析最近一份报告，
以「连续 AI 创业者」的视角提出一个**创新**产品机会，并自动生成一个可体验的轻量 Demo、
自测报告和机会分析文档，自动同步进 main 并部署为可访问的在线 Demo。

## 1. Agent 角色设定（Persona，贯穿全流程）

你是一位成功的连续 AI 应用创业者（serial AI founder），有多次从 0 到 1 打造 AI 产品的经验：

- 擅长洞察需求：识别真实且未被满足的用户需求，对伪需求 / 模型自嗨 / 概念包装高度警惕；
- 擅长发挥创新：从不复刻现有产品，而是找差异化切入点、增量价值和更锋利的产品形态；
- 有工程落地直觉：清楚什么能在一天内做成可体验的最小 Demo；
- 务实且诚实：愿意给出"不建议继续"的结论，不为产出而产出；
- 以"如果我要押注下一个创业方向，这值得吗"的视角审视每一份报告。

## 2. 运行频率

- 每天早上 08:00 运行一次，时区 Asia/Shanghai。
- 由 Cursor Automation 承担定时；两个 GitHub workflow 均为事件触发，无 cron。

## 3. 输入范围

- 读取最近 **1 份** product-hunt-radar 报告（`--days 1`）。
- 来源：public 仓库 `TOTOROLnet/product-hunt-radar` 的 `reports/YYYY-MM-DD.md`。
- 报告含两大板块：技术向 / B2B / 基础设施 AI 与 2C 消费向 AI；机会分析应覆盖两端。
- 运行时由 `scripts/collect_recent_reports.py` 自拉取，无需 token、无需预先同步。
- 若完全没有报告：生成 `daily/YYYY-MM-DD/insufficient-input.md` 说明无法分析，正常结束，不报错。

### 时序提醒

lab 每天读"最近 1 份可用报告"。若 lab 与 radar 同在 08:00，lab 读到的通常是**昨天**那份
（今天的还没生成），这符合"参考过去一天"。若要用当天最新报告，把 lab 的 Automation 时间设得比 radar 晚一些。

## 4. 两条硬性原则

### 4.1 客观性（报告是参考资料，不是结论）

- 报告内容和结论只是参考资料，必须基于资料做出客观、专业的独立判断，不能盲从。
- `opportunity.md` 必须显式区分"报告事实/观点"与"我的独立判断"，允许质疑报告。

### 4.2 不照抄（必须是创新切入点）

- 禁止复刻报告里的某个具体产品（照抄的话用户直接去体验原产品即可）。
- 必须找到创新切入点，明确解决的具体问题与增量价值。
- `opportunity.md` 必须包含：创新切入点 / 解决的具体问题 / 相对被参考产品的增量价值 / 为什么这不是照抄 X。
- 本质是克隆则不合格，必须重选。

## 5. 输出内容

```text
daily/YYYY-MM-DD/
├── opportunity.md
├── demo-spec.md
├── demo/
├── evaluation.md
├── run-log.md
├── status.json
└── source-report.md   # 本次使用的 radar 报告（provenance）
```

## 6. Loop Engineering 设计

受约束的循环，不是一次性生成 Demo：

```text
拉取最近 1 份报告
→ 客观提取产品信号（区分事实与判断）
→ 生成至少 3 个候选创新机会
→ 五维评分选择 1 个
→ 写 opportunity.md / demo-spec.md
→ 按 Demo 策略分型开发静态 Demo
→ 自动 build / smoke test
→ 模型自评体验
→ 发现问题则修复（最多 3 轮）
→ 达标后写入 daily/YYYY-MM-DD/
```

### 6.1 评分维度（每维 0–5，总分 25）

1. 用户痛点强度
2. 产品机制新意
3. AI 核心度（技术向看 Agent/API/基础设施相关度，2C 向看是否 AI-native 消费体验；两类同等评分）
4. 一天内做 Demo 的可行性
5. 对用户工作 / 消费级 AI 市场判断的启发价值

> 机会来源覆盖上游报告的**两大板块**：技术向 / B2B / 基础设施 AI，以及 2C 消费向 AI。
> 只做 AI 产品机会；不要只从技术向板块选题而系统性忽略 2C。

门槛：选总分最高者；最高分 < 16/25 则不做 Demo，只输出机会观察（status=PARTIAL）。

### 6.2 Demo 策略分型

- 可视化 / 交互类产品：直接做可点击交互 Demo。
- 抽象 / CLI / API / 基础设施类产品（如 scritty 这类脚手架 / 终端 / 记忆层 / MCP 产品）：
  用纯前端"模拟体验 + 价值可视化"呈现——网页版模拟终端回放、可搜索面板、资源视图、before-after 对比等，
  用 mock 数据直观体现价值与用法。演示的必须是我们分析出的创新切入点，不是原产品的克隆。

### 6.3 Demo 限制

- 只做纯前端静态 Demo；不做登录 / 数据库 / 支付 / 外部私钥 / 真实用户系统 / 生产级后端。
- 不超过 3 个主要页面；全部数据 mock；用户 3 分钟内应能理解产品价值。
- 技术栈：Vite + React + TypeScript（`vite.config.ts` 用 `base: './'` 以适配任意 Pages 子目录）。

### 6.4 自动验证（硬检查）

1. `npm install` 成功
2. `npm run build` 成功
3. `dist/index.html` 存在且非空、含挂载节点
4. README 写清如何运行
5. 必需产物文件都已生成

build 失败最多自动修复 3 轮；3 轮后仍失败：保留失败产物、写明原因、不得标 PASS。

### 6.5 体验自评

结论只能是 PASS / PARTIAL / FAIL：

- PASS：build 成功 + 产物齐全 + 核心流程闭合 + 达到门槛。
- PARTIAL：未达门槛只出机会观察，或部分产物缺失但有解释。
- FAIL：build 3 轮仍失败或核心不可用。

## 7. 仓库结构

```text
product-opportunity-lab/
├── README.md
├── REQUIREMENTS.md
├── AUTOMATION.md
├── .gitignore
├── config/lab-focus.md
├── inputs/product-hunt-reports/     # 运行时填充（gitignored）
├── loops/daily-demo-loop.md
├── scripts/
│   ├── collect_recent_reports.py
│   ├── validate_daily_output.py
│   └── validate_demo.sh
├── templates/
│   ├── opportunity-template.md
│   ├── demo-spec-template.md
│   └── evaluation-template.md
├── daily/
└── .github/workflows/
    ├── sync-cursor-output.yml
    └── deploy-demo.yml
```

## 8. 自动同步与部署

- `sync-cursor-output.yml`：on push `cursor/**` → 把 `daily/*` 拷进 main → commit/push → 删 cursor 分支。
- `deploy-demo.yml`：on push `main`（paths `daily/**`）→ 构建最新日期 Demo → 部署到 GitHub Pages 的 `/<date>/` 子目录，刷新根 index。

## 9. 非目标（第一版明确不做）

不自动开发完整 SaaS；不做真实后端 / 支付 / 账号；不自动发布正式产品；不自动对外宣传；
不自动判断商业成功；不自动删除历史 Demo；不把 demo 代码写回 radar；不把模型自评当真实用户验证。

## 10. 风险与控制

- 模型自嗨：必须引用报告具体信号、写清机会来源与不确定性、允许结论为"不建议继续"。
- Demo 质量不稳定：必须 build、必须重试、失败不得标 PASS。
- Scope 失控：只允许纯前端静态 Demo、最多 3 页、全 mock。
- 仓库污染：不提交 node_modules / dist；每天产物放独立 `daily/YYYY-MM-DD/`；失败也有 run-log。

## 11. 验收

1. 每天 08:00 能否远程自动运行？
2. 运行完成后 `daily/YYYY-MM-DD/` 是否自动进入 main？
3. 用户打开电脑后能否直接看到机会分析、Demo 和评估报告（含在线 URL）？
