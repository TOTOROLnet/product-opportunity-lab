# Run Log — 2026-07-17

## 使用的报告
- `daily/2026-07-17/source-report.md`（= `2026-07-16.md`，来自 public product-hunt-radar）。
- 说明：北京时间 2026-07-17 08:01 触发时，radar 尚未发布当日报告，`collect_recent_reports.py --days 1`
  拉取到的最近报告即 07-16（与昨日同源）。按 loop"日期滚动前进"约定：新建 `daily/2026-07-17/`，
  并**刻意选取与昨日（师承 Shicheng，信号#3 Skill 即产品）完全不同的机制族**，不自我重复。

## 各 Loop 关键决策
- **Loop 1 机会发现**：
  - 客观提取报告事实：Tiptap AI Toolkit（15）、Mantle Clerk（14，"数值回链原文"）、Campus（14），
    报告归纳趋势"文档/画布成为 agent 可直接写入的一等界面"；另有 YAGNI（15，治理层，报告最想跟进）。
  - 独立判断：不跟随报告最想做的 YAGNI 治理层——那是我 07-03..07-13 反复做过的审查/治理族，自我重复；
    并判断"大家都在解写入这一刻（写得进/写得对），没人解写入之后的失真"，Mantle 的"回链原文"给了技术支点。
  - 3 候选 + 五维评分：A 常青 Evergreen（活文档鲜度守护）**23/25**；B 领航 steer-by-document 19/25；
    C 常读 Freshread（2C 对照）14/25。
  - 选择 A（23/25 ≥ 16 门槛）→ 进入 Demo。
- **Loop 2 Demo 设计**：抽象/基础设施类 → "模拟体验 + 价值可视化"。三页：文档（逐句鲜度高亮+回放）/
  来源（变更时间线+影响面）/ 补丁（diff 采纳 + before/after 鲜度分）。场景=客服退款 SOP。
- **Loop 3 开发**：Vite + React + TS（复用 07-16 经验证脚手架配置，base:'./'）。
  真实确定性引擎 `engine.ts`：来源版本↔论断断言比较 → 鲜/腐判定 → 补丁文本 → 鲜度分。
  数据 `data/`：5 个已变更来源（触发失真）+ 7 个未变来源；12 条承重论断；5 条来源变更事件。
- **Loop 4 验证**：`bash scripts/validate_demo.sh daily/2026-07-17/demo` → **一次通过（build_attempts=1）**。
  另用 vite-node 预检引擎数值（回放 100→92→83→75→67→58；auto→92；manual→100），与浏览器实机一致。
- **Loop 5 自评**：结论 PASS（详见 evaluation.md）。

## build 轮次与结果
- 第 1 轮：`npm install` OK；`tsc -b && vite build` OK；dist 冒烟检查通过。**无需修复。**

## 遇到的问题
- `tsc -b` 照例产出 `*.tsbuildinfo` / `vite.config.js` / `vite.config.d.ts` 构建产物；
  已在根 `.gitignore` 追加忽略规则，确认这些产物未被 `git add`（仅提交源码 + package-lock.json）。
- computerUse 转写里出现个别中文 OCR 误读（如把"绑定的来源"读成"腐败的来源"、"漂移"读成"潜移"），
  经核对保存的截图确认是转写伪影，非 App bug。

## 数值（实测，来自确定性引擎 + 浏览器核对）
- 初始鲜度：**58%**（7/12 承重论断为鲜；5 条失真 = 4 可自动修复 + 1 需人判断）。
- 一键采纳全部可自动修复项 → **92%**（11/12）。
- 人工选定"需人判断"口径 → **100%**（12/12）。

## 最终结论
- status = **PASS**，reason = ok。机会 = 常青 Evergreen（23/25），Demo 已 build 成功且产物齐全，
  浏览器实机验证核心闭环，价值清晰、无照抄、含诚实的能力边界留白。
- 产物：opportunity.md / demo-spec.md / demo/（含源码）/ evaluation.md / run-log.md / status.json /
  source-report.md / screenshots/（7 张）。
