每天执行一次 Product Hunt **Track B（2C 消费应用）** 监测。与 Track A（B2B）是**独立 Agent 任务**；本任务只写 partial，由脚本合并进**同一份** `reports/YYYY-MM-DD.md`。

**禁止**读取 `reports/partials/b2b-*.md`、`config/focus.md` 或 Track A 正文。

执行步骤：

1. 阅读 `AGENTS_2C.md` 和 `config/focus-2c.md`。
2. 运行 `python3 scripts/fetch_producthunt.py`。
3. 读取 `data/latest.json`（raw 列表，独立 2C 视角重扫）。
4. RSS 失败时用浏览器榜单作备用。
5. 2C 机制判断 + 核实；不编造票数、融资等。
6. Track B 按 18 分制评分（见 `focus-2c.md`）。
7. 将 **Track B 全部正文** 写入：

   `reports/partials/consumer-YYYY-MM-DD.md`

   **禁止**写入 Track A 内容。禁止直接写 `reports/YYYY-MM-DD.md`。

8. 运行：`python3 scripts/merge_daily_report.py --date YYYY-MM-DD`
9. 最终回复：简版摘要 + partial 路径 + 合并后的 `reports/YYYY-MM-DD.md` 路径。

Track B partial 结构（无需写 Track B 标题，合并脚本会自动包裹）：

## 今日 2C 一句话结论

## 今天最值得关注的 1-3 个 2C 产品
（定位、目标用户、痛点、机制/交互、分发留存假设、失败风险、评分、链接）

## 2C 趋势信号

## 其他达到门槛的 2C 候选

## 已过滤产品摘要

## 数据源与限制

Track B 正文 600-1000 字。不要写「对混元 API 的启发」。宁可少报，不要凑数。
