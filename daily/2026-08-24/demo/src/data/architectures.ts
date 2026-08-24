import type { Architecture } from '../types';

// 四种「给 agent 配电脑」的运行时架构。isolation / reliability / costEfficiency 为 0-100 的
// 定性档案分（代表该架构的原型特征，用于不可能三角雷达）；coldStartMs、单价等为建模假设。
// 重要：这些数字是我基于常识设定的建模假设，不是真实云报价（见方法论页透明声明）。
export const ARCHITECTURES: Architecture[] = [
  {
    id: 'self-vps',
    name: '自建 VPS 常驻',
    tagline: '自己开一批 VPS，按峰值并发常驻 24/7，多个 agent 会话共享实例',
    refProduct: '报告中「用 Hermes / OpenClaw 自己开 VPS」的路子',
    costBearer: '厂商（按峰值预置，闲置全浪费）',
    isolation: 55,
    reliability: 72,
    costEfficiency: 40,
    coldStartMs: 400,
    lockInNote: '无云厂商锁定，但要自己扛运维、扩缩容与安全隔离',
    deliversAutonomy: true,
    opsRiskPenalty: 20,
  },
  {
    id: 'local',
    name: '本地客户端',
    tagline: 'agent 跑在用户自己的电脑上，厂商基本只出模型与控制面',
    refProduct: 'AutoClaw（一键本地 OpenClaw 桌面数字员工）',
    costBearer: '用户设备（厂商基础设施成本极低）',
    isolation: 30,
    reliability: 38,
    costEfficiency: 92,
    coldStartMs: 250,
    lockInNote: '无云成本，但受限于用户机器，且用户关机就停',
    deliversAutonomy: false,
    opsRiskPenalty: 999,
    capabilityGap: '不满足「你离开时继续把活干完」——用户关机 / 离线即中断',
  },
  {
    id: 'cloud-persistent',
    name: '云端常驻',
    tagline: '每个活跃会话在云上占一台常驻热机，会话开着就一直计费（含闲置）',
    refProduct: 'Epho（云端常驻跑 Claude Code）',
    costBearer: '厂商（机器成本前置，闲置也烧钱）',
    isolation: 88,
    reliability: 86,
    costEfficiency: 45,
    coldStartMs: 300,
    lockInNote: '云厂商锁定中等，架构直观但闲置成本高',
    deliversAutonomy: true,
    opsRiskPenalty: 6,
  },
  {
    id: 'edge-ondemand',
    name: '边缘按需召唤',
    tagline: 'Linux 只在某次 tool-call 时被召唤、用完即散；会话即边缘对象里的一行',
    refProduct: 'Construct Computer（Cloudflare 边缘，$9/月起）',
    costBearer: '厂商（只有真的在干活才计费）',
    isolation: 84,
    reliability: 66,
    costEfficiency: 82,
    coldStartMs: 1900,
    lockInNote: '强绑边缘全家桶（Durable Objects / Sandbox SDK），迁移与深度定制受限',
    deliversAutonomy: true,
    opsRiskPenalty: 12,
  },
];

export const ARCH_BY_ID = Object.fromEntries(
  ARCHITECTURES.map((a) => [a.id, a]),
) as Record<string, Architecture>;
