// 对表 Duìbiǎo — 类型定义
// 核心对象：把 agent 指令文件里的一条「声明(Claim)」抽出来，对着仓库现实/CI 真值判决。

export type ClaimStatus =
  | 'aligned' // 对齐：与仓库现实/CI 真值一致
  | 'stale' // 漂移：命令/版本/端口/环境变量已过期
  | 'conflict' // 冲突：多份指令文件互相矛盾
  | 'unverifiable'; // 无法验证：无对应可执行依据（如 secret 值 / 缺失脚本）

export type Severity = 'high' | 'medium' | 'low' | 'none';

export type ClaimKind =
  | 'install' // 安装依赖命令
  | 'test' // 测试命令
  | 'build' // 构建命令
  | 'dev' // 本地开发 / 端口
  | 'runtime' // 运行时版本（Node 等）
  | 'pkgmgr' // 包管理器规则
  | 'env' // 环境变量
  | 'lint' // lint 命令
  | 'db'; // 数据库 / 迁移脚本

/** 仓库里散落的一份「给 agent 看的」指令文件。 */
export interface InstructionFile {
  path: string;
  role: string; // 这份文件在项目里的角色
  // 是否为「真值来源」（可执行、被 CI 实际使用）。CI 与 README 在本场景中已对齐现实。
  isSourceOfTruth: boolean;
}

/** 从某份指令文件里抽取出的一条可校验声明。 */
export interface Claim {
  id: string;
  kind: ClaimKind;
  title: string; // 声明讲的是什么（如「安装依赖」）
  sourceFile: string; // 来自哪份文件
  quote: string; // 指令文件里的原文/命令
  status: ClaimStatus; // 判决
  severity: Severity;
  reality: string; // 仓库现实 / CI 真值
  evidence: string; // 判决依据（在哪看到的真值）
  conflictsWith?: string[]; // 与哪些 claim id 冲突
  consequence: string; // 一个 agent 照此执行会发生什么
  // 修复相关：采纳后这条声明应改成什么、修复后的状态
  fix?: {
    to: string; // 对表后的正确写法
    resultStatus: ClaimStatus; // 修复后的状态（一般 aligned；secret 值仍 unverifiable）
    note?: string;
  };
}

/** 修复 diff 的一行（before/after 视图用）。 */
export interface DiffLine {
  file: string;
  minus?: string; // 旧行（将被替换/删除）
  plus?: string; // 新行（对表后）
}

/** 「修复前/后 agent 的一次典型执行」叙事的一步。 */
export interface RunStep {
  label: string;
  detail: string;
  ok: boolean; // true=顺利，false=翻车/被卡
}

export interface Scenario {
  repo: {
    name: string;
    stack: string;
    truth: { k: string; v: string }[]; // 仓库现实真值清单
  };
  files: InstructionFile[];
  claims: Claim[];
  scanLog: { line: string; tone: 'dim' | 'ok' | 'warn' | 'bad' | 'accent' }[];
  fixDiff: DiffLine[];
  runBefore: RunStep[]; // 不对表：agent 照散落指令执行
  runAfter: RunStep[]; // 对表后：agent 照单一真源执行
}
