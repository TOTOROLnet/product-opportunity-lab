import type { Workload } from '../types';

// 4 个代表性负载（全部为 mock 画像，用于演示方法论；调用次数/单位成本为归一化示意值）。
// tier 依据「进程内 WASM 运行时能否原生跑」判定：
//   native  = 交叉编译成 WASM 后可在 V8 isolate/进程内直接跑（bash/git/sqlite/duckdb/JS/纯 http）
//   mount   = 需按需 mount 一台真沙箱才能跑（无头浏览器、python 原生扩展、x86 原生二进制）——付真沙箱代价，拿不到 254×
//   blocked = WASM 里根本跑不了，必须常驻一台专用真沙箱（ffmpeg/GPU 推理）——不仅不省，反而多一层编排

export const WORKLOADS: Workload[] = [
  {
    id: 'coding',
    name: '编码代理',
    blurb: '以 shell / git / 测试为主的 coding agent，偶尔跑一次无头浏览器 e2e。',
    families: [
      { name: 'bash / shell', category: '命令执行', calls: 500, unitCost: 1.0, tier: 'native', reason: 'coreutils/busybox 可交叉编译为 WASM，在进程内直接跑。' },
      { name: 'git', category: '版本控制', calls: 300, unitCost: 1.5, tier: 'native', reason: 'git 已有 WASM 移植，纯本地操作，无需真沙箱。' },
      { name: 'ripgrep / grep / sed', category: '文本处理', calls: 400, unitCost: 0.5, tier: 'native', reason: '纯 CPU 文本处理，WASM 化后开销极低。' },
      { name: 'sqlite', category: '本地存储', calls: 200, unitCost: 1.0, tier: 'native', reason: 'sql.js / WASM SQLite 成熟，进程内可跑。' },
      { name: 'node / tsc 构建', category: 'JS 运行时', calls: 100, unitCost: 3.0, tier: 'native', reason: 'JS 本就在带 JIT 的 V8 isolate 上跑，是运行时的主场。' },
      { name: '无头浏览器 e2e（偶发）', category: '浏览器', calls: 3, unitCost: 12.0, tier: 'mount', reason: '完整 Chromium 无法进 WASM，需按需 mount 一台真沙箱。' },
    ],
  },
  {
    id: 'data',
    name: '数据分析代理',
    blurb: '以 duckdb / sqlite / arrow 为主，偶尔用 pandas 原生扩展与 GPU 打分。',
    families: [
      { name: 'duckdb 查询', category: '分析引擎', calls: 400, unitCost: 2.0, tier: 'native', reason: 'duckdb-wasm 官方支持，进程内列式分析。' },
      { name: 'sqlite', category: '本地存储', calls: 200, unitCost: 1.0, tier: 'native', reason: 'WASM SQLite 成熟，进程内可跑。' },
      { name: 'bash / git / ripgrep', category: '命令执行', calls: 200, unitCost: 0.6, tier: 'native', reason: '纯 CPU / 本地操作，WASM 友好。' },
      { name: '读写 parquet（arrow-js）', category: '列式 IO', calls: 150, unitCost: 1.2, tier: 'native', reason: 'arrow-js 纯 JS/WASM 实现，无需原生依赖。' },
      { name: 'python + pandas/numpy（原生扩展）', category: 'Python', calls: 30, unitCost: 3.0, tier: 'mount', reason: 'numpy/pandas 依赖 C/BLAS 原生扩展，pyodide 覆盖不全，热路径需真沙箱。' },
      { name: 'GPU 模型打分（罕见）', category: 'GPU', calls: 4, unitCost: 20.0, tier: 'blocked', reason: 'CUDA/GPU 无法在 WASM/V8 内访问，必须常驻 GPU 沙箱。' },
    ],
  },
  {
    id: 'scraping',
    name: '爬取/抓取代理',
    blurb: '大量 http 抓取 + HTML 解析，但相当比例站点必须渲染 JS（无头浏览器）。',
    families: [
      { name: 'http fetch（JS）', category: '网络', calls: 600, unitCost: 0.5, tier: 'native', reason: 'fetch 在 V8 内原生可用，纯网络 IO。' },
      { name: 'HTML 解析（cheerio/JS）', category: '解析', calls: 600, unitCost: 0.5, tier: 'native', reason: '纯 JS DOM 解析，进程内直接跑。' },
      { name: 'sqlite / duckdb 落库', category: '本地存储', calls: 200, unitCost: 1.0, tier: 'native', reason: 'WASM 存储引擎，进程内可跑。' },
      { name: '无头 chromium 抓取', category: '浏览器', calls: 50, unitCost: 10.0, tier: 'mount', reason: '需渲染 JS 的站点必须用完整浏览器，按需 mount 真沙箱。' },
      { name: '代理轮换原生二进制（x86）', category: '网络', calls: 40, unitCost: 2.0, tier: 'mount', reason: 'x86 原生二进制未重编译为 WASM，需真沙箱执行。' },
    ],
  },
  {
    id: 'media',
    name: '媒体处理代理',
    blurb: '以 ffmpeg 转码 + GPU 图像/视频推理为主，元数据用 sqlite。',
    families: [
      { name: 'ffmpeg 转码', category: '媒体', calls: 120, unitCost: 15.0, tier: 'blocked', reason: 'ffmpeg 重度依赖 SIMD/线程/硬件编解码，WASM 版性能与能力都不达用；需常驻真沙箱。' },
      { name: 'GPU 视频/图像推理', category: 'GPU', calls: 60, unitCost: 25.0, tier: 'blocked', reason: 'GPU 无法在 WASM/V8 内访问，必须常驻 GPU 沙箱。' },
      { name: 'imagemagick（原生）', category: '媒体', calls: 150, unitCost: 4.0, tier: 'mount', reason: '原生 delegate（libheif/libwebp 等）覆盖不全，需按需 mount 真沙箱。' },
      { name: 'bash / git', category: '命令执行', calls: 60, unitCost: 1.0, tier: 'native', reason: '少量脚本编排，WASM 友好。' },
      { name: 'sqlite 元数据', category: '本地存储', calls: 80, unitCost: 0.8, tier: 'native', reason: 'WASM SQLite，进程内可跑。' },
    ],
  },
];
