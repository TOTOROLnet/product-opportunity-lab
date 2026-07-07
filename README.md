# Product Opportunity Lab

基于 [`product-hunt-radar`](https://github.com/TOTOROLnet/product-hunt-radar) 的每日新品报告，
每天自动分析最近一份报告，以「连续 AI 创业者」的视角提出一个**创新**产品机会，
并自动生成一个可体验的轻量 Demo、自测报告和机会分析文档。

这是一个 **Loop Engineering** 工作区：

```text
每日产品扫描(radar) → 客观机会分析 → 创新切入点选择 → Demo 原型生成 → 自动验证 → 部署可体验 URL
```

它与 radar 的分工：

- `product-hunt-radar` = 信号采集层 / 产品情报库 / 稳定输入源
- `product-opportunity-lab` = 机会分析层 / 原型实验场 / Loop Engineering 工作区

## 每天产出

B2B 主循环（Automation 1）：

```text
daily/YYYY-MM-DD/
├── opportunity.md     # 客观机会分析（含不照抄声明）
├── demo-spec.md       # Demo 设计说明
├── demo/              # 可运行的 Vite + React + TS Demo（抽象产品用模拟体验）
├── evaluation.md      # 自动体验 / 自测报告（PASS / PARTIAL / FAIL）
├── run-log.md         # 本次 loop 执行记录
├── status.json        # 机器可读状态
└── source-report.md   # 本次使用的 radar B2B 报告（provenance）
```

2C 观察循环（Automation 2，读**同一份**合并日报的 Track B 节）：

```text
daily/YYYY-MM-DD/
├── consumer-opportunity.md      # 2C 机会观察（无 Demo）
├── consumer-run-log.md
├── consumer-status.json
└── consumer-source-report.md    # 合并日报存档（与 source-report 同文件，只读 Track B）
```

## 工作原理（无 cron 依赖）

1. Cursor Automation 每天 08:00（Asia/Shanghai）运行，读取 `loops/daily-demo-loop.md`。
2. 运行时用 `scripts/collect_recent_reports.py` 自拉取 public radar 的最近 1 份报告。
3. 按 loop 规范做机会分析 → Demo 设计 → 开发 → build 验证 → 自评，写入 `daily/YYYY-MM-DD/`。
4. Agent 把产物提交到 `cursor/**` 分支。
5. `.github/workflows/sync-cursor-output.yml`（on push `cursor/**`）把 `daily/*` 同步进 `main` 并删分支。
6. `.github/workflows/deploy-demo.yml`（on push `main`，paths `daily/**`）构建 Demo 并部署到 GitHub Pages。

整条链路由 **两个** Cursor Automation 定时触发（B2B 08:00、2C 建议 08:30）；两个 workflow 都是事件触发，无 GitHub Actions cron。

## 本地验证命令

```bash
# 1. 拉取最近 1 份 radar B2B 报告
python3 scripts/collect_recent_reports.py --days 1
# 或显式：--track b2b

# 1b. 2C 循环也用同一份合并报告（无需 --track）
python3 scripts/collect_recent_reports.py --days 1

# 2. 校验某天 B2B 产物
python3 scripts/validate_daily_output.py --date latest

# 2b. 校验 2C 产物
python3 scripts/validate_consumer_output.py --date latest

# 3. 校验并构建某天的 Demo
bash scripts/validate_demo.sh daily/latest/demo
```

## 在线体验

每天的 Demo 部署在 GitHub Pages，地址形如：

```text
https://totorolnet.github.io/product-opportunity-lab/YYYY-MM-DD/
```

根目录 `https://totorolnet.github.io/product-opportunity-lab/` 是按日期倒序的 Demo 列表。

## 相关文档

- `REQUIREMENTS.md` — 完整需求与约束
- `loops/daily-demo-loop.md` — 每日循环的执行规范（Automation 的执行主体）
- `config/lab-focus.md` — 关注方向、评分与门槛
- `AUTOMATION.md` — B2B Cursor Automation 配置
- `AUTOMATION_CONSUMER.md` — 2C 独立 Automation 配置
- `config/lab-focus.md` — B2B 关注方向、评分与门槛
- `config/lab-focus-2c.md` — 2C 关注方向与门槛（独立 Agent）
- `loops/daily-consumer-loop.md` — 2C 观察循环规范
- `contrib/product-hunt-radar/` — radar 上游 2C 补丁（独立 Automation 用）
