// 确定性决策 + 显存预算引擎。全部为透明规则/公式，无 LLM、无网络、无随机。
// 目的：把 Soup 那类工具"黑箱替你决定"的推理显性化，并厂商中立地给出建议。

import type {
  DataProfile,
  Decision,
  Hardware,
  MethodId,
  MethodRow,
  ModelDef,
  PlanStep,
  TaskDef,
  Verdict,
  VramBudget,
} from '../types';
import { METHODS } from '../data/methods';

// ---- 显存公式的透明常量（GB / 每 B 参数字节数）。均为"教学级"估算，非厂商实测。----
export const BYTES_FP16 = 2;
export const BYTES_NF4 = 0.5;
export const OVERHEAD_GB = 0.6; // 框架 + CUDA/Metal 上下文的固定开销
export const LORA_STATE_GB = 0.2; // LoRA 适配器 + 优化器状态（小）
export const ACT_BASE_GB = 1.1; // hidden=4096, seq=1024, micro-batch=1 时的近似激活显存
export const STREAM_BUFFER_LAYERS = 2; // 逐层流式时常驻的层缓冲（当前层 + 预取）
const SEQ_LEN = 1024;
const MICRO_BATCH = 1;

function round(n: number, d = 2): number {
  const f = Math.pow(10, d);
  return Math.round(n * f) / f;
}

/** 激活显存估算：随 hidden 与序列长度线性缩放（透明、可解释）。 */
export function estimateActivationsGB(hidden: number): number {
  return round((hidden / 4096) * (SEQ_LEN / 1024) * MICRO_BATCH * ACT_BASE_GB);
}

function verdict(peakGB: number, vramGB: number): Verdict {
  if (peakGB <= vramGB * 0.85) return 'fits';
  if (peakGB <= vramGB) return 'tight';
  return 'oom';
}

/**
 * 显存预算：对比三种策略的峰值——
 *  - 常驻 fp16（不量化，全模型驻显存）
 *  - 常驻 NF4（4-bit 量化，全模型驻显存，QLoRA 式）
 *  - 逐层流式 + NF4（峰值由"一层缓冲"界定，而非整模型）
 */
export function computeVram(model: ModelDef, hw: Hardware): VramBudget {
  const activationsGB = estimateActivationsGB(model.hidden);

  const weightsResidentFp16GB = round(model.paramsB * BYTES_FP16);
  const weightsResidentNf4GB = round(model.paramsB * BYTES_NF4);
  const perLayerNf4GB = round(weightsResidentNf4GB / model.layers, 3);
  const weightsStreamGB = round(perLayerNf4GB * STREAM_BUFFER_LAYERS, 3);

  const fixed = activationsGB + OVERHEAD_GB + LORA_STATE_GB;
  const residentFp16PeakGB = round(weightsResidentFp16GB + fixed);
  const residentNf4PeakGB = round(weightsResidentNf4GB + fixed);
  const streamNf4PeakGB = round(weightsStreamGB + fixed);

  // 常驻(NF4)开始能"舒适"塞下的最小显存（留 15% headroom）
  const crossoverVramGB = round(residentNf4PeakGB / 0.85, 1);

  return {
    layers: model.layers,
    hidden: model.hidden,
    paramsB: model.paramsB,
    vramGB: hw.vramGB,
    hardwareKind: hw.kind,
    activationsGB,
    overheadGB: OVERHEAD_GB,
    loraStateGB: LORA_STATE_GB,
    weightsResidentFp16GB,
    weightsResidentNf4GB,
    perLayerNf4GB,
    weightsStreamGB,
    streamBufferLayers: STREAM_BUFFER_LAYERS,
    residentFp16PeakGB,
    residentNf4PeakGB,
    streamNf4PeakGB,
    verdictResidentNf4: verdict(residentNf4PeakGB, hw.vramGB),
    verdictStreamNf4: verdict(streamNf4PeakGB, hw.vramGB),
    crossoverVramGB,
  };
}

