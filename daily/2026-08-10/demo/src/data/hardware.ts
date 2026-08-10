import type { Hardware } from '../types';

// 消费级硬件档位（mock）。Apple 为统一内存里可分给训练的近似预算。
export const HARDWARE: Hardware[] = [
  { id: 'rtx3050-4', name: '4GB（如 RTX 3050 Laptop）', kind: 'nvidia', vramGB: 4 },
  { id: 'rtx4060-8', name: '8GB（如 RTX 4060 Laptop）', kind: 'nvidia', vramGB: 8 },
  { id: 'rtx4070-12', name: '12GB（如 RTX 4070）', kind: 'nvidia', vramGB: 12 },
  { id: 'rtx4090-24', name: '24GB（如 RTX 4090）', kind: 'nvidia', vramGB: 24 },
  { id: 'apple-m-16', name: 'Apple M 系 · 16GB 统一内存（约 11GB 可用）', kind: 'apple', vramGB: 11 },
];
