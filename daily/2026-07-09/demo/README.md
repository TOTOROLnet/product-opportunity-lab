# Untangle · 思绪解结 — Demo

> 把一段口述乱麻，整理成一张**你亲自确认过**的思路卡。
> 语音不是「更快的键盘」（口述即输入），而是「边想边说的白板」。

本 Demo 是 2026-07-09 每日产品机会循环的产物，配套分析见上层目录的
`opportunity.md` / `demo-spec.md` / `evaluation.md`。

## 它解决什么

习惯「用嘴思考」的人（创始人 / PM / 研究者 / ADHD 群体）在纠结、规划、复盘时，
边说边想会跑题、反悔、自相矛盾——说完还是不知道「我到底决定了啥、哪些没想清、在哪改了主意」。

现有工具要么只做**听写**（Willow / Wispr，把话变成字），要么把乱麻**洗成一段漂亮文本**
（AudioPen / Voicenotes，默认你盲信、还抹平了你的反悔）。Untangle 反着做：

1. **拆解**：把独白按「思路单元」切开，分类为 ✅决定 / ❓还没想清 / ▶行动项 / 💭背景。
2. **抓矛盾**：专门检测「你先说 X、后又改口 not-X」的**改主意对**并高亮出来。
3. **你拍板**：每条思路单元、每处矛盾都要**你亲自确认 / 修正 / 裁决**（人在方向盘）。
4. **成卡**：生成结构化、含「我改了什么主意」痕迹的思路卡，并给出 before/after 对比。

## 核心流程（3 分钟）

`① 口述`（选场景 → 模拟听写逐句流入） → `② 解结 & 确认`（分类 + 矛盾高亮 + 逐条拍板）
→ `③ 思路卡`（结构化成卡 + before/after + 复制）。

## 本地运行

```bash
npm install      # 安装依赖
npm run dev      # 本地开发预览（默认 http://localhost:5173）
npm run build    # 生产构建，产物在 dist/
npm run preview  # 预览构建产物
```

## 技术与边界

- **Vite + React + TypeScript**，纯前端静态站点，`vite.config.ts` 设 `base: './'`，
  可部署到任意 GitHub Pages 子目录。
- **无登录 / 无数据库 / 无支付 / 无外部 API / 无真实麦克风与 STT**。
- 「口述」是**脚本化模拟回放**；每条思路单元的类型 / 置信度 / 矛盾对是**预标注的
  「示例分析结果」**（界面已显式标注），真实产品由模型实时生成。所有状态仅存在于前端内存。

## 目录结构

```
src/
  App.tsx                    状态机（intake → untangle → card）
  types.ts                   数据类型
  data/scenarios.ts          3 个 mock 纠结场景（含刻意的反悔/矛盾）
  logic/labels.ts            思路单元类型的标签与配色
  logic/clarity.ts           从确认状态计算思路卡 + 矛盾裁决 + 导出文本
  components/
    StepBar.tsx              顶部步骤条
    Intake.tsx               口述台（模拟听写回放）
    UntangleBoard.tsx        解结台（核心屏：分类 + 矛盾 + 确认）
    SegmentCard.tsx          单条思路单元卡片
    ContradictionCallout.tsx 矛盾/改主意的拍板控件
    ClarityCard.tsx          思路卡 + before/after + 复制
```
