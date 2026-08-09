# 正名 Zhèngmíng — 聚合工具面的「意图对号」与影子雷达

> product-opportunity-lab · 2026-08-09 的每日机会 Demo。纯前端静态原型（Vite + React + TypeScript）。

## 这是什么

当你把多个 MCP server 聚合进一层（Toolport 类网关 / 自建 meta-tool 层）、又用 **lazy discovery** 把「整份工具目录」换成「按需语义检索几个 meta-tool」时——**「选哪个工具」就从「摆在眼前挑」退化成一个检索/召回问题**。检索一旦选偏，Agent 会：

- **危险近邻**：自信地调错工具（把公告公开发到 #general、从生产库删记录、给新人开管理员、删会议不通知任何人……）；
- **盲区**：真正对的工具被一堆通用 `search/query` 挤出候选窗口，根本没送到 Agent 面前；
- **多义**：多个语义等价工具打成平手，选对全靠运气。

**正名** 坐在网关**之上**、厂商中立、只读，专门回答一个别人不回答的问题：**这片聚合工具面里，每个意图能不能对上唯一且正确的那个工具**，并把歧义/危险近邻/盲区变成可见、可一键正名的一等公民。

> 名不正则言不顺——先把工具的名与述「正」了，Agent 才对得上号。

## 三个页面

1. **对号台**：一组真实意图 → 模拟 lazy-discovery 检索器召回的前 K 个候选、高亮 Agent 会选中的那个、判决 `唯一正确 / 多义 / 危险近邻 / 盲区`，危险案例给「翻车预演」卡（朴素会调什么 vs 本该调什么）。
2. **影子雷达**：整片工具面的结构性诊断——命名冲突（跨 server 同名）、语义重叠簇（能力域）、危险近邻对、盲区。
3. **正名修复**：每条正名提案（收紧描述 / 补齐语义 / 加确认闸 / 加命名空间）做了什么，以及整片工具面 before/after 的对号率、危险近邻、盲区、命名冲突变化。

顶部 **「应用正名」** 开关一处切换，三页联动重算。

## 本地运行

```bash
npm install
npm run dev      # 本地开发
npm run build    # 产物到 dist/（vite.config 里 base:'./'，可部署到任意子目录）
npm run preview  # 预览已构建产物
```

## 数据与边界（诚实声明）

- **全部为 mock**：`src/data/tools.ts`（33 个工具、11 个 MCP server）、`src/data/intents.ts`（11 条意图）、`src/data/rectify.ts`（正名提案）。
- 检索器是 `src/logic/engine.ts` 里的**确定性关键词/标签打分**，用于演示与价值可视化；真实产品需贴合各网关的 embedding/排序策略并接入真实调用轨迹。
- **不聚合、不代理、不省 token、不管密钥**，不接后端 / LLM / 数据库 / 登录 / 支付 / 外部 API。与 Toolport（MCP 网关）机制本质不同，非照抄——正名做的是网关之上「选得对不对」的一层。

## 目录

```
src/
  data/     tools.ts / intents.ts / rectify.ts   # mock 工具面、意图、正名提案
  logic/    engine.ts                            # 确定性检索器 + 判决 + 雷达统计 + applyFixes
  components/ Bench.tsx / Radar.tsx / Rectify.tsx / shared.tsx
  App.tsx   index.css   main.tsx
```
