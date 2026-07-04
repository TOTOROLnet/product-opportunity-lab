# Attestor — Agent 自述报告的证据审计器（反“幻觉式完成”验收台）

> 纯前端 mock Demo（Vite + React + TypeScript）。数据与判定均为**演示用途**，不接后端 / 数据库 / 支付 / 外部 API / 真实 LLM。
> 本 Demo 对应 `daily/2026-07-04/opportunity.md` 中选定的机会（source：product-hunt-radar 2026-07-04，参考但**不照抄** Osloq / Glaze）。

## 它解决什么

AI Agent（Cursor / Copilot / Devin / Claude Code…）干完活，会给一段**自信满满的自述**：“已修复、已加测试、CI 全绿……”。
审查者只有两个坏选项：**全信**（可能吞下幻觉式完成）或**全部亲手重验**（抵消了 agent 的效率）。

Attestor 提供第三条路：把交付时的自述**逐句拆成 claim**，与本次运行**已有的证据**（代码 diff / 测试输出 / 命令退出码 / 日志 / 截图）**逐条连线**，
给每条判定 **Verified（有证据）/ Weak（薄弱）/ Unsupported（无证据）/ Contradicted（被反证）**，
并把“无证据 / 被反证”的完成声明顶到最显眼处——**只把该复核的那几句告诉你**。

核心张力用一个数字表达：**自述信任分 100%（它自己说的） → 证据信任分 XX%（能被证明的）**。

## 三个视图（单页应用）

1. **交付收件箱**：3 个 mock 交付，每个显示“自述 100% vs 证据 XX%”双信任分与缺口。
2. **逐句证据审计**（核心）：左侧是自述的每条 claim（带判定徽章、可点击、可只看待复核项、可切换“Agent 眼里的全绿假象 ↔ 审计后露出缺口”）；右侧联动展示选中 claim 连到的证据与判定依据。
3. **证据台**：列出本次运行的所有 artifact、被谁引用；标出**声明缺口**（有声明无证据）与**孤儿证据**（有证据无声明），并透明展示信任分怎么算。

## 运行方式

```bash
# Node 18+（本仓库用 Node 22 验证）
npm install      # 安装依赖
npm run dev      # 本地开发，默认 http://localhost:5173
npm run build    # 类型检查 + 生产构建，产物在 dist/
npm run preview  # 本地预览 build 产物
```

## 关键实现说明

- `vite.config.ts` 设 `base: './'`（相对路径），保证部署到任意 GitHub Pages 子目录都能正确加载资源。
- `src/data/runs.ts`：3 个 mock 交付（自述 + artifact + 预置的 claim→证据连线与判定）。判定为**确定性数据**，前端只做展示与聚合，不假装有真实 LLM 在跑。
- `src/logic/scoring.ts`：信任分与缺口/孤儿证据的计算规则（透明、可解释）。
- `src/components/`：`Inbox`（收件箱）、`AuditView` + `EvidencePanel`（逐句审计）、`EvidenceBoard`（证据台）。

## 明确边界（这不是什么）

- 不复现 bug、不重放执行轨迹（那是 Osloq / Retrace 的事）；Attestor 只做“自述结论 ↔ 已有证据”的核验。
- 不做登录 / 用户系统 / 生产级后端；不真正解析真实 PR 或运行真实测试。
