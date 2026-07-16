import type { Rule } from '../types';

// 这些规则是"专家批改被蒸馏出的结果"。真实产品里由 LLM 从批改中归纳；
// Demo 中预置为确定性的特征谓词，保证 holdout 一致率可被真实计算与复现。
//
// 应用顺序即优先级：靠后的命中规则覆盖靠前的。
// 直觉：先应用"加分/上调"规则，再应用"降级"，最后应用"一票否决(拒)"。
export const ALL_RULES: Rule[] = [
  {
    id: 'r_domain_prod',
    text: '有相关领域（支付 / 高并发 / 金融）的生产级后端经历 → 优先推进',
    when: '领域匹配 且 有生产级后端经历',
    setTo: 'advance',
    learnedFromCaseId: 't_domain',
    weight: 'high',
    match: (f) => f.domainMatch && f.prodBackend,
  },
  {
    id: 'r_oss_domain',
    text: '相关领域有真实开源贡献 → 推进（看真实产出，别只看是否有全职岗位）',
    when: '领域匹配 且 有相关开源贡献',
    setTo: 'advance',
    learnedFromCaseId: 't_oss',
    weight: 'med',
    match: (f) => f.oss && f.domainMatch,
  },
  {
    id: 'r_hop_but_ship',
    text: '跳槽频繁但每段都有生产级交付 → 不因跳槽降级',
    when: '频繁跳槽 且 有生产级后端经历 且 无夸大',
    setTo: 'advance',
    learnedFromCaseId: 't_hop',
    weight: 'med',
    match: (f) => f.jobHopping && f.prodBackend && !f.overclaim,
  },
  {
    id: 'r_fullstack_no_backend',
    text: '自述"全栈"但无生产级后端经历 → 降为待定（别被头衔迷惑）',
    when: '自述全栈 且 无生产级后端经历',
    setTo: 'maybe',
    learnedFromCaseId: 't_fullstack',
    weight: 'high',
    match: (f) => f.claimsFullstack && !f.prodBackend,
  },
  {
    id: 'r_overclaim_reject',
    text: '自述与实际职责明显不符（夸大 / 造假）→ 直接拒',
    when: '检测到明显夸大 / 造假',
    setTo: 'reject',
    learnedFromCaseId: 't_overclaim',
    weight: 'high',
    match: (f) => f.overclaim,
  },
];

export function ruleById(id: string): Rule | undefined {
  return ALL_RULES.find((r) => r.id === id);
}