// ---- 决策树：该不该微调 / 怎么调 ----
export function decide(task: TaskDef, data: DataProfile, hw: Hardware): Decision {
  const lowVram = hw.vramGB <= 6;

  // 1) 知识型需求 → 先别微调，用 RAG
  if (task.needsFreshKnowledge) {
    return {
      path: 'PROMPT_RAG',
      method: 'PROMPT_RAG',
      headline: '先别微调 —— 这是"知识"问题，用 RAG 更对',
      reasons: [
        '微调擅长教"行为 / 格式 / 语气"，不擅长灌"最新 / 私有事实"；把知识塞进权重既贵又会过时。',
        'RAG 更便宜、可随时更新、答案可溯源到具体文档，符合"领域问答"的本质。',
        '若还需要固定输出格式或语气，可在 RAG 之上再叠一层轻量 SFT，而不是一上来就微调。',
      ],
      sensitivity: [
        '如果需求从"查事实"变成"稳定的固定格式/语气" → 结论转向 SFT-LoRA。',
        '如果知识极其稳定、量很小且必须离线固化 → 才考虑把知识也纳入微调。',
      ],
      wrongChoiceCost: '若强行微调来灌知识：烧显存与时间，知识一更新就得重训，且容易产生自信的幻觉。',
      confidence: 'high',
    };
  }

  // 2) 数据太少 → 先用 prompt/few-shot 起步
  if (data.sizeBucket === 'tiny') {
    return {
      path: 'PROMPT_RAG',
      method: 'PROMPT_RAG',
      headline: '先别微调 —— 样本太少，先用 few-shot / prompt 起步',
      reasons: [
        '样本量过小（约 <50 条）时微调极易过拟合，收益不稳，还很难评估。',
        '先用 few-shot prompt 把 baseline 拉起来，同时把这批数据当作评估集与冷启动语料。',
        '等攒到成百上千条高质量样本，再回来做 LoRA 才划算。',
      ],
      sensitivity: [
        '样本量升到 small/medium 且有标注 → 转向 SFT-LoRA。',
        '若积累出成对偏好数据 → 转向偏好对齐（DPO/ORPO/SimPO）。',
      ],
      wrongChoiceCost: '用几十条数据硬微调：模型记住噪声、泛化差，你还以为"调过了"从而误判。',
      confidence: 'high',
    };
  }

  // 3) 蒸馏型任务
  if (task.affinity === 'DISTILL') {
    return {
      path: 'DISTILL',
      method: 'DISTILL',
      headline: '走蒸馏 —— 让小模型逼近大模型的目标能力',
      reasons: [
        '目标是"用更小模型达到接近大模型的表现"，这正是知识蒸馏的定位。',
        '学生模型小 → 端侧/低成本部署友好，显存压力主要取决于学生规模。',
        '可先用大模型批量生成软标签/示范，再用 SFT-LoRA 方式训小模型。',
      ],
      sensitivity: [
        '如果其实只想提升"同一个模型"的行为 → 不该蒸馏，应直接 SFT 或偏好对齐。',
        '如果缺教师输出且难获取 → 蒸馏收益下降，回退到直接标注 + SFT。',
      ],
      wrongChoiceCost: '把"提升同模型行为"的需求错当蒸馏：多引入一个教师环节，复杂度和成本白涨。',
      confidence: 'medium',
    };
  }

  // 4) 偏好/行为对齐型任务
  if (task.preferenceNature) {
    if (data.hasPreferencePairs) {
      // 有成对偏好：低显存优先 SimPO（免参考模型），否则 ORPO（单阶段）
      const method: MethodId = lowVram ? 'SIMPO' : 'ORPO';
      return {
        path: 'PREF_ALIGN',
        method,
        headline:
          method === 'SIMPO'
            ? '走偏好对齐 · SimPO —— 有成对偏好 + 显存紧，免参考模型最省'
            : '走偏好对齐 · ORPO —— 有成对偏好，单阶段一步到位',
        reasons: [
          '任务本质是"哪个回答更好"的排序问题，不是唯一正确答案 → 属偏好/行为对齐，而非 SFT。',
          '你有成对偏好数据（chosen/rejected），可直接做偏好优化。',
          method === 'SIMPO'
            ? '显存偏紧：SimPO 去掉参考模型，省下一整块模型的显存，最适合低显存卡。'
            : 'ORPO 单阶段完成"SFT+偏好"，省掉单独的 SFT 阶段，链路更短。',
        ],
        sensitivity: [
          '显存变宽裕（>6GB）→ 可换 ORPO/DPO 拿更稳的效果；显存更紧 → 坚持 SimPO。',
          '若已单独做过 SFT，只想做纯偏好 → 用 DPO；若偏好数据退化为二元好/坏 → 用 KTO。',
        ],
        wrongChoiceCost: '把偏好问题当 SFT 做：模型只会"模仿被选答案的表面"，学不会"为什么这条更好"的排序。',
        confidence: 'high',
      };
    }
    if (data.hasLabels) {
      return {
        path: 'PREF_ALIGN',
        method: 'KTO',
        headline: '走偏好对齐 · KTO —— 只有二元 好/坏，凑不出成对也能对齐',
        reasons: [
          '任务是偏好/行为对齐，但你只有"这条好/这条坏"的单条反馈，凑不出成对数据。',
          'KTO 只需二元 好/坏 标签即可做偏好优化，正好匹配你的数据形态。',
          '先用 KTO 起步，日后若能收集到成对偏好，再升级到 DPO/ORPO 信息量更足。',
        ],
        sensitivity: [
          '一旦能整理出成对 chosen/rejected → 升级到 DPO / ORPO / SimPO。',
          '若其实存在唯一正确答案（非偏好排序）→ 应改用 SFT-LoRA。',
        ],
        wrongChoiceCost: '硬凑成对偏好数据：标注成本高且质量差，不如先用 KTO 吃现有的二元信号。',
        confidence: 'medium',
      };
    }
    // 偏好任务但既无成对也无标签
    return {
      path: 'PROMPT_RAG',
      method: 'PROMPT_RAG',
      headline: '先别微调 —— 是偏好问题，但你还没有偏好数据',
      reasons: [
        '这是"哪个更好"的偏好对齐问题，而偏好方法（DPO/ORPO/SimPO/KTO）都需要偏好信号。',
        '当前既无成对偏好、也无好/坏标签 → 先用 prompt 约束行为，同时开始收集偏好数据。',
        '偏好数据（哪怕是二元好/坏）到位后，再进偏好对齐才有意义。',
      ],
      sensitivity: [
        '收集到二元 好/坏 → 转 KTO；收集到成对 chosen/rejected → 转 DPO/ORPO/SimPO。',
      ],
      wrongChoiceCost: '没有偏好数据就跑偏好对齐：无信号可学，等于空跑，纯浪费算力。',
      confidence: 'high',
    };
  }

  // 5) 其余：风格/格式/抽取类 → 有标注则 SFT-LoRA
  if (data.hasLabels) {
    return {
      path: 'SFT_LORA',
      method: 'SFT_LORA',
      headline: '走 SFT · LoRA —— 教模型固定的格式/风格/话术',
      reasons: [
        '任务是"稳定地按某种格式/风格/话术输出"，有"输入→期望输出"的监督示例，正是 SFT 的主场。',
        'LoRA 只训小适配器、配 4-bit 量化，显存友好，消费级卡也跑得动。',
        '不是偏好排序、也不是灌新知识，所以不用上偏好对齐或 RAG。',
      ],
      sensitivity: [
        '如果需求其实是"哪个回答更好"的排序 → 转偏好对齐（DPO/ORPO/SimPO/KTO）。',
        '如果需求其实依赖会更新的事实知识 → 转 RAG。',
        '数据若退化到 tiny → 先回退到 few-shot prompt。',
      ],
      wrongChoiceCost: '该 SFT 却去做偏好对齐：偏好方法需要偏好数据，用错方法要么跑不动要么学偏。',
      confidence: 'high',
    };
  }

  // 6) 无标注的格式/风格任务 → 先补数据
  return {
    path: 'PROMPT_RAG',
    method: 'PROMPT_RAG',
    headline: '先别微调 —— 缺少可监督的示例，先补数据或用 prompt',
    reasons: [
      '要教格式/风格，需要"输入→期望输出"的标注示例，但当前没有标注。',
      '先用 prompt/few-shot 把 baseline 拉起来，同时把线上产出整理成标注语料。',
      '有了成百上千条标注后再做 SFT-LoRA，效果与可评估性都更好。',
    ],
    sensitivity: ['补齐标注示例（small 及以上）→ 转 SFT-LoRA。'],
    wrongChoiceCost: '无标注硬做 SFT：没有监督信号，模型学不到你要的格式/风格。',
    confidence: 'high',
  };
}

