# 对表 Duìbiǎo — Agent 指令契约的持续体检 / CI（Demo）

> 纯前端静态 Demo（Vite + React + TypeScript）。给 **Agent 指令做 CI**：把仓库里散落的
> `AGENTS.md` / `CLAUDE.md` / `.cursor/rules` / `README` / `CI` 当**可执行规格**，逐条对着
> 仓库现实与 CI 真值判决 `对齐 / 漂移 / 冲突 / 无法验证`，给出契约健康分与一键对表修复。

## 这个 Demo 想证明什么

编码 Agent 越用越多，仓库里给 agent 看的指令文件也越堆越多——但**没人保证它们还成立**。
包管理器从 pnpm 迁到 bun、端口改了、脚本删了、Node 版本升了，AGENTS.md 却还写着老命令；
更糟的是 CLAUDE.md 说 npm、`.cursor/rules` 说 pnpm，**多份指令互相矛盾**，agent 随机挑一个照做就翻车。

对表把这些「腐烂 + 冲突 + 无依据」的声明在提交 / CI 阶段就拦下来。

## 三步核心流程（3 分钟看懂）

1. **① 扫描台**：查看 mock 仓库 `acme/checkout-service` 的 5 份指令文件，点「运行契约扫描」，
   观看确定性模拟终端回放（发现文件 → 抽取 12 条声明 → 对 CI 真值核对 → 跨文件冲突检测 → 健康分 44/100）。
2. **② 契约账本**：逐条查看声明的判决、来源、真值证据、后果；勾选「采纳对表修复」，健康分实时重算。
3. **③ 对表修复**：查看收敛到单一真源的修复 diff、健康分 44 → 96 的增量、以及「修复前 / 后 agent 的一次典型执行」对比。

## 本地运行

```bash
npm install
npm run dev      # 启动开发服务器（默认 http://localhost:5173）
npm run build    # 类型检查 + 生产构建，产物在 dist/
npm run preview  # 本地预览构建产物
```

## 技术说明

- 技术栈：Vite + React + TypeScript（严格模式）。
- `vite.config.ts` 使用 `base: './'`（相对路径），保证部署到任意 GitHub Pages 子目录都能正确加载资源。
- 确定性引擎在 `src/logic/scan.ts`：给定「已采纳修复集合」，算出每条声明的有效状态、契约健康分与统计，**无随机、无副作用**。
- 全部数据为 mock（`src/data/scenario.ts`），**不读取任何真实仓库、不执行任何真实命令**，无后端 / LLM / 数据库 / 登录 / 支付 / 外部 API。

## 目录结构

```
src/
  App.tsx                 # 顶层：Tab 导航 + 修复状态
  types.ts                # Claim / Scenario 等类型
  data/scenario.ts        # mock 仓库快照、12 条声明、扫描日志、修复 diff、before/after 叙事
  logic/scan.ts           # 确定性判决 + 健康分引擎
  components/
    ScanConsole.tsx       # ① 扫描台 + 模拟终端回放
    Ledger.tsx            # ② 契约账本（可搜索 / 可展开 / 可勾选修复）
    FixProposal.tsx       # ③ 对表修复（diff + 健康分增量 + before/after + 报告）
    shared.tsx            # 状态徽章 / 严重度 / 健康分 / 统计卡等复用组件
  index.css               # 深色设计系统
```

## 与被参考产品的本质区别（非照抄声明）

- **vs HAR**（新机器可读契约 + 多 Agent 编排）：对表**不要求迁移**到任何新契约，直接校验你已经在用的那些文件，是契约之上的**校验层**。
- **vs Reference `check_doc_drift`**（嵌入相似度看人读文档↔代码漂移）：对表判断的是「**命令 / 版本 / 端口 / 环境变量与仓库现实和 CI 真值是否一致**」，是可执行的事实核对 + 跨文件冲突检测，不是相似度。
- 目标函数相反：别人帮你**产出 / 度量**契约，对表默认你已有的指令会骗人，专门去**证伪并对表**。
