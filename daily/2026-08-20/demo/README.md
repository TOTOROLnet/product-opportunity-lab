# 对味 Duìwèi — 让 coding agent 的「选型」对你的口味

> Taste-Calibrated Dependency Selection for coding agents
> product-opportunity-lab 每日机会 Demo · 2026-08-20 · 纯前端静态原型

## 这是什么

当 coding agent（Origin / Cursor / Claude Code 时代）替你写代码时，它会**悄悄替你做一连串依赖 / 库 / 工具的选型决定**——装哪个库、用哪个包、要不要引入依赖。这些决定资深工程师本会反复权衡（体积、维护、许可、传递依赖、类型、能不能用原生），agent 却往往一笔带过。

**对味**站在**买方（用 agent 的团队）**一侧，做三件事：

1. **变可读**：把这次 PR 里 agent 的每个选型决定摊开——它为什么加、考虑过哪些替代、逐轴权衡、资深工程师会挑刺的点。
2. **学口味**：从你对几个小例子的判断（点选「为什么不满意」）里，蒸馏出一份可复用的**选型口味档案**。
3. **回放改判**：把你的口味回放到这次 PR，看哪些选型会翻盘、避免了哪些后悔、省下多少体积与传递依赖——全部按同一套**可解释**的公式。

## 三个页面

- **① 选型说明书**：agent 这次 PR 做的 6 个选型决定 + 逐个的替代对比表 + 资深工程师挑刺点；顶部实时汇总「几处会后悔 / 可优化 / 选得对味」。
- **② 口味校准**：从预设起步，或点选校准用例里的挑刺理由，实时学出你的口味档案；也可手动微调每条偏好权重（0–3）。
- **③ 对味重选**：before / after 对照——每个决定「agent 选 → 对味选」的翻盘 + 理由 + 省下的体积 / 传递依赖 / 许可硬伤，附完整评分公式。

## 与相关产品的区别（不是克隆）

- 不是 **Gauge**（厂商侧「怎么被 agent 选中」的增长分析）——对味服务的是买方。
- 不是 **Snyk / Socket**（对既有产物扫 CVE / 许可）——对味治理的是 agent 的**选择过程**。
- 不是 **Dependabot**（版本升级）——对味关心的是「该不该用这个 / 该换成什么」的口味。

## 本地运行

```bash
npm install
npm run build     # tsc -b && vite build，产物在 dist/
npm run preview   # 本地预览构建产物
# 或开发模式：
npm run dev
```

## 技术与边界

- Vite + React + TypeScript；`vite.config.ts` 设 `base: './'`，可部署到任意 Pages 子目录。
- **全部数据为 mock**，「选型引擎」为**确定性纯函数模拟**（见 `src/engine.ts`，评分公式在 UI 里完整展示）。
- 不接后端 / LLM / 真实 registry / 数据库 / 支付 / 密钥 / 登录 / 外部 API。
- 真实产品会用 agent 自己给出的选型理由 + 实时 registry（npm / deps.dev）数据；本 Demo 只为把创新切入点讲清楚。

## 目录

```
src/
  data/pr.ts            一次 agent PR（6 个选型决定 + 替代方案，全 mock）
  data/calibration.ts   校准用例（教口味用）
  engine.ts             确定性选型引擎：评分 / 改判 / 汇总 / 从例子学口味
  labels.ts             偏好元信息 + 预设口味
  types.ts              类型定义
  components/           三个页面 + 共享 UI
```