// ---- 方法对号矩阵：给每个方法在当前配置下打 best/ok/no ----
export function buildMethodMatrix(
  decision: Decision,
  data: DataProfile,
  hw: Hardware,
): MethodRow[] {
  const lowVram = hw.vramGB <= 6;
  return METHODS.map((m) => {
    let fit: MethodRow['fit'] = 'ok';
    let fitNote = '';

    if (m.id === decision.method) {
      fit = 'best';
      fitNote = '← 当前配置下的推荐方法';
    } else {
      switch (m.id) {
        case 'PROMPT_RAG':
          if (decision.method === 'PROMPT_RAG') {
            fit = 'best';
          } else {
            fit = 'ok';
            fitNote = '总能作为不训练的兜底/baseline，但解决不了"稳定行为/偏好"。';
          }
          break;
        case 'SFT_LORA':
          if (!data.hasLabels) {
            fit = 'no';
            fitNote = '缺"输入→输出"标注示例，SFT 无监督信号。';
          } else {
            fitNote = '能学格式/风格，但学不会"哪个更好"的偏好排序。';
          }
          break;
        case 'DPO':
        case 'ORPO':
        case 'SIMPO':
          if (!data.hasPreferencePairs) {
            fit = 'no';
            fitNote = '需要成对偏好（chosen/rejected），当前没有。';
          } else if (m.id === 'SIMPO' && !lowVram) {
            fitNote = '可用；但显存不紧时，ORPO/DPO 通常更稳。';
          } else if ((m.id === 'DPO' || m.id === 'ORPO') && lowVram) {
            fit = 'no';
            fitNote = '需持有参考模型，低显存卡吃力；低显存优先 SimPO。';
          } else {
            fitNote = '可用的偏好对齐方法之一。';
          }
          break;
        case 'KTO':
          if (!data.hasLabels && !data.hasPreferencePairs) {
            fit = 'no';
            fitNote = '连二元 好/坏 标签都没有，无法对齐。';
          } else if (data.hasPreferencePairs) {
            fitNote = '可用；但已有成对偏好时，DPO/ORPO/SimPO 信息更足。';
          } else {
            fitNote = '只有二元 好/坏 时的偏好对齐选择。';
          }
          break;
        case 'DISTILL':
          if (decision.method !== 'DISTILL') {
            fit = 'no';
            fitNote = '当前不是"大模型→小模型"的蒸馏诉求。';
          }
          break;
      }
    }
    return {
      id: m.id,
      name: m.name,
      family: m.family,
      dataNeed: m.dataNeed,
      vramProfile: m.vramProfile,
      whenToUse: m.whenToUse,
      whenNotTo: m.whenNotTo,
      fit,
      fitNote,
    };
  });
}

