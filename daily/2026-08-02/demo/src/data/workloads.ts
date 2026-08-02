// 换挡 Downshift — mock 工作负载。
// 每个工作负载 = 一批历史 agent trace 的汇总 + 现有模型 A + 候选便宜模型 B。
// A/B 价目参考报告披露的 V4-Pro 与 V4-Flash 量级（Flash：$0.14 未命中 / $0.0028 命中 / $0.28 输出），
// 但所有数值为演示用途、非实测跑分。4 个负载覆盖 4 档裁决，数值已用一次性脚本预校验：
//   编码 PR 车队      → 值得换   (诚实 0.25×，−75%；表面 −87%)
//   长上下文文档 QA   → 有条件换 (诚实 0.32×，−68%；成功率 84% 略低于 85% 底线)
//   工具编排客服      → 先修再换 (诚实 0.33×，−67%；成功率 79% 明显低于 85% 底线)
//   实时语音 agent    → 别换     (诚实 1.35×，+35%；表面 −25% 却反而更贵)

import type { Workload } from '../types';

// 报告披露的 V4-Pro / V4-Flash 量级价目（$/百万 token）
const PRO = { inputMiss: 0.55, inputHit: 0.05, output: 2.19 };
const FLASH = { inputMiss: 0.14, inputHit: 0.0028, output: 0.28 };

export const WORKLOADS: Workload[] = [
  {
    id: 'coding',
    name: '编码 PR 车队',
    scene: 'Codex 式 coding agent，任务→PR，长上下文、多轮工具调用',
    floor: 0.75,
    tasksPerMonth: 40000,
    A: {
      name: 'V4-Pro（现有）',
      price: PRO,
      baseInTok: 120000,
      baseOutTok: 8000,
      cacheHit: 0.6,
      success: 0.82,
      stepMult: 1,
      verbosity: 1,
    },
    B: {
      name: 'V4-Flash（候选）',
      price: FLASH,
      baseInTok: 120000,
      baseOutTok: 8000,
      cacheHit: 0.5,
      success: 0.8,
      stepMult: 1.05,
      verbosity: 1.1,
    },
  },
  {
    id: 'docqa',
    name: '长上下文文档 QA',
    scene: '把整本文档灌进上下文做问答，超长输入、短输出',
    floor: 0.85,
    tasksPerMonth: 120000,
    A: {
      name: 'V4-Pro（现有）',
      price: PRO,
      baseInTok: 300000,
      baseOutTok: 4000,
      cacheHit: 0.7,
      success: 0.9,
      stepMult: 1,
      verbosity: 1,
    },
    B: {
      name: 'V4-Flash（候选）',
      price: FLASH,
      baseInTok: 300000,
      baseOutTok: 4000,
      cacheHit: 0.6,
      success: 0.84,
      stepMult: 1.1,
      verbosity: 1.05,
    },
  },
  {
    id: 'support',
    name: '工具编排客服',
    scene: '多工具编排的客服 agent，强依赖工具调用格式遵从',
    floor: 0.85,
    tasksPerMonth: 300000,
    A: {
      name: 'V4-Pro（现有）',
      price: PRO,
      baseInTok: 30000,
      baseOutTok: 3000,
      cacheHit: 0.7,
      success: 0.9,
      stepMult: 1,
      verbosity: 1,
    },
    B: {
      name: 'V4-Flash（候选）',
      price: FLASH,
      baseInTok: 30000,
      baseOutTok: 3000,
      cacheHit: 0.55,
      success: 0.79,
      stepMult: 1.25,
      verbosity: 1.15,
    },
  },
  {
    id: 'voice',
    name: '实时语音 agent',
    scene: '实时语音助理，两个相近档模型互比（B 仅便宜约四分之一）',
    floor: 0.82,
    tasksPerMonth: 200000,
    A: {
      name: '现有语音模型 A',
      price: { inputMiss: 0.3, inputHit: 0.03, output: 1.2 },
      baseInTok: 15000,
      baseOutTok: 2000,
      cacheHit: 0.5,
      success: 0.88,
      stepMult: 1,
      verbosity: 1,
    },
    B: {
      name: '便宜语音模型 B',
      price: { inputMiss: 0.22, inputHit: 0.02, output: 0.9 },
      baseInTok: 15000,
      baseOutTok: 2000,
      cacheHit: 0.4,
      success: 0.8,
      stepMult: 1.4,
      verbosity: 1.2,
    },
  },
];
