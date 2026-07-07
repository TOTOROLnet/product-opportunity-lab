# Daily Consumer Opportunity Loop（2C 独立循环）

本文件是 **第二个 Cursor Automation** 的执行规范，与 `loops/daily-demo-loop.md` **分属两次 Agent 运行**。

- 配置：`config/lab-focus-2c.md`
- 模板：`templates/consumer-opportunity-template.md`
- 输入：合并日报 `reports/YYYY-MM-DD.md` 的 **Track B 节**（与 B2B 同文件，经 `collect_recent_reports.py` 拉取）
- 产出：`consumer-opportunity.md`、`consumer-run-log.md`、`consumer-status.json`、`consumer-source-report.md`

**禁止**在同一次运行中读取 B2B 循环的配置或当日 B2B 产物（见 `lab-focus-2c.md` 隔离清单）。

---

## Step 0 — 准备

1. 只读取 `config/lab-focus-2c.md` 与本文件。
2. 拉取最近 1 份 **合并 radar** 报告（与 B2B 相同命令）：
   ```bash
   python3 scripts/collect_recent_reports.py --days 1
   ```
3. 计算今天日期 `DATE`（北京时间 `YYYY-MM-DD`），确保 `daily/DATE/` 存在。
4. 把同一份合并报告复制到 `daily/DATE/consumer-source-report.md`。
5. 分析时**只读取**报告中 `## Track B：2C 消费应用观察` 一节；若该节为占位或缺失，按无有效 2C 输入降级。
6. **无报告分支**：若 `inputs/product-hunt-reports/` 为空，写 `daily/DATE/consumer-insufficient-input.md`，
   `consumer-status.json`（`status=PARTIAL`，`reason=no-input`），正常结束。

---

## Loop — 2C 机会分析（仅观察，无 Demo）

1. 从 `consumer-source-report.md` 提取关键 2C 信号（标明报告事实）。
2. 生成至少 **2 个候选创新机会**（非 radar 产品的复刻）。
3. 用 `lab-focus-2c.md` 五维评分，选最高分。
4. 按 `templates/consumer-opportunity-template.md` 写 `daily/DATE/consumer-opportunity.md`。
5. 写 `daily/DATE/consumer-run-log.md`（用了哪份报告、候选与取舍、是否建议进一步验证）。
6. 写 `daily/DATE/consumer-status.json`：

```json
{
  "date": "YYYY-MM-DD",
  "track": "consumer",
  "status": "OK | PARTIAL",
  "reason": "ok | no-input | below-threshold | weak-signals",
  "source_report": "YYYY-MM-DD.md",
  "opportunity": {
    "selected": "名称",
    "score": 16,
    "threshold": 14,
    "passed_threshold": true
  },
  "files": {
    "consumer_opportunity": true,
    "consumer_run_log": true,
    "consumer_source_report": true
  },
  "generated_at": "ISO-8601"
}
```

7. 校验：
   ```bash
   python3 scripts/validate_consumer_output.py --date DATE
   ```

---

## 状态判定

| 情况 | status | reason |
| --- | --- | --- |
| 无 2C 报告 | PARTIAL | no-input |
| 有报告，最高分 < 14 | PARTIAL | below-threshold |
| 有报告，最高分 ≥ 14 | OK | ok |

---

## 提交约定

与 B2B 循环相同：产物提交到 `cursor/**` 分支，由 sync workflow 镜像进 main。  
本循环**只追加/更新** `consumer-*` 文件，不要修改 `opportunity.md`、`demo/`、`status.json`（B2B 状态文件）。

若同日 B2B 循环尚未运行，仍可在 `daily/DATE/` 下仅写入 consumer 文件。
