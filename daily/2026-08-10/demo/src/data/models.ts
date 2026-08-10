import type { ModelDef } from '../types';

// 基座模型的"公开近似架构"，仅用于透明显存估算。数值为公开资料的近似值，非厂商官方口径。
export const MODELS: ModelDef[] = [
  {
    id: 'small-1b',
    name: '≈1B（如 Llama-3.2-1B 量级）',
    paramsB: 1.24,
    layers: 16,
    hidden: 2048,
    note: '入门端侧模型，层数少、单层小。',
  },
  {
    id: 'small-3b',
    name: '≈3B（如 Llama-3.2-3B 量级）',
    paramsB: 3.21,
    layers: 28,
    hidden: 3072,
    note: '端侧/低成本部署常用档。',
  },
  {
    id: 'mid-8b',
    name: '≈8B（如 Llama-3.1-8B 量级）',
    paramsB: 8.03,
    layers: 32,
    hidden: 4096,
    note: '报告中 Soup CLI 的示例模型量级。',
  },
  {
    id: 'mid-14b',
    name: '≈14B（如 Qwen2.5-14B 量级）',
    paramsB: 14.8,
    layers: 48,
    hidden: 5120,
    note: '消费级显卡的上限压力区。',
  },
];
