// ---------------------------------------------------------------------------
// 编谱 Biānpǔ · mock 代码库语义图
//
// 一个手工构造、确定性的小型 TypeScript 支付服务 `acme-checkout` 的语义图：
// 文件、符号（函数/类型）、以及每个符号的确切引用位置与调用边。
// 全部为 mock，不代表真实仓库；编谱引擎据此做确定性展开，不接任何真实后端。
// ---------------------------------------------------------------------------

export interface RepoFile {
  id: string;
  path: string;
  role: string; // 一句话说明这个文件是干什么的
}

export interface SymbolRef {
  file: string; // RepoFile.id
  label: string; // 引用所在的具体位置（函数名 / 测试名 / 字段）
  kind: 'call' | 'import' | 'type-ref' | 'field' | 'internal-call';
  isTest?: boolean;
}

export interface RepoSymbol {
  id: string;
  name: string;
  kind: 'function' | 'type' | 'const';
  file: string; // 定义所在文件
  signature: string;
  summary: string;
  refs: SymbolRef[]; // 除定义外的所有引用点
}

export const FILES: RepoFile[] = [
  { id: 'gateway', path: 'src/payments/gateway.ts', role: '支付网关：发起扣款/退款，调用底层 HTTP' },
  { id: 'retry', path: 'src/payments/retry.ts', role: '重试逻辑：withRetry 包装易失败调用' },
  { id: 'handlers', path: 'src/api/handlers.ts', role: 'HTTP 路由处理：checkout / refund / webhook' },
  { id: 'client', path: 'src/api/client.ts', role: '底层 HTTP 客户端：postJson' },
  { id: 'money', path: 'src/util/money.ts', role: '金额工具：toCents / formatCents' },
  { id: 'audit', path: 'src/audit/log.ts', role: '审计日志：记录并异步 flush' },
  { id: 'test-gw', path: 'tests/gateway.test.ts', role: '网关单测' },
  { id: 'test-api', path: 'tests/api.test.ts', role: '接口集成测试' },
];

export const FILE_PATH: Record<string, string> = Object.fromEntries(
  FILES.map((f) => [f.id, f.path]),
);

