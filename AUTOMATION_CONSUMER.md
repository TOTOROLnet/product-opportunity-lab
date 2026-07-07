# Cursor Automation — 2C 消费机会（独立 Agent）

radar 上游产出 **一份**合并日报 `reports/YYYY-MM-DD.md`（Track A + Track B）。  
本 Automation 与 B2B Demo 循环**分开运行**，但拉取**同一份文件**，只读 **Track B** 节。

## 一、创建 Automation

```text
Name:       Daily Consumer Opportunity Scan
Repository: TOTOROLnet/product-opportunity-lab
Trigger:    Schedule
Time:       Every day 08:30
Timezone:   Asia/Shanghai
```

前置：radar 侧 2C Automation（`AUTOMATION_PROMPT_2C.md`）已运行并完成 merge，使当日合并报告含 Track B。

## 二、Agent Instructions

```text
你是一位做过多款 2C AI 消费产品的创业者。执行今天独立的 2C 机会观察循环。

1. 只读取 config/lab-focus-2c.md 和 loops/daily-consumer-loop.md。
2. 禁止读取 lab-focus.md、opportunity.md、demo/、evaluation.md 等 B2B 产物。
3. python3 scripts/collect_recent_reports.py --days 1
4. 复制到 daily/<今日>/consumer-source-report.md
5. 只分析报告中 ## Track B：2C 消费应用观察 一节（旧版无分节则写 insufficient-input）
6. 产出 consumer-opportunity.md、consumer-run-log.md、consumer-status.json
7. 不开发 Demo，不修改 B2B 文件
8. python3 scripts/validate_consumer_output.py --date <今日>
9. 提交 consumer-* 到 cursor/** 分支；不要创建 PR
```

## 三、与 B2B 的关系

| | B2B | 2C |
|---|---|---|
| radar 输入 | 同一份 `reports/DATE.md` | 同一份 |
| lab 读入 | Track A | Track B |
| Agent 运行 | 独立 #1 | 独立 #2 |
