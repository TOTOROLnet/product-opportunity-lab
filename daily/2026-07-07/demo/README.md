# Concord — 多 Agent 协作失调诊断器（Coordination-Failure Detective）

> 纯前端 mock 概念 Demo。吃事件驱动多 Agent 运行时的**运行事件流**，用一组**关系性 + 时间性检测器**自动判出协作反模式（活锁 / 重试风暴 / 无主任务 / 重复写入冲突 / 空转），给出**因果链 + 浪费成本 + 病因 + 修复处方**与协作健康 verdict（HEALTHY / DEGRADED / STUCK）。

信号来源：product-hunt-radar `2026-07-07` 报告（Mozaik / Edgee / CodeMote，"Agent 运行控制面分层"趋势）。报告为参考资料；Concord 的切入点（协作失调**诊断层**）是独立判断，不复刻报告中的任一产品，也不是本实验室既有产出（Fusebox/Attestor/Contour/Datum）的克隆——详见根目录 `../opportunity.md`。

## 它解决什么

编排式（DAG）多 Agent 系统故障可定位；事件驱动 / 自组织系统的故障是**关系性、时间性、涌现的**——每个 agent 单看都"在正常工作"（在重试、在等待、在发消息），系统级却已经活锁 / 空转 / 任务无人接 / 抢写同一文件，token 和墙钟时间在悄悄烧。Concord 把"多 Agent 协作反模式"变成一等**检测对象**，把"看事件"升级为"判病 + 开处方"。

## 怎么用（Demo）

1. 进入「诊断台」，顶部是协作健康 **verdict** + 病灶数 / 浪费 token / 受影响时长。
2. 左侧选运行场景（活锁 / 重试风暴 / 无主任务 / 写入冲突 / 健康对照）。
3. 点「▶ 播放」，中间**交互图**随事件点亮、病灶节点/边变红，**时间轴**上事件逐条流入并打病灶标记。
4. 右侧**诊断面板**实时列出每个反模式的因果链、浪费成本、病因与修复处方。
5. 顶部切换 **Concord 诊断视图 / 原始事件日志**，直观对比 before/after。
6. 「工作原理」页解释 5 类检测器、为何不是 trace/APM、定位与边界。

## 本地运行

```bash
npm install
npm run dev      # 本地开发（默认 http://localhost:5173）
npm run build    # 产物输出到 dist/
npm run preview  # 预览 build 产物
```

## 技术栈与约定

- **Vite + React + TypeScript**，无额外重依赖（交互图用纯 SVG）。
- `vite.config.ts` 设 `base: './'`，保证部署到任意 GitHub Pages 子目录都能正确加载资源。
- 检测逻辑在 `src/logic/detectors.ts`，是对事件流的**确定性关系/时间分析**（不是硬编码 verdict），随时间轴切片增量运行。

## 目录结构

```
src/
  main.tsx                 # 入口
  App.tsx                  # 诊断台 + 播放逻辑 + 页面/视图切换
  types.ts                 # RunEvent / Detection / DiagnosisResult 等类型
  data/scenarios.ts        # 5 个 mock 运行场景（事件流）
  logic/detectors.ts       # 5 类协作反模式检测器 + diagnose() 主入口
  components/
    VerdictHeader.tsx       # 协作健康 verdict + 指标
    InteractionGraph.tsx    # SVG Agent 交互图（随时间点亮，病灶高亮）
    Timeline.tsx            # 时间轴播放/拖动 + 病灶标记
    DiagnosisPanel.tsx      # 诊断面板（after）
    EventLog.tsx            # 原始事件日志（before）
    HowItWorks.tsx          # 工作原理 / 定位边界 / 不照抄声明
```

## 明确不做

不做登录 / 用户系统，不接数据库 / 支付 / 外部私钥 / 真实 API / 真实运行时。全部事件流为 mock。真实产品需要事件规范化 + 稳健去噪（避免假阳性），此处用固定阈值示意。
