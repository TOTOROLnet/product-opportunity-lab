# Run Log — 2026-08-09

## 使用的报告
- `daily/2026-08-09/source-report.md`（自 `scripts/collect_recent_reports.py --days 1` 拉取 public product-hunt-radar 的 `2026-08-09.md`）。
- 报告特征：本批 RSS **约九成重复上架**（08-05~08-08 窗口 carryover）；技术向**唯一全新达标 = Toolport（15/18）**（本地 MCP 网关：聚合所有 server + lazy-discovery meta-tool 省 91% tool-token + 工具指纹防 rug-pull/poisoning + secretless keychain + 每 tool 治理审计）；**2C 端今日无全新达标**（明确留白，进入淡窗口）。

## Loop 1 — 机会发现（客观 + 创新）
- 客观区分「报告事实 vs 我的独立判断」：报告把「lazy discovery 省 91% token」当纯红利；我逆向读取——按需检索把「选工具」退化成会**静默选错/漏选**的检索问题；且「聚合」本身制造**命名空间污染**（同名/语义重叠/描述遮蔽），而指纹只查「变没变」、查不到「即使诚实也互相遮蔽」。
- 候选（≥3）与五维评分：
  - A **正名 Zhèngmíng**（聚合工具面意图↔工具消歧 + 影子雷达）：4/5/4/5/4 = **22/25** ✅ 选中。
  - B 换签 Huànqiān（工具「批准后变更」语义 diff + 重新征信）：3/3/4/4/3 = 17/25（与 Toolport 指纹功能重叠 + 落在审批治理老脉，次选）。
  - C 留白台 Liúbái（端侧剪辑隐私可见性，2C）：3/3/2/3/2 = 13/25（诚实低分：报告 2C 留白 + 纯前端做不了端侧，仅证明认真考虑过 2C）。
  - 也主动放弃：「省 91% token 值不值」净收益体检器（约 19），因是近一周已反复用过的「诚实计算器/上线前体检」同一形态（风洞 08-01 / 换挡 08-02），为保持形态新鲜放弃。
- 门槛：最高分 22/25 ≥ 16 → 进入 Demo。
- 反照抄自检：不聚合/不代理/不省 token/不管密钥；与 Toolport 目标函数相反；与 对表(08-08)/榫卯(07-24)/Fusebox(07-03)/归位(08-07) 对象与机制均不同（见 opportunity.md §5）。

## Loop 2 — Demo 设计
- 分型：抽象基础设施 → 纯前端「模拟体验 + 价值可视化」（可搜索面板 + 结构/雷达视图 + before/after 对比）。
- 三页：对号台 / 影子雷达 / 正名修复；全局「应用正名」开关联动。详见 `demo-spec.md`。

## Loop 3 — Demo 开发
- Vite + React + TS，`vite.config.ts` 设 `base:'./'`（复用 08-08 验证过的配置）。
- 确定性引擎 `src/logic/engine.ts`：检索器（标签打分 2×命中 + 确认闸 -1 排除）→ 四类判决（唯一正确/多义/危险近邻/盲区，且「选到危险错误工具」优先于「盲区」）→ 雷达统计（命名冲突/语义重叠簇）→ `applyFixes` 应用正名。
- Mock 数据：`tools.ts`（33 工具 / 11 server，含同名跨 server、贪婪/误导描述、生产↔暂存危险近邻）、`intents.ts`（11 意图）、`rectify.ts`（8 条正名提案）。
- **先用 `_verify.ts`（esbuild→node）预验证引擎数字自洽**，再接 UI；验证后删除临时文件。

## Loop 4 — 自动验证
- `bash scripts/validate_demo.sh daily/2026-08-09/demo`：`npm install` ✅ → `npm run build` ✅（**第 1 轮即通过，build_attempts=1**）→ smoke ✅（dist/index.html 非空、含 `id="root"`、有 JS bundle）。
- 引擎预验证数字（与实机截图一致）：
  - 正名前：唯一正确 3 / 多义 2 / 危险近邻 5 / 盲区 1，对号率 **27%**；命名冲突 4；语义重叠簇 12。
  - 正名后：唯一正确 10 / 多义 1 / 危险近邻 0 / 盲区 0，对号率 **91%**；命名冲突 0；语义重叠簇 12（合理重叠不删，只消歧）。
- 浏览器实机验证：`npm run preview` + computerUse 子代理点全流程 + 切换开关，截图存 `daily/2026-08-09/screenshots/`（6 张）。无空白/报错/错位；本人抽查 02/04 截图确认中文清晰、数字准确（子代理 OCR 个别误读，非缺陷）。

## 遇到的问题
- 首轮引擎判决把 i1（通知→公开频道）判成「盲区」（因正确工具 send_dm 也跌出 Top-4），但更贴切的是「危险近邻」（Agent 会公开广播 = 做坏事）。**调整判决优先级**：选到「有害的错误工具」优先判危险近邻，再判盲区。改后 5 危险近邻 / 1 盲区，符合直觉。
- 无 build 失败，未触发修复轮次。

## 最终结论
- **status = PASS，reason = ok**。选中「正名 Zhèngmíng」（22/25，≥16 门槛）；build 一次通过；opportunity / demo-spec / demo / evaluation / run-log / status 全齐；实机验证核心流程闭合、无报错。
- 提交：commit#1（source+opportunity+demo-spec+demo 源码）已 push；commit#2（evaluation+run-log+status+screenshots）随后 push 到 `cursor/**`，由 GitHub Actions 同步进 main 并部署 Pages。不开 PR。
