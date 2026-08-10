import type { MethodId } from '../types';

export interface MethodMeta {
  id: MethodId;
  name: string;
  family: string;
  dataNeed: string;
  vramProfile: string;
  whenToUse: string;
  whenNotTo: string;
}

// 方法家族知识库（mock，但对齐社区常识）。用于"方法对号矩阵"。
export const METHODS: MethodMeta[] = [
  {
    id: 'PROMPT_RAG',
    name: 'Prompt / RAG（先不微调）',
    family: '不训练 / 检索增强',
    dataNeed: '几乎不需要训练数据；有一份可检索的知识库即可',
    vramProfile: '推理级显存，几乎无训练开销',
    whenToUse: '需求是"新鲜/私有事实知识"，或数据太少、想先拉起 baseline',
    whenNotTo: '需求是稳定的行为/格式/语气——那是微调更擅长的',
  },
  {
    id: 'SFT_LORA',
    name: 'SFT（LoRA/QLoRA 监督微调）',
    family: '监督微调',
    dataNeed: '一批"输入→期望输出"的标注示例',
    vramProfile: 'LoRA 只训小适配器，显存友好；配 4-bit 更省',
    whenToUse: '教模型固定的格式/风格/话术/抽取 schema',
    whenNotTo: '需求是"哪个回答更好"的偏好排序，或只想灌事实知识',
  },
  {
    id: 'DPO',
    name: 'DPO（直接偏好优化）',
    family: '偏好对齐',
    dataNeed: '成对偏好数据（chosen / rejected）',
    vramProfile: '需同时持有策略与参考模型，显存高于纯 SFT',
    whenToUse: '有成对偏好，想稳定地把模型往人类偏好拉',
    whenNotTo: '没有成对偏好数据；或显存非常紧张（参考模型占显存）',
  },
  {
    id: 'ORPO',
    name: 'ORPO（单阶段偏好对齐）',
    family: '偏好对齐',
    dataNeed: '成对偏好数据；可省去单独的 SFT 阶段',
    vramProfile: '单阶段、无需单独参考模型，链路更短',
    whenToUse: '想一步到位：在偏好对齐里顺带完成 SFT，省一个阶段',
    whenNotTo: '没有成对偏好数据；或已单独做过 SFT 只想做纯偏好',
  },
  {
    id: 'SIMPO',
    name: 'SimPO（无参考模型偏好对齐）',
    family: '偏好对齐',
    dataNeed: '成对偏好数据',
    vramProfile: '免参考模型 → 显著省显存，最适合低显存卡',
    whenToUse: '有成对偏好，但显存很紧（如 4GB），想去掉参考模型这块显存',
    whenNotTo: '没有成对偏好数据；或对超参极其敏感、缺乏调参预算',
  },
  {
    id: 'KTO',
    name: 'KTO（二元 好/坏 偏好）',
    family: '偏好对齐',
    dataNeed: '只需二元 好/坏 标签，不必成对',
    vramProfile: '与偏好方法相当',
    whenToUse: '只有"这条好/这条坏"的单条反馈，凑不出成对数据',
    whenNotTo: '有更丰富的成对偏好（那用 DPO/ORPO/SimPO 信息更足）',
  },
  {
    id: 'DISTILL',
    name: '蒸馏（大模型→小模型）',
    family: '知识蒸馏',
    dataNeed: '教师模型输出/软标签，或一批目标任务样本',
    vramProfile: '取决于学生模型大小；学生小则显存友好',
    whenToUse: '想用小模型逼近大模型在某任务上的表现，便于端侧部署',
    whenNotTo: '本就想直接提升同一个模型的行为/偏好',
  },
];

export const METHOD_MAP: Record<MethodId, MethodMeta> = METHODS.reduce(
  (acc, m) => {
    acc[m.id] = m;
    return acc;
  },
  {} as Record<MethodId, MethodMeta>,
);