// 本次要重构的目标符号（供操作引用）。refs 精确到点，保证展开数字可复现。
export const SYMBOLS: Record<string, RepoSymbol> = {
  charge: {
    id: 'charge',
    name: 'charge',
    kind: 'function',
    file: 'gateway',
    signature: 'charge(cardToken: string, amountCents: number): Promise<ChargeResult>',
    summary: '发起一次扣款',
    refs: [
      { file: 'handlers', label: 'handleCheckout()', kind: 'call' },
      { file: 'handlers', label: 'handleRetryCharge()', kind: 'call' },
      { file: 'retry', label: 'retryCharge()', kind: 'call' },
      { file: 'gateway', label: 'retryableCharge() 内部', kind: 'internal-call' },
      { file: 'test-gw', label: 'it("charges a valid card")', kind: 'call', isTest: true },
      { file: 'test-gw', label: 'it("rejects an expired card")', kind: 'call', isTest: true },
      { file: 'test-api', label: 'it("POST /checkout charges once")', kind: 'call', isTest: true },
    ],
  },
  postJson: {
    id: 'postJson',
    name: 'postJson',
    kind: 'function',
    file: 'client',
    signature: 'postJson(url: string, body: unknown): Promise<Response>',
    summary: '底层 HTTP POST（JSON）',
    refs: [
      { file: 'gateway', label: 'charge() → postJson', kind: 'call' },
      { file: 'gateway', label: 'refund() → postJson', kind: 'call' },
      { file: 'gateway', label: 'capture() → postJson', kind: 'call' },
      { file: 'handlers', label: 'handleWebhook() → postJson', kind: 'call' },
      { file: 'audit', label: 'flushAudit() → postJson', kind: 'call' },
      { file: 'retry', label: 'pingHealth() → postJson', kind: 'call' },
      { file: 'test-api', label: 'it("POST /checkout charges once")', kind: 'call', isTest: true },
      { file: 'test-api', label: 'it("POST /refund refunds")', kind: 'call', isTest: true },
      { file: 'test-api', label: 'it("POST /webhook acks")', kind: 'call', isTest: true },
    ],
  },
  withRetry: {
    id: 'withRetry',
    name: 'withRetry',
    kind: 'function',
    file: 'retry',
    signature: 'withRetry<T>(fn: () => Promise<T>, opts: RetryOpts): Promise<T>',
    summary: '把易失败的异步调用包装成带退避的重试',
    refs: [
      { file: 'gateway', label: 'import { withRetry }', kind: 'import' },
      { file: 'handlers', label: 'import { withRetry }', kind: 'import' },
      { file: 'audit', label: 'import { withRetry }', kind: 'import' },
    ],
  },
  RetryOpts: {
    id: 'RetryOpts',
    name: 'RetryOpts',
    kind: 'type',
    file: 'retry',
    signature: 'type RetryOpts = { max: number; backoffMs: number }',
    summary: '重试参数',
    refs: [],
  },
  amountCents: {
    id: 'amountCents',
    name: 'amountCents',
    kind: 'const',
    file: 'gateway',
    signature: '金额（分）当前散落为 number，无 branded 类型',
    summary: '各处金额目前是裸 number，容易与"元"混淆',
    refs: [
      { file: 'gateway', label: 'charge(amountCents: number)', kind: 'type-ref' },
      { file: 'gateway', label: 'ChargeResult.amountCents', kind: 'field' },
      { file: 'gateway', label: 'refund(amountCents: number)', kind: 'type-ref' },
      { file: 'money', label: 'toCents(amount): number', kind: 'type-ref' },
      { file: 'money', label: 'formatCents(cents: number)', kind: 'type-ref' },
      { file: 'client', label: 'tipAmount: number', kind: 'field' },
      { file: 'audit', label: 'record({ amount: number })', kind: 'field' },
    ],
  },
};

// 一句典型的散文重构指令 —— 就是过去直接甩给 agent 的那句话。
export const PROSE_REQUEST =
  '把 charge 改个更清楚的名字，postJson 顺便支持一下 options，把重试逻辑抽成独立模块，金额都用 Cents 类型。';

// 散文里藏着的、人本该拍板、否则 agent 只能猜的决策点。
export interface Ambiguity {
  id: string;
  opId: OpId;
  fromProse: string; // 散文里对应的措辞
  question: string; // agent 面对的歧义问题
  decidedLabel: string; // 谱里拍板成什么（默认）
  interactive: boolean; // 是否在 Demo 里可交互切换
}

export type OpId = 'rename' | 'changeSig' | 'extract' | 'retype';

export const AMBIGUITIES: Ambiguity[] = [
  {
    id: 'name',
    opId: 'rename',
    fromProse: '“改个更清楚的名字”',
    question: '到底叫什么？createCharge / chargeCard / makeCharge / submitCharge？',
    decidedLabel: 'createCharge',
    interactive: false,
  },
  {
    id: 'opts',
    opId: 'changeSig',
    fromProse: '“顺便支持一下 options”',
    question: 'opts 是必填还是选填？有默认值吗？必填就得改所有调用点，选填则下游零改动。',
    decidedLabel: '选填 opts?: RequestOpts = {}（下游 0 改动）',
    interactive: true,
  },
  {
    id: 'extractScope',
    opId: 'extract',
    fromProse: '“把重试逻辑抽成独立模块”',
    question: '“重试逻辑”具体含哪些符号？抽到哪个模块？',
    decidedLabel: 'withRetry + RetryOpts → src/resilience/',
    interactive: false,
  },
  {
    id: 'centsScope',
    opId: 'retype',
    fromProse: '“金额都用 Cents 类型”',
    question: '“都”含不含退款 / 小费 / 审计里的金额？范围越大改得越多。',
    decidedLabel: 'charge + refund（不含小费 / 审计）',
    interactive: true,
  },
];
