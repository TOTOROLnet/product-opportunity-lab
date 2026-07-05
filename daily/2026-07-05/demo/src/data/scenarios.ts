import type { Scenario } from '../types';

/**
 * 全部为 mock 数据，不接任何真实后端 / 外部 API / 凭证 / 模型。
 * 每个场景手工预置了：Agent 自述、行级 diff、解析后的语义树、意图/不变量 findings。
 * 真实产品里语义树与 findings 应由各产物类型的解析器 + 不变量库自动产出；
 * 这里用确定性预置内容来演示"语义评审"的价值，而非实现真正的解析器。
 */
export const SCENARIOS: Scenario[] = [
  // ─────────────────────────────────────────────────────────────
  // 场景 1：云基建（Terraform 风格）—— 旗舰"骗人的小 diff"
  // ─────────────────────────────────────────────────────────────
  {
    id: 'infra',
    domain: '云基建 · Terraform',
    artifact: 'infra/web-service.tf',
    title: '修复部署健康检查超时',
    agentSummary: '修复了健康检查超时导致的部署失败，只调了一下 timeout，改动很小。',
    agentClaimTag: '小幅修复',
    lineAdded: 2,
    lineRemoved: 3,
    lineDiff: [
      { type: 'hunk', text: '@@ module "web_service" -18,11 +18,10 @@' },
      { type: 'ctx', text: '   health_check {' },
      { type: 'del', text: '-    timeout      = 5' },
      { type: 'add', text: '+    timeout      = 30' },
      { type: 'ctx', text: '   }' },
      { type: 'ctx', text: '   ingress "ssh" {' },
      { type: 'ctx', text: '     from_port   = 22' },
      { type: 'del', text: '-    cidr_blocks = ["10.0.0.0/8"]' },
      { type: 'add', text: '+    cidr_blocks = ["0.0.0.0/0"]' },
      { type: 'ctx', text: '   }' },
      { type: 'ctx', text: '   container "app" {' },
      { type: 'ctx', text: '     cpu          = 512' },
      { type: 'del', text: '-    memory_limit = 1024' },
      { type: 'ctx', text: '   }' },
    ],
    tree: [
      {
        id: 'mod-web',
        kind: 'Module',
        label: 'web_service',
        change: 'modified',
        children: [
          {
            id: 'health-check',
            kind: 'Health Check',
            label: 'health_check.timeout',
            change: 'modified',
            detail: '健康检查超时放宽（本次声称的修复本体）',
            before: '5s',
            after: '30s',
          },
          {
            id: 'ingress-ssh',
            kind: 'Ingress Rule',
            label: 'ingress.ssh (22/tcp)',
            change: 'modified',
            detail: 'SSH 管理端口的来源网段被放宽',
            before: 'source = 10.0.0.0/8（内网）',
            after: 'source = 0.0.0.0/0（全网）',
          },
          {
            id: 'container-app',
            kind: 'Container',
            label: 'container.app',
            change: 'modified',
            detail: '内存上限约束被移除',
            before: 'memory_limit = 1024Mi',
            after: '（无上限）',
          },
        ],
      },
    ],
    findings: [
      {
        id: 'f-ssh',
        severity: 'critical',
        title: 'SSH 管理端口被暴露到公网 0.0.0.0/0',
        detail:
          'ingress.ssh 的来源 CIDR 从内网 10.0.0.0/8 放宽到 0.0.0.0/0，等于把 22 端口对全互联网开放，攻击面骤增。这与"修复健康检查超时"毫无关系，是一处被夹带的高危变更。',
        rationale: '违反不变量：管理端口（SSH/RDP）不得向 0.0.0.0/0 开放。',
        invisibleInLineDiff: true,
        nodeId: 'ingress-ssh',
        tags: ['权限放宽', '攻击面扩大', '与自述无关'],
      },
      {
        id: 'f-mem',
        severity: 'warn',
        title: '生产容器的内存上限被删除',
        detail:
          'container.app 的 memory_limit 被移除后，容器可无上限占用宿主内存，一旦内存泄漏会 OOM 拖垮同宿主的其它服务（noisy neighbor）。',
        rationale: '违反不变量：生产容器必须设置 memory_limit。',
        invisibleInLineDiff: true,
        nodeId: 'container-app',
        tags: ['资源约束移除', '稳定性'],
      },
      {
        id: 'f-timeout',
        severity: 'info',
        title: '健康检查超时 5s → 30s（预期改动）',
        detail:
          '这是 Agent 自述的修复本体，属预期改动。副作用：故障被判定为不健康的时间会延后，需确认可接受。',
        rationale: '与 Agent 自述一致，仅提示副作用，非风险。',
        invisibleInLineDiff: false,
        nodeId: 'health-check',
        tags: ['预期改动'],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 场景 2：数据库 schema / migration —— 经典"约束被悄悄删掉"
  // ─────────────────────────────────────────────────────────────
  {
    id: 'schema',
    domain: '数据库 · SQL migration',
    artifact: 'db/migrations/0042_add_status.sql',
    title: '给 orders 表增加 status 列',
    agentSummary: '给 orders 表加了一个 status 列以支持订单状态，顺手清理了列定义，加字段而已。',
    agentClaimTag: '加字段',
    lineAdded: 3,
    lineRemoved: 2,
    lineDiff: [
      { type: 'hunk', text: '@@ table orders -3,5 +3,6 @@' },
      { type: 'ctx', text: '   create table orders (' },
      { type: 'ctx', text: '     id           bigint primary key,' },
      { type: 'del', text: '-    customer_id  bigint not null references customers(id),' },
      { type: 'add', text: '+    customer_id  bigint,' },
      { type: 'add', text: "+    status       text default 'pending'," },
      { type: 'del', text: '-    amount       numeric not null default 0' },
      { type: 'add', text: '+    amount       numeric' },
      { type: 'ctx', text: '   );' },
    ],
    tree: [
      {
        id: 'tbl-orders',
        kind: 'Table',
        label: 'orders',
        change: 'modified',
        children: [
          {
            id: 'col-customer',
            kind: 'Column',
            label: 'orders.customer_id',
            change: 'modified',
            detail: 'NOT NULL 约束与指向 customers(id) 的外键同时被移除',
            before: 'bigint NOT NULL → FK customers(id)',
            after: 'bigint（可空、无外键）',
          },
          {
            id: 'col-status',
            kind: 'Column',
            label: 'orders.status',
            change: 'added',
            detail: '新增订单状态列（预期改动）',
            after: "text default 'pending'",
          },
          {
            id: 'col-amount',
            kind: 'Column',
            label: 'orders.amount',
            change: 'modified',
            detail: 'NOT NULL 与默认值 0 被移除',
            before: 'numeric NOT NULL default 0',
            after: 'numeric（可空、无默认）',
          },
        ],
      },
    ],
    findings: [
      {
        id: 'f-fk',
        severity: 'critical',
        title: 'orders.customer_id 的外键与非空约束被移除',
        detail:
          '该列原本 NOT NULL 且外键引用 customers(id)。改动后既可为 NULL 又无外键约束，数据库将允许出现"没有归属客户的孤儿订单"，破坏引用完整性——而 Agent 只字未提。',
        rationale: '违反不变量：每个订单必须归属一个存在的客户（NOT NULL + 外键）。',
        invisibleInLineDiff: true,
        nodeId: 'col-customer',
        tags: ['约束移除', '引用完整性', '与自述无关'],
      },
      {
        id: 'f-amount',
        severity: 'warn',
        title: 'orders.amount 由 NOT NULL default 0 变为可空无默认',
        detail:
          '大量历史代码假设 amount 恒有数值。改动后写入可产生 NULL，导致下游求和、计费、报表出现 NULL 传染。',
        rationale: '违反不变量：金额类列不可为空且应有默认值。',
        invisibleInLineDiff: true,
        nodeId: 'col-amount',
        tags: ['约束移除', '默认值变更'],
      },
      {
        id: 'f-status',
        severity: 'info',
        title: '新增 status 列（预期改动）',
        detail: '与 Agent 自述一致的新增列，默认 pending，无风险。',
        rationale: '与 Agent 自述一致，非风险。',
        invisibleInLineDiff: false,
        nodeId: 'col-status',
        tags: ['预期改动'],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 场景 3：CAD feature tree / BOM —— 呼应当日最高分产品 Adam（破坏设计意图）
  // ─────────────────────────────────────────────────────────────
  {
    id: 'cad',
    domain: 'CAD · feature tree / BOM',
    artifact: 'parts/bracket.ftree',
    title: '简化支架模型、清理 feature tree',
    agentSummary: '简化了支架模型、清理了冗余的 feature tree 节点，让模型更易维护。',
    agentClaimTag: '清理/简化',
    lineAdded: 1,
    lineRemoved: 2,
    lineDiff: [
      { type: 'hunk', text: '@@ feature_tree "bracket" @@' },
      { type: 'ctx', text: '   Extrude-1   { depth = 12 }' },
      { type: 'del', text: '-  Fillet-3    { radius = 2, edges = [E4,E5] }' },
      { type: 'ctx', text: '   Shell-1     { thickness = 1.2, ref = Fillet-3 }' },
      { type: 'del', text: '-  wall_thickness = 1.2' },
      { type: 'add', text: '+  wall_thickness = 0.6' },
    ],
    tree: [
      {
        id: 'ft-bracket',
        kind: 'Feature Tree',
        label: 'bracket',
        change: 'modified',
        children: [
          {
            id: 'feat-extrude',
            kind: 'Feature',
            label: 'Extrude-1',
            change: 'unchanged',
            detail: '未改动',
          },
          {
            id: 'feat-fillet',
            kind: 'Feature',
            label: 'Fillet-3',
            change: 'removed',
            detail: '被删除，但它仍是 Shell-1 的引用父节点',
            before: 'radius=2, edges=[E4,E5]',
          },
          {
            id: 'feat-shell',
            kind: 'Feature',
            label: 'Shell-1',
            change: 'modified',
            detail: '其 ref 指向已被删除的 Fillet-3（悬空引用）',
            before: 'ref = Fillet-3（存在）',
            after: 'ref = Fillet-3（已删除 → 悬空）',
          },
          {
            id: 'param-wall',
            kind: 'Parameter',
            label: 'wall_thickness',
            change: 'modified',
            detail: '壁厚参数被下调',
            before: '1.2 mm',
            after: '0.6 mm',
          },
        ],
      },
    ],
    findings: [
      {
        id: 'f-dangling',
        severity: 'critical',
        title: '删除的 Fillet-3 仍被 Shell-1 引用（悬空引用）',
        detail:
          'Shell-1 的抽壳特征基于 Fillet-3 的边构建。删除 Fillet-3 会让 Shell-1 的引用悬空，模型重建时特征链断裂 / 几何塌陷——这不是"清理冗余"，而是删掉了被依赖的父节点。',
        rationale: '违反不变量：被其它 feature 引用的节点不得删除（feature 引用完整性）。',
        invisibleInLineDiff: true,
        nodeId: 'feat-fillet',
        tags: ['引用打断', '破坏设计意图'],
      },
      {
        id: 'f-wall',
        severity: 'critical',
        title: '壁厚 0.6mm 跌破材料工艺下限',
        detail:
          'wall_thickness 从 1.2mm 改到 0.6mm。行级 diff 能看到"数值变了"，却看不出 0.6mm 已低于该材料注塑最小壁厚 1.0mm，成型会缺料 / 翘曲——这是典型的"数值可见、意图违反不可见"。',
        rationale: '违反不变量：壁厚必须 ≥ 材料工艺下限 1.0mm。',
        invisibleInLineDiff: false,
        nodeId: 'param-wall',
        tags: ['破坏设计意图', '可制造性'],
      },
      {
        id: 'f-bom',
        severity: 'warn',
        title: 'BOM / ECO 受连带影响',
        detail:
          '删除 Fillet-3 会让关联的去毛刺工序项从 BOM 中脱落，进而影响供应商 RFQ 报价与 ECO 变更记录，需要评审确认。',
        rationale: '违反不变量：几何特征变更须同步 BOM/ECO 影响评估。',
        invisibleInLineDiff: true,
        nodeId: 'feat-fillet',
        tags: ['BOM影响', '下游连带'],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 场景 4：CI 工作流 —— REVIEW 档（只有 warn，没有 critical）
  // ─────────────────────────────────────────────────────────────
  {
    id: 'ci',
    domain: 'CI · GitHub Actions',
    artifact: '.github/workflows/deploy.yml',
    title: '加缓存、加速 CI',
    agentSummary: '给 CI 加了依赖缓存来加速，并顺手把基础镜像升级到最新版本。',
    agentClaimTag: '加速优化',
    lineAdded: 4,
    lineRemoved: 1,
    lineDiff: [
      { type: 'hunk', text: '@@ jobs.build @@' },
      { type: 'ctx', text: '   steps:' },
      { type: 'add', text: '+    - uses: actions/cache@v4' },
      { type: 'add', text: '+      with:' },
      { type: 'add', text: '+        path: ~/.npm' },
      { type: 'add', text: "+        key: npm-${{ hashFiles('package-lock.json') }}" },
      { type: 'del', text: '-    container: node:20.11.1@sha256:9f3e...' },
      { type: 'ctx', text: '+    container: node:latest' },
    ],
    tree: [
      {
        id: 'job-build',
        kind: 'Job',
        label: 'build',
        change: 'modified',
        children: [
          {
            id: 'step-cache',
            kind: 'Step',
            label: 'actions/cache@v4',
            change: 'added',
            detail: '新增依赖缓存步骤（预期改动）',
            after: 'cache ~/.npm by lockfile hash',
          },
          {
            id: 'img-node',
            kind: 'Container Image',
            label: 'container.image',
            change: 'modified',
            detail: '基础镜像从固定 digest 改为浮动 tag',
            before: 'node:20.11.1@sha256:9f3e…（锁定）',
            after: 'node:latest（浮动）',
          },
        ],
      },
    ],
    findings: [
      {
        id: 'f-image',
        severity: 'warn',
        title: '基础镜像从锁定 digest 变为浮动 node:latest',
        detail:
          '镜像从固定 digest 改成 node:latest，构建将不再可复现：某天 latest 跳大版本，CI 可能无预警地跑在不同的 Node 上。这不属于"加缓存加速"的范畴。',
        rationale: '违反不变量：生产/CI 基础镜像必须固定到不可变 digest。',
        invisibleInLineDiff: false,
        nodeId: 'img-node',
        tags: ['可复现性', '供应链'],
      },
      {
        id: 'f-cache',
        severity: 'info',
        title: '新增依赖缓存步骤（预期改动）',
        detail: '与 Agent 自述一致的缓存加速，键基于 lockfile 哈希，无风险。',
        rationale: '与 Agent 自述一致，非风险。',
        invisibleInLineDiff: false,
        nodeId: 'step-cache',
        tags: ['预期改动'],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // 场景 5：应用配置 —— SAFE 档（绿色通道，证明 Contour 不是一味报警）
  // ─────────────────────────────────────────────────────────────
  {
    id: 'config',
    domain: '应用配置 · YAML',
    artifact: 'config/app.yaml',
    title: '抽取公共超时默认值',
    agentSummary: '把三处重复的 timeout 配置抽成一个公共默认值，行为保持不变。',
    agentClaimTag: '重构',
    lineAdded: 5,
    lineRemoved: 3,
    lineDiff: [
      { type: 'hunk', text: '@@ config @@' },
      { type: 'add', text: '+ defaults:' },
      { type: 'add', text: '+   timeout: 30' },
      { type: 'ctx', text: '  services:' },
      { type: 'ctx', text: '    api:' },
      { type: 'del', text: '-      timeout: 30' },
      { type: 'add', text: '+      <<: *defaults' },
      { type: 'ctx', text: '    worker:' },
      { type: 'del', text: '-      timeout: 30' },
      { type: 'add', text: '+      <<: *defaults' },
    ],
    tree: [
      {
        id: 'cfg-root',
        kind: 'Config',
        label: 'app.yaml',
        change: 'modified',
        children: [
          {
            id: 'svc-api',
            kind: 'Service',
            label: 'services.api.timeout',
            change: 'unchanged',
            detail: '生效值仍为 30（改为引用公共默认，等价）',
            before: '30',
            after: '30（← defaults）',
          },
          {
            id: 'svc-worker',
            kind: 'Service',
            label: 'services.worker.timeout',
            change: 'unchanged',
            detail: '生效值仍为 30（改为引用公共默认，等价）',
            before: '30',
            after: '30（← defaults）',
          },
        ],
      },
    ],
    findings: [
      {
        id: 'f-equiv',
        severity: 'info',
        title: '纯重构：所有生效值语义等价',
        detail:
          '语义比对显示，抽取公共默认后所有 service 的 timeout 生效值仍为 30，无任何行为差异。这是一次真正安全的改动——Contour 也会明确给出"可放心 merge"。',
        rationale: '所有叶子配置项的生效值 before == after，行为等价。',
        invisibleInLineDiff: false,
        nodeId: 'cfg-root',
        tags: ['行为等价', '安全'],
      },
    ],
  },
];
