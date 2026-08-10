// 全部类型定义。纯前端 Demo，无任何真实后端/外部数据。

export type DecisionPath = 'PROMPT_RAG' | 'SFT_LORA' | 'PREF_ALIGN' | 'DISTILL';

export type MethodId =
  | 'PROMPT_RAG'
  | 'SFT_LORA'
  | 'DPO'
  | 'ORPO'
  | 'SIMPO'
  | 'KTO'
  | 'DISTILL';

export interface TaskDef {
  id: string;
  name: string;
  desc: string;
  /** 该任务最自然的决策路径（仅作亲和度提示，引擎仍结合数据画像判断） */
  affinity: DecisionPath;
  /** 是否本质上需要新鲜/私有"事实"知识（偏向 RAG，而非微调） */
  needsFreshKnowledge: boolean;
  /** 是否本质上是"偏好/行为/语气对齐"问题 */
  preferenceNature: boolean;
}

export interface ModelDef {
  id: string;
  name: string;
  paramsB: number; // 参数量（十亿）
  layers: number; // decoder 层数（公开近似）
  hidden: number; // hidden size（公开近似）
  note: string;
}

export interface Hardware {
  id: string;
  name: string;
  kind: 'nvidia' | 'apple';
  vramGB: number; // NVIDIA 为显存；Apple 为统一内存可用预算
}

export type DataSizeBucket = 'tiny' | 'small' | 'medium' | 'large';

export interface DataProfile {
  sizeBucket: DataSizeBucket;
  hasPreferencePairs: boolean; // 是否有成对偏好数据（chosen/rejected）
  hasLabels: boolean; // 是否有标注/示例（含二元 好/坏 信号）
  quality: 'noisy' | 'ok' | 'clean';
}

export interface LabConfig {
  taskId: string;
  modelId: string;
  hardwareId: string;
  data: DataProfile;
}

export type Verdict = 'fits' | 'tight' | 'oom';

export interface Decision {
  path: DecisionPath;
  method: MethodId;
  headline: string;
  reasons: string[];
  /** 结论敏感度：什么情况下结论会改变 */
  sensitivity: string[];
  /** 如果选错方法的代价 */
  wrongChoiceCost: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface VramBudget {
  layers: number;
  hidden: number;
  paramsB: number;
  vramGB: number;
  hardwareKind: 'nvidia' | 'apple';
  // 组成项（GB）
  activationsGB: number;
  overheadGB: number;
  loraStateGB: number;
  weightsResidentFp16GB: number;
  weightsResidentNf4GB: number;
  perLayerNf4GB: number;
  weightsStreamGB: number;
  streamBufferLayers: number;
  // 峰值（GB）
  residentFp16PeakGB: number;
  residentNf4PeakGB: number;
  streamNf4PeakGB: number;
  // 判定
  verdictResidentNf4: Verdict;
  verdictStreamNf4: Verdict;
  /** 常驻(NF4)开始能舒适塞下的最小显存（低于它才真正需要逐层流式） */
  crossoverVramGB: number;
}

export interface MethodRow {
  id: MethodId;
  name: string;
  family: string;
  dataNeed: string;
  vramProfile: string;
  whenToUse: string;
  whenNotTo: string;
  /** 在当前配置下与推荐方法的契合度 */
  fit: 'best' | 'ok' | 'no';
  fitNote: string;
}

export interface PlanStep {
  title: string;
  detail: string;
}
