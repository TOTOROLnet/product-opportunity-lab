# Cursor Automation 配置

本项目的 B2B 每日循环由 **第一个** Cursor Automation 定时触发；2C 观察循环为 **第二个** Automation（见 `AUTOMATION_CONSUMER.md`）。  
两轨各自独立 Agent 运行，不得合并到同一次指令。GitHub workflow 仍为事件触发，无 Actions cron。

## 一、创建 Automation（B2B Demo 主循环）

在 Cursor 中新建 **第一个** Automation（2C 观察循环见 `AUTOMATION_CONSUMER.md`，须单独建）：

```text
Name:       Daily Product Opportunity Demo
Repository: TOTOROLnet/product-opportunity-lab
Trigger:    Schedule
Time:       Every day 08:00
Timezone:   Asia/Shanghai
```

## 二、Agent Instructions（粘贴到 Automation 指令框）

```text
你是一位成功的连续 AI 应用创业者（serial AI founder），擅长洞察真实需求、发挥创新、
务实且诚实，从不复刻现有产品。以这个身份执行今天的产品机会循环。

1. 读取 config/lab-focus.md 和 loops/daily-demo-loop.md，并严格按 loop 规范执行。
2. 先运行：python3 scripts/collect_recent_reports.py --days 1
   （自拉取 public product-hunt-radar 的最近 1 份报告到 inputs/product-hunt-reports/）。
3. 把使用的报告复制到 daily/<今日日期>/source-report.md。
4. 按 loop 的 5 个阶段产出到 daily/YYYY-MM-DD/。

硬约束：
- 客观性：报告是参考资料不是结论，必须做独立判断，区分“报告事实”与“我的判断”。
- 不照抄：禁止复刻报告里的某个产品，必须给出创新切入点、解决的具体问题、增量价值、为何非照抄。
- 生成至少 3 个候选机会再选 1 个；最高分 < 16/25 则只出机会观察（status=PARTIAL），不硬做 Demo。
- 只做纯前端静态 Demo（Vite+React+TS，vite.config 用 base:'./'），不接 secrets/数据库/支付/登录/外部 API。
- 抽象/CLI/基础设施类机会用“模拟体验+价值可视化”方式演示。
- 运行 build 验证（bash scripts/validate_demo.sh daily/<date>/demo），失败最多修 3 轮。
- 生成 opportunity.md、demo-spec.md、evaluation.md、run-log.md、status.json。
- 无报告则写 daily/<date>/insufficient-input.md（status=PARTIAL），正常结束。
- 除非 build 成功且必需文件齐全，否则不得标记 PASS。

完成后把 daily/<date>/ 提交到工作分支并 push（Cursor 默认推到 cursor/** 分支），
其余同步与部署由 GitHub Actions 自动完成。
完成后不要创建 Pull Request：cursor/** 分支会被 Sync Action 秒级删除，
开 PR 只会失败且无必要，产物已由 Action 自动进入 main。
```

> 说明：指令末尾特意加了“不要创建 Pull Request”。否则 Cursor 云端 Agent 跑完会尝试
> 开 PR，而此时分支已被 Sync Action 删除，会显示一个无害但扰人的“PR 失败”。

## 三、时序提醒（lab vs radar）

lab 每天读“最近 1 份可用报告”。若 lab 与 radar 都在 08:00 运行，lab 读到的通常是
**昨天**那份（今天的还没生成），这符合“参考过去一天”。若要用**当天最新**报告，
把本 Automation 的时间设得比 radar 晚一些（例如 09:00）。

## 四、自动同步与部署（已内置，无需人工）

- `.github/workflows/sync-cursor-output.yml`：监听 `cursor/**` 分支 push →
  **按日期目录镜像**同步进 `main`（`rm -rf` 旧目录后复制，避免旧文件残留导致构建失败）→
  用 `workflow_dispatch` 触发部署 → 删除 cursor 分支。
- `.github/workflows/deploy-demo.yml`：由上面 dispatch 触发（或直接 push main 触发）→
  构建最新日期的 Demo → 部署到 GitHub Pages 的 `/<date>/` 子目录，并刷新根 index。

> 两个已知坑及其规避：
> 1. **同步残留**：同一天二次运行 / 换方向时，旧 Demo 文件若不删会污染 main 并导致 `tsc` 失败。
>    sync 已改为按日期 `rm -rf` 后镜像复制，彻底规避。
> 2. **部署不触发**：用 `GITHUB_TOKEN` 推 main 不会触发别的 workflow（GitHub 防递归），
>    但 `workflow_dispatch` 是例外，所以 sync 用 `gh workflow run deploy-demo.yml` 显式触发部署。

## 五、GitHub Pages 一次性开启

首次需在仓库开启 Pages（Settings → Pages → Build and deployment → Source: Deploy from a branch → 分支选 `gh-pages` / 目录 `/ (root)`），
或用 CLI：

```bash
gh api -X POST repos/TOTOROLnet/product-opportunity-lab/pages \
  -f 'source[branch]=gh-pages' -f 'source[path]=/'
```

之后每天的 Demo 地址：`https://totorolnet.github.io/product-opportunity-lab/YYYY-MM-DD/`，
根目录 `https://totorolnet.github.io/product-opportunity-lab/` 为按日期倒序的列表。

## 六、最终验收

1. 每天 08:00 能否远程自动运行？（Automation 就绪即可）
2. 运行完成后 `daily/YYYY-MM-DD/` 是否自动进入 main？（sync-cursor-output.yml）
3. 打开电脑后能否直接看到机会分析、Demo、评估与在线 URL？（main 产物 + Pages）
