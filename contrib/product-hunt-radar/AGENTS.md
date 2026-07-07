# Product Hunt Radar Agent Instructions（Track A · B2B）

本仓库每天生成**一份**合并日报 `reports/YYYY-MM-DD.md`。  
Track A 由本 Automation 在**独立 Agent 运行**中产出 partial，再经 `scripts/merge_daily_report.py` 合并。

## 执行流程

1. 运行 `python3 scripts/fetch_producthunt.py`
2. 读取 `data/latest.json`
3. 只读取 `config/focus.md`
4. 机制判断、官网核实、Track A 评分
5. 写入 `reports/partials/b2b-YYYY-MM-DD.md`
6. 运行 `python3 scripts/merge_daily_report.py --date YYYY-MM-DD`
7. **不要**读取 consumer partial 或 `focus-2c.md`

## 约束

* 不编造融资、用户量、票数、排名、团队背景。
* 正文只展开 1-3 个 B2B 产品；附录最多 10 个。
* 禁止写入最终 `reports/YYYY-MM-DD.md`（仅 merge 脚本可写）。