// ---- 训练计划：按推荐方法生成可勾选清单 ----
export function buildPlan(
  decision: Decision,
  data: DataProfile,
  hw: Hardware,
  budget: VramBudget,
): PlanStep[] {
  const isPref = decision.path === 'PREF_ALIGN';
  const isTrain = decision.method !== 'PROMPT_RAG';
  const quant = hw.vramGB <= 8 ? 'NF4 4-bit（低显存必开）' : '视情况：8GB 以下建议 NF4，12GB+ 可用 bf16/8-bit';
  const lr =
    decision.method === 'SFT_LORA'
      ? 'LoRA SFT：1e-4 ~ 2e-4，r=8~16，1~3 epoch（数据越干净 epoch 越少）'
      : isPref
        ? '偏好对齐：5e-6 ~ 1e-5，1~2 epoch，beta≈0.1（SimPO 需另调 gamma）'
        : '蒸馏：按学生模型规模取 1e-4 量级，1~3 epoch';

  if (!isTrain) {
    return [
      { title: '① 先不训练：搭 RAG / few-shot', detail: '整理知识库或少量示例，先把 prompt baseline 建起来。' },
      { title: '② 建评估集', detail: '从你的真实样本切一份 holdout，量化"改进了没有"，避免凭感觉。' },
      { title: '③ 达到数据门槛再回来', detail: '积累到 small+ 标注或成对偏好后，再回到本副驾重新决策微调路线。' },
    ];
  }

  const steps: PlanStep[] = [
    {
      title: '① 数据预检',
      detail:
        data.quality === 'noisy'
          ? '数据偏脏：先去重、过滤毒性/超长样本、修正标签，再谈训练（否则学的是噪声）。'
          : '去重、检查长度分布与标签一致性；坏样本在训练前拦截。',
    },
    {
      title: `② 方法：${decision.method}`,
      detail: decision.headline,
    },
    { title: '③ 量化策略', detail: quant },
    {
      title: '④ 显存策略',
      detail:
        budget.verdictResidentNf4 === 'oom'
          ? `常驻(NF4) 峰值≈${budget.residentNf4PeakGB}GB 塞不下你的 ${budget.vramGB}GB → 用逐层流式（峰值≈${budget.streamNf4PeakGB}GB），以时间换显存。`
          : `常驻(NF4) 峰值≈${budget.residentNf4PeakGB}GB 可塞进 ${budget.vramGB}GB → 优先常驻（更快）；不必强上逐层流式。`,
    },
    { title: '⑤ 学习率 / epoch（按规则）', detail: lr },
    {
      title: '⑥ 从你的数据派生 evals',
      detail: '切 10~20% 作 holdout，定义与业务对齐的自动评估；没有评估的训练等于盲跑。',
    },
    {
      title: '⑦ 保存前 gate',
      detail: '只有当 holdout 指标不降时才保存 checkpoint，防止"训崩了还覆盖上一个好模型"。',
    },
  ];

  if (isPref) {
    steps.push({
      title: '⑧ reward-hacking 观测',
      detail:
        '偏好对齐最易"刷分"：监控 reward 上升但真实指标/人评背离、回答变长变空洞、复读高频套路——出现即回滚。',
    });
  }

  return steps;
}
