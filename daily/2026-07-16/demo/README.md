# 师承（Shicheng）— 用批改带教出可检验的 Agent Skill

> product-opportunity-lab · 2026-07-16 的每日机会 Demo。
> 纯前端静态原型（Vite + React + TypeScript），**不接后端 / 数据库 / 支付 / 登录 / LLM / 外部 API**，全部数据为 mock。

## 这是什么

**师承**把"制造一个 Agent Skill"从**工程师写 prompt / 工具**，反转为**领域专家用批改（红笔）来带教**：

1. **带教**：agent 先对一批真实 case 给出判断 + 一句理由；专家只需「认同 / 改判」。
2. **蒸馏**：专家的改判被蒸馏成一条**人类可读、带来源、可版本化**的规则，落进「技能卡」。
3. **验收**：在一批**没被专家批改过**的全新候选人（holdout）上，实测"agent 与专家一致率"从带教前到带教后提升了多少——**这个数字由一个真实的迷你规则引擎实算，不是编的。**

示例域：某支付公司「高级后端工程师」初筛（数据均为化名 mock）。域可替换——师承是**领域无关的 Skill 生产工具**，不是招聘产品。

## 核心看点（诚实性）

- 一致率是**实算**的：技能卡里每条规则是一个确定性特征谓词，作用到 holdout 每个 case 上产生判定，再与专家 ground truth 比对。
- 在「验收」页**开关任意规则**，一致率会**实时**变化——证明每条规则都真的在起作用。
- 我们**保留了一个仍不一致的 case**（候选人 S）：它属于当前技能卡尚未覆盖的维度（协作/沟通），如实展示"规则不完美、会过拟合"。

## 三个主视图

1. **① 带教（Coach）**：case 流 + agent 判断 + 你的裁定 + 右侧实时生长的技能卡。可用「自动带教（演示）」一键跑完，便于快速看 before/after。
2. **② 技能卡（Skill）**：完整规则列表——来源 case、权重、开关、可点击编辑、可「导出 Skill (JSON)」。
3. **③ 验收（Evaluate）**：带教前 vs 现在的一致率双环 + 逐候选人判定归因 + 规则实时开关。

## 运行方式

```bash
# Node 18+（推荐 20/22）
npm install
npm run dev      # 本地开发：打开终端提示的 http://localhost:5173
npm run build    # 生产构建，产物在 dist/
npm run preview  # 本地预览构建产物
```

## 技术说明

- `vite.config.ts` 设 `base: './'`（相对路径），保证部署到任意 GitHub Pages 子目录都能正确加载资源。
- 目录：
  - `src/data/cases.ts`：mock 训练集 + holdout 集（含专家 ground truth）。
  - `src/data/rules.ts`：技能卡规则（确定性特征谓词）。
  - `src/logic/engine.ts`：迷你规则引擎与一致率计算。
  - `src/components/`：Coach / Skill / Evaluate 三视图 + 共享组件。
- 无任何网络请求、无密钥、无外部依赖服务。
