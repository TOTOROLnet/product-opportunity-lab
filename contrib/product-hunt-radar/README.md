# product-hunt-radar · 2C 扩展（合并为一份日报）

## 回答：最终几份报告？

**对外只有 1 份**：`reports/YYYY-MM-DD.md`  
lab 继续 `collect_recent_reports.py --days 1` 拉取这一份即可。

**对内 2 次 Agent**：推理隔离，文件合并。

| 步骤 | 谁执行 | 产出 |
|------|--------|------|
| 1 | B2B Automation + `focus.md` | `reports/partials/b2b-DATE.md` |
| 2 | `merge_daily_report.py` | `reports/DATE.md`（可能含 Track B 占位） |
| 3 | 2C Automation + `focus-2c.md` | `reports/partials/consumer-DATE.md` |
| 4 | `merge_daily_report.py` 再次运行 | **更新同一份** `reports/DATE.md` |

合并后结构：

```markdown
# Product Hunt 新品监测报告 - DATE
## Track A：B2B / ...
## Track B：2C ...
## 数据源与限制
```

## 上下文隔离（为何仍要两个 Agent）

- 两次运行各读 `data/latest.json`，**互不读对方 partial**
- 不在同一次 prompt 里混 B2B / 2C 评判标准
- 合并由**确定性脚本**完成，避免模型合并时偏袒某一轨

## 同步到 radar 仓库

```bash
RADAR=/path/to/product-hunt-radar
LAB=/path/to/product-opportunity-lab

cp "$LAB/contrib/product-hunt-radar/config/focus-2c.md"              "$RADAR/config/"
cp "$LAB/contrib/product-hunt-radar/scripts/merge_daily_report.py"   "$RADAR/scripts/"
cp "$LAB/contrib/product-hunt-radar/AUTOMATION_PROMPT.md"            "$RADAR/"
cp "$LAB/contrib/product-hunt-radar/AUTOMATION_PROMPT_2C.md"         "$RADAR/"
cp "$LAB/contrib/product-hunt-radar/AGENTS.md"                       "$RADAR/"
cp "$LAB/contrib/product-hunt-radar/AGENTS_2C.md"                    "$RADAR/"
mkdir -p "$RADAR/reports/partials"
```

在 radar `.gitignore` 追加：`reports/partials/`

## Cursor Automations（radar 内两个）

1. **B2B** — `AUTOMATION_PROMPT.md`，建议 08:00  
2. **2C** — `AUTOMATION_PROMPT_2C.md`，建议 08:30（晚于 B2B，以便当日合并报告含完整 Track B）

## lab 如何消费同一份报告

| lab Automation | 读哪一节 | provenance 文件 |
|----------------|----------|-----------------|
| B2B Demo | `## Track A`（无分节时整份视为旧版 B2B） | `source-report.md` |
| 2C 观察 | `## Track B` | `consumer-source-report.md`（同文件副本） |

两 lab Automation 仍应**分开运行**，各读各节，不读对方产出。
