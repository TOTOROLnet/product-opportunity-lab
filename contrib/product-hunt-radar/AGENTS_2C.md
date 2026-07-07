# Product Hunt Radar Agent Instructions（Track B · 2C）

合并日报 `reports/YYYY-MM-DD.md` 的 Track B 由本 Automation 在**独立 Agent 运行**中产出 partial；合并由 CI 在 main 上完成。

## 执行流程

1. 运行 `python3 scripts/fetch_producthunt.py`
2. 读取 `data/latest.json`
3. 只读取 `config/focus-2c.md`
4. 2C 机制判断、核实、Track B 评分
5. 写入 `reports/partials/consumer-YYYY-MM-DD.md`
6. 提交到 `cursor/product-hunt-*` 分支并 push（CI 负责合并 + 删分支）
7. **不要**读取 b2b partial、`focus.md`，也**不要**本地跑 merge

## 约束

* Developer Tools / MCP / Coding Agent 不属于本轨。
* 禁止写入最终合并文件（仅 CI 的 merge 脚本可写）。
* 正文 1-3 个 2C 产品；附录最多 5 个。
