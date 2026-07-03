# Fusebox — Agent 能力「配电箱」（纯前端 Demo）

> 把 Agent 授予的一堆工具/MCP 权限画成一张能力图，自动发现「单看安全、组合起来高危」的涌现链路（数据外泄 / 破坏性写入 / 财务风险 / 内部越界扩散），并在**部署前**模拟收紧权限、看高危链路如何收敛。

本 Demo 是 `product-opportunity-lab` 2026-07-03 机会循环的产出，属"抽象/基础设施类机会"的
**模拟体验 + 价值可视化**演示：全部数据为 mock，不接任何真实后端 / 数据库 / 支付 / MCP server / API / 凭证。

## 为什么做这个（创新切入点）

报告（product-hunt-radar 2026-07-03）里 Basedash / Banger Mail 等把高风险动作放进"展示 payload → 人批准"，
MCP 工具用 **Always allow / Needs approval / Blocked** 三态开关**逐个工具**授权。
但**风险往往来自权限的"组合"**：把"读客户库"和"发邮件"各自设成 Always allow 都像低风险，
组合起来就是一条**数据外泄**链路。逐工具、运行时的审批看不见这一层。

Fusebox 的切入点：把"授予的工具权限**集合**"当作一等对象，发现涌现的高危链路，
用**爆炸半径 / 可逆性 / 数据敏感度**量化，并支持**部署前**的策略 before/after 模拟。

- 与 **Basedash Actions** 的区别：它逐动作展示 payload、逐工具设三态、运行时审批；Fusebox 面向**权限集合的组合**、在部署前发现单工具设置暴露不出的路径。
- 与 **Retrace** 的区别：它事后重放已发生的失败轨迹（哪一步错）；Fusebox 事前分析这组权限能构成哪些危险路径（还没跑就看清爆炸半径）。

## 运行方式

需要 Node.js 18+（推荐 20/22）。

```bash
# 1. 安装依赖
npm install

# 2. 本地开发预览（默认 http://localhost:5173 ）
npm run dev

# 3. 生产构建（先 tsc 类型检查，再 vite build，产物在 dist/）
npm run build

# 4. 本地预览构建产物
npm run preview
```

> `vite.config.ts` 里设了 `base: './'`（相对路径），部署到任意 GitHub Pages 子目录都能正确加载资源。

## 三个视图（3 分钟看懂价值）

1. **能力图**：数据源 → 工具（已授予）→ 外部/系统副作用汇的拓扑；红/黄流动线是系统自动发现的高危链路；点节点看语义、敏感度、可逆性与当前策略。
2. **风险链路**：涌现高危链路按残余风险排序；点开看**评分构成**（类别基础分 × 敏感度 × 可逆性 × 护栏 × 是否有人审）与**修复建议**。
3. **策略模拟器**：切换任一工具的三态策略、或开启数据/写入防火墙规则 → 顶部总风险分、高危链路数**实时重算**，并给出相对初始策略的 before/after。

## 目录结构

```
src/
  main.tsx                入口
  App.tsx                 页面骨架 + Tab + 状态
  index.css               深色主题样式
  types.ts                领域模型类型
  data/scenario.ts        mock 场景：客服 Agent 的能力拓扑 + 初始策略
  logic/scoring.ts        显式、可解释的风险评分与链路计算（非黑箱）
  components/
    RiskBanner.tsx        顶部风险仪表 + before/after
    CapabilityGraph.tsx   SVG 能力图 + 高危链路高亮
    Inspector.tsx         节点详情侧栏
    RiskPaths.tsx         高危链路列表 + 评分拆解 + 修复建议
    PolicySimulator.tsx   策略/防火墙开关 + 实时收敛统计
```

## 明确不做

- 不做登录 / 用户系统；不接数据库 / 支付 / 邮件 / 真实 MCP / 外部 API / 私钥。
- 不做生产级后端；不调用真实模型。
- 评分与拓扑均为演示用 mock + 显式规则，仅用于表达"权限组合涌现风险"这一思路。
