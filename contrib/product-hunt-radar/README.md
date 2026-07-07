# product-hunt-radar · 2C 扩展（合并为一份日报）

## 最终几份报告？

**对外只有 1 份**：`reports/YYYY-MM-DD.md`  
lab 继续 `collect_recent_reports.py --days 1` 拉取这一份即可。

**对内 2 次 Agent**：推理隔离，**合并由 CI 完成**（不是 Agent 自己合并）。

| 步骤 | 谁执行 | 产出 |
|------|--------|------|
| 1 | B2B Automation + `focus.md` | cursor 分支上的 `reports/partials/b2b-DATE.md` |
| 2 | 2C Automation + `focus-2c.md` | cursor 分支上的 `reports/partials/consumer-DATE.md` |
| 3 | `auto-merge-cursor.yml`（CI，每次 push 触发） | 把 partial 累积进 main → 跑 `merge_daily_report.py --all` → 生成/更新 `reports/DATE.md` |

**关键设计（避免跨分支竞态）**：

- 两个 Agent 在**各自 cursor 分支**工作，互相看不到对方 partial；若让 Agent 自己 merge，后 push 的会用占位符覆盖对方的 Track，导致内容丢失。
- 因此 **merge 只在 CI 的 main 上跑**：main 持久化保存两个 partial，无论谁先跑，`--all` 都会基于 main 上累积的全部 partial 重建当天报告，**幂等、无覆盖**。
- `concurrency: sync-report-main` 串行化两次 push，确保第二次基于最新 main。

合并后结构：

```markdown
# Product Hunt 新品监测报告 - DATE
## Track A：B2B / ...
## Track B：2C ...
## 数据源与限制
```

## 同步到 radar 仓库

```bash
RADAR=/path/to/product-hunt-radar
LAB=/path/to/product-opportunity-lab
C="$LAB/contrib/product-hunt-radar"

cp "$C/config/focus-2c.md"                       "$RADAR/config/"
cp "$C/scripts/merge_daily_report.py"            "$RADAR/scripts/"
cp "$C/AUTOMATION_PROMPT.md"                      "$RADAR/"
cp "$C/AUTOMATION_PROMPT_2C.md"                   "$RADAR/"
cp "$C/AGENTS.md"                                 "$RADAR/"
cp "$C/AGENTS_2C.md"                              "$RADAR/"
cp "$C/.github/workflows/auto-merge-cursor.yml"  "$RADAR/.github/workflows/"
```

**注意**：radar 的 `.gitignore` **不要** ignore `reports/partials/`——partial 必须提交进 main，供跨 Agent 累积合并。

## Cursor Automations（radar 内两个）

1. **B2B** — `AUTOMATION_PROMPT.md`，建议 08:00  
2. **2C** — `AUTOMATION_PROMPT_2C.md`，建议 08:30（晚于 B2B，使当日合并报告尽快补全 Track B）

两者都只写 partial，合并交给 CI。

## lab 如何消费同一份报告

| lab Automation | 读哪一节 | provenance 文件 |
|----------------|----------|-----------------|
| B2B Demo | `## Track A`（无分节时整份视为旧版 B2B） | `source-report.md` |
| 2C 观察 | `## Track B` | `consumer-source-report.md`（同文件副本） |

两 lab Automation 仍应**分开运行**，各读各节，不读对方产出。
