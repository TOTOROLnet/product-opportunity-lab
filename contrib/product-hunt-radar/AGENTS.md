# Product Hunt Radar Agent Instructions（Track A · B2B）

本仓库每天生成**一份**合并日报 `reports/YYYY-MM-DD.md`。  
Track A 由本 Automation 在**独立 Agent 运行**中产出 partial；合并由 CI（`.github/workflows/auto-merge-cursor.yml`）在 main 上跑 `scripts/merge_daily_report.py --all` 完成。

## 执行流程

1. 运行 `python3 scripts/fetch_producthunt.py`
2. 读取 `data/latest.json`
3. 只读取 `config/focus.md`
4. 机制判断、官网核实、Track A 评分
5. 写入 `reports/partials/b2b-YYYY-MM-DD.md`
6. 提交到 `cursor/product-hunt-*` 分支并 push（CI 负责合并 + 部署 + 删分支）
7. **不要**读取 consumer partial、`focus-2c.md`，也**不要**本地跑 merge

## 约束

* 不编造融资、用户量、票数、排名、团队背景。
* 正文只展开 1-3 个 B2B 产品；附录最多 10 个。
* 禁止写入最终 `reports/YYYY-MM-DD.md`（仅 CI 的 merge 脚本可写）。
