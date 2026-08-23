// ---------------------------------------------------------------------------
// 编谱 Biānpǔ · 确定性语义改动谱引擎
//
// 输入：编排状态（启用哪些操作 + 对散文歧义拍板的参数）。
// 输出：一份"改动谱"——每个语义操作展开成的确切编辑集合、执行顺序、
//       触达的文件、以及 agent 需要"猜"的点数（用谱 = 0；用散文 = 4）。
// 全部为纯函数、无副作用、无随机、无外部依赖，数字完全可复现。
// ---------------------------------------------------------------------------

import { FILE_PATH, SYMBOLS, AMBIGUITIES, PROSE_REQUEST, type OpId } from './data/codebase';

export type OptsMode = 'optional' | 'required';
export type CentsScope = 'charge' | 'charge+refund' | 'all';

export interface ComposeState {
  rename: boolean;
  changeSig: boolean;
  extract: boolean;
  retype: boolean;
  optsMode: OptsMode;
  centsScope: CentsScope;
}

export const DEFAULT_STATE: ComposeState = {
  rename: true,
  changeSig: true,
  extract: true,
  retype: true,
  optsMode: 'optional',
  centsScope: 'charge+refund',
};

export interface Edit {
  file: string; // 文件路径
  target: string; // 被改的符号 / 位置
  action: string; // 做什么
  propagated: boolean; // 是否为自动传播的调用点（而非人显式指定的定义）
}

export interface DecidedParam {
  label: string; // 拍板的是哪个歧义
  value: string; // 拍成什么
}

export interface OpResult {
  id: OpId;
  order: number; // 演奏顺序
  title: string;
  wedge: string; // 一句话说明这个操作在语义层做什么
  decided: DecidedParam[]; // 本操作消除的、散文里没拍板的歧义
  edits: Edit[]; // 展开成的确切语义编辑
  compatChecked: number; // 自动判定兼容、无需改动的点数（如选填参数的调用点）
  newModules: string[]; // 新建的模块
}

export interface Manifest {
  ops: OpResult[]; // 已启用的操作（按演奏顺序）
  totalEdits: number; // 确切语义编辑总数
  filesTouched: string[]; // 触达的唯一文件（含新建）
  newModules: string[];
  compatChecked: number; // 自动判定兼容、0 改动的点数
  guessesWithProse: number; // 用散文交给 agent，需要猜的点数
  guessesWithScore: number; // 用谱交给 agent，需要猜的点数（= 0）
  enabledCount: number;
}

function p(fileId: string): string {
  return FILE_PATH[fileId] ?? fileId;
}

function decidedFor(opId: OpId): DecidedParam[] {
  return AMBIGUITIES.filter((a) => a.opId === opId).map((a) => ({
    label: a.fromProse,
    value: a.decidedLabel,
  }));
}

// ---- 各操作的展开逻辑（确定性） ------------------------------------------

function expandRename(): OpResult {
  const sym = SYMBOLS.charge;
  const edits: Edit[] = [
    { file: p(sym.file), target: `function ${sym.name}`, action: '重命名 → createCharge', propagated: false },
  ];
  for (const r of sym.refs) {
    edits.push({
      file: p(r.file),
      target: r.label,
      action: r.kind === 'internal-call' ? '更新内部调用' : '更新调用点',
      propagated: true,
    });
  }
  return {
    id: 'rename',
    order: 0,
    title: '重命名符号：charge → createCharge',
    wedge: '语义级重命名——顺着调用边找到全部引用，而非文本查找替换（不会误伤字符串/注释里的 "charge"）。',
    decided: decidedFor('rename'),
    edits,
    compatChecked: 0,
    newModules: [],
  };
}

function expandChangeSig(mode: OptsMode): OpResult {
  const sym = SYMBOLS.postJson;
  const edits: Edit[] = [
    {
      file: p(sym.file),
      target: `function ${sym.name}`,
      action:
        mode === 'optional'
          ? '改签名 → (url, body, opts?: RequestOpts = {})'
          : '改签名 → (url, body, opts: RequestOpts)',
      propagated: false,
    },
  ];
  let compatChecked = 0;
  if (mode === 'required') {
    for (const r of sym.refs) {
      edits.push({ file: p(r.file), target: r.label, action: '补齐必填 opts 参数', propagated: true });
    }
  } else {
    // 选填：既有调用点源码兼容，逐一判定、0 改动。
    compatChecked = sym.refs.length;
  }
  const decided = decidedFor('changeSig').map((d) =>
    d.label.includes('options')
      ? {
          label: d.label,
          value:
            mode === 'optional'
              ? '选填 opts?: RequestOpts = {}（下游 0 改动）'
              : '必填 opts: RequestOpts（下游 9 处补参数）',
        }
      : d,
  );
  return {
    id: 'changeSig',
    order: 1,
    title: 'postJson 增加 options 参数',
    wedge: '改签名并按选择传播：选填 = 既有调用点自动判定兼容、零 churn；必填 = 精确列出每个需补参数的调用点。',
    decided,
    edits,
    compatChecked,
    newModules: [],
  };
}

