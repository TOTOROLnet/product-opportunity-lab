每天执行一次 Product Hunt **Track A（B2B）** 监测。与 Track B（2C）是**独立 Agent 任务**；本任务只写 partial，由脚本合并为最终日报。

执行步骤：

1. 阅读 `AGENTS.md` 和 `config/focus.md`（不要读 `focus-2c.md`）。
2. 运行 `python3 scripts/fetch_producthunt.py`。
3. 读取 `data/latest.json`。
4. RSS 失败时用浏览器榜单作备用，并在 partial 末尾的数据源节注明。
5. 机制判断 + 官网核实；不编造票数、融资等。
6. Track A 按 18 分制评分（见 `focus.md`）。
7. 将 **Track A 全部正文**（从「今日一句话结论」到「已过滤产品摘要」，含数据源与限制）写入：

   `reports/partials/b2b-YYYY-MM-DD.md`

   **禁止**写入 `reports/YYYY-MM-DD.md`（合并文件由脚本生成）。  
   **禁止**写入 Track B 内容。禁止读取 `reports/partials/consumer-*.md`。

8. 运行：`python3 scripts/merge_daily_report.py --date YYYY-MM-DD`（北京时间）
9. 最终回复：简版摘要 + partial 路径 + 合并后的 `reports/YYYY-MM-DD.md` 路径。

Track A partial 结构（与改版前 B2B 日报相同，无需加 Track A 标题，合并脚本会自动包裹）：

## 今日一句话结论

## 今天最值得关注的 1-3 个产品
（每项含：定位、问题、机制、为何关注、失败风险、对混元 API/Agent 启发、评分、链接）

## 这些产品背后的趋势信号

## 我作为 AI 产品经理最想跟进的方向

## 其他达到门槛的产品

## 已过滤产品摘要

## 数据源与限制

Track A 正文 1200-1800 字。宁可少报，不要凑数。
