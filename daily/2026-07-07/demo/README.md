# Reverso — Agent 动作可逆性与回滚规划器（Demo）

> product-opportunity-lab · 2026-07-07 · 纯前端模拟体验 Demo（Vite + React + TypeScript）

整条 agent 栈都在优化「把 run 往前推」（更便宜的长上下文、失败后重试、路由 fallback、手机一键批准）。
**Reverso 是那层没人做的「倒退路径」**：为一次 agent run 里每个改状态的动作，算出
**能不能退、怎么退、退到哪一步就退不回来**。

这是一个**模拟体验 + 价值可视化**的纯前端 Demo：不真正执行或回滚任何动作，数据全部 mock，
不接后端 / 数据库 / 支付 / 外部 API / 私钥。

## 它做什么

- **可逆性分级**：对每个动作（写文件 / git / shell / DB / HTTP / 发消息 / 部署 / 扣款 / 云资源）
  判定 `REVERSIBLE`（可逆）/ `COMPENSABLE`（有代价可补偿）/ `IRREVERSIBLE`（不可逆）。
- **回滚手册**：给出具体逆操作 / 补偿步骤（如 `git revert`、从快照恢复、down migration、退款调用；
  发出去的邮件=无法撤回）。
- **不可逆临界点（point of no return）**：在时间轴上标出「过此线不可逆」。
- **run 级 verdict**：`SAFE` / `CHECKPOINT` / `STOP-BEFORE-IRREVERSIBLE`。
- **Reverso 保护网**：模拟"临界动作前自动打快照/备份"，把 `IRREVERSIBLE` 实时翻成 `COMPENSABLE`。

所有判定都是对动作数据的**确定性规则**（见 `src/logic/analyze.ts`），**不是按场景写死的结论**——
切换场景或打开保护网会实时重算。

## 页面

1. **Plan Analyzer**：verdict 头部 + 场景选择 + 保护网开关 + 动作时间轴（含临界线）+ 动作详情（回滚手册）。
2. **Before / After**：左"运行时/日志原样" vs 右"Reverso 标注"，直观展示增量。
3. **How it works**：可逆性分类法、确定性规则表、forward-vs-backward 论点、与审批/协作诊断层的区隔。

## 运行

需要 Node 18+（建议 Node 20/22）。

```bash
npm install      # 安装依赖
npm run dev      # 本地开发，默认 http://localhost:5173
npm run build    # 类型检查 + 生产构建，产物在 dist/
npm run preview  # 预览构建产物
```

## 目录结构

```
src/
  App.tsx                 # 页面编排（3 个 Tab + 场景选择 + 保护网开关）
  types.ts                # 领域模型（AgentAction / Diagnosis / RunVerdict …）
  logic/analyze.ts        # 确定性判定引擎（可逆性 + 回滚手册 + 临界点 + verdict + 保护网）
  data/scenarios.ts       # 5 个 mock agent-run 动作计划
  data/labels.ts          # 动作 / 可逆性的显示标签与配色
  components/             # RunVerdictHeader / Timeline / ActionDetail / BeforeAfter / HowItWorks
```

## 构建配置

`vite.config.ts` 设 `base: './'`（相对路径），保证部署到任意 GitHub Pages 子目录
（如 `/product-opportunity-lab/2026-07-07/`）都能正确加载资源。