function expandExtract(): OpResult {
  const NEW = 'src/resilience/index.ts';
  const wr = SYMBOLS.withRetry;
  const importers = wr.refs.filter((r) => r.kind === 'import');
  const edits: Edit[] = [
    { file: NEW, target: 'function withRetry', action: '移动符号到新模块', propagated: false },
    { file: NEW, target: 'type RetryOpts', action: '连带移动依赖类型', propagated: true },
    { file: p('retry'), target: 'retry.ts', action: '移除旧定义并为 retryCharge 重新 import', propagated: true },
  ];
  for (const imp of importers) {
    edits.push({ file: p(imp.file), target: imp.label, action: '重写 import → src/resilience', propagated: true });
  }
  return {
    id: 'extract',
    order: 2,
    title: '抽取能力：重试逻辑 → src/resilience/',
    wedge: '把 withRetry 及其依赖类型作为一个"能力"整体迁出，自动重写所有 import——而非只挪函数、留下断裂引用。',
    decided: decidedFor('extract'),
    edits,
    compatChecked: 0,
    newModules: [NEW],
  };
}

function expandRetype(scope: CentsScope): OpResult {
  const edits: Edit[] = [
    { file: p('money'), target: 'type Cents', action: '引入 branded 类型 Cents = number & {__cents}', propagated: false },
    { file: p('gateway'), target: 'charge(amountCents)', action: 'number → Cents', propagated: false },
    { file: p('gateway'), target: 'ChargeResult.amountCents', action: 'number → Cents', propagated: true },
  ];
  if (scope === 'charge+refund' || scope === 'all') {
    edits.push({ file: p('gateway'), target: 'refund(amountCents)', action: 'number → Cents', propagated: true });
    edits.push({ file: p('money'), target: 'toCents(): number', action: '返回类型 → Cents', propagated: true });
  }
  if (scope === 'all') {
    edits.push({ file: p('money'), target: 'formatCents(cents)', action: '参数 → Cents', propagated: true });
    edits.push({ file: p('client'), target: 'tipAmount', action: 'number → Cents', propagated: true });
    edits.push({ file: p('audit'), target: 'record({ amount })', action: 'number → Cents', propagated: true });
  }
  const scopeLabel =
    scope === 'charge' ? 'charge（不含退款）' : scope === 'charge+refund' ? 'charge + refund（不含小费 / 审计）' : '全部金额（含小费 / 审计）';
  const decided = decidedFor('retype').map((d) => ({ label: d.label, value: scopeLabel }));
  return {
    id: 'retype',
    order: 3,
    title: '改类型：金额 number → Cents（branded）',
    wedge: '把"分"变成 branded 类型并按人拍板的范围传播——范围越大改得越多，但范围本身由人决定、不留给 agent 猜。',
    decided,
    edits,
    compatChecked: 0,
    newModules: [],
  };
}

// ---- 汇总 ------------------------------------------------------------------

export function compose(state: ComposeState): Manifest {
  const ordered: OpResult[] = [];
  if (state.rename) ordered.push(expandRename());
  if (state.retype) ordered.push(expandRetype(state.centsScope));
  if (state.changeSig) ordered.push(expandChangeSig(state.optsMode));
  if (state.extract) ordered.push(expandExtract());

  // 依演奏顺序重新编号（rename → retype → changeSig → extract）。
  ordered.sort((a, b) => a.order - b.order);
  ordered.forEach((op, i) => (op.order = i + 1));

  const files = new Set<string>();
  let totalEdits = 0;
  let compatChecked = 0;
  const newModules: string[] = [];
  for (const op of ordered) {
    totalEdits += op.edits.length;
    compatChecked += op.compatChecked;
    for (const e of op.edits) files.add(e.file);
    for (const m of op.newModules) newModules.push(m);
  }

  // 用散文交给 agent 时的"待猜点数" = 启用操作里、散文没拍板的歧义数。
  const enabledOps = new Set(ordered.map((o) => o.id));
  const guessesWithProse = AMBIGUITIES.filter((a) => enabledOps.has(a.opId)).length;

  return {
    ops: ordered,
    totalEdits,
    filesTouched: Array.from(files),
    newModules,
    compatChecked,
    guessesWithProse,
    guessesWithScore: 0,
    enabledCount: ordered.length,
  };
}

// 给 agent 的机读交付清单（"一谱三读"里的 agent 投影）。
export function toAgentManifest(state: ComposeState): unknown {
  const m = compose(state);
  return {
    schema: 'bianpu.change-score/v1',
    target: 'acme-checkout',
    note: '由人编排、歧义已拍板；agent 照此执行，无需推断散文意图。',
    guesses_required: m.guessesWithScore,
    play_order: m.ops.map((op) => ({
      step: op.order,
      op: op.id,
      title: op.title,
      resolved: op.decided.map((d) => `${d.label} → ${d.value}`),
      edits: op.edits.map((e) => ({
        file: e.file,
        target: e.target,
        action: e.action,
        propagated: e.propagated,
      })),
      compat_checked_no_edit: op.compatChecked,
      new_modules: op.newModules,
    })),
    totals: {
      ops: m.enabledCount,
      edits: m.totalEdits,
      files_touched: m.filesTouched.length,
      new_modules: m.newModules.length,
      compat_checked_no_edit: m.compatChecked,
    },
  };
}

export const PROSE = PROSE_REQUEST;
