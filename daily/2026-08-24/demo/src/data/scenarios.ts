import type { ScenarioPreset } from '../types';

// 3 个预设创业画像，用于一键演示「甜点架构随场景漂移」——没有单一赢家。
export const SCENARIOS: ScenarioPreset[] = [
  {
    id: 'legal',
    name: '低频重任务 · 法务 AI 助理',
    blurb: '任务少但每次很长、会话常开着等人看结果 → 闲置比高，云端常驻很受伤，边缘按需「用完即散」最划算。',
    profile: {
      mau: 300,
      tasksPerUserPerDay: 2,
      avgTaskMinutes: 22,
      idleRatio: 0.62,
      burstMultiplier: 2.2,
      whaleRatio: 0.08,
      whaleAmplify: 6,
      pricePerMonth: 29,
    },
  },
  {
    id: 'support',
    name: '高并发轻任务 · 客服 agent',
    blurb: '任务短、并发峰值高、闲置低 → 云端常驻的常热机反而最稳最划算，自建 VPS 被峰值预置拖累。',
    profile: {
      mau: 1200,
      tasksPerUserPerDay: 14,
      avgTaskMinutes: 1.5,
      idleRatio: 0.2,
      burstMultiplier: 4.5,
      whaleRatio: 0.06,
      whaleAmplify: 4,
      pricePerMonth: 9,
    },
  },
  {
    id: 'research',
    name: '长时后台 · research agent',
    blurb: '任务超长、常有「来了不回」的重度用户 → 鲸鱼把用量驱动的成本放大，所有架构毛利都被压薄，务必设配额。',
    profile: {
      mau: 400,
      tasksPerUserPerDay: 3,
      avgTaskMinutes: 18,
      idleRatio: 0.35,
      burstMultiplier: 2.8,
      whaleRatio: 0.18,
      whaleAmplify: 7,
      pricePerMonth: 24,
    },
  },
];

// 沙盘默认画像：一个平价订阅、闲置偏高、有少量鲸鱼的典型「AI 员工」产品。
export const DEFAULT_PROFILE = {
  mau: 400,
  tasksPerUserPerDay: 5,
  avgTaskMinutes: 3,
  idleRatio: 0.6,
  burstMultiplier: 3,
  whaleRatio: 0.1,
  whaleAmplify: 6,
  pricePerMonth: 12,
};
