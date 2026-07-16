import type { Candidate, TrainingCase } from '../types';

// 示例域：某支付公司「高级后端工程师」初筛。
// 专家 = 带过团队、招过很多人的资深招聘官 / 技术负责人，判断力高度隐性。
// 全部为 mock 数据，化名，不含真实个人信息。

export const ROLE = '高级后端工程师（支付方向）';

export const EXPERT_NOTES = [
  '别被漂亮头衔和"全栈"自述迷惑，我要的是真扛过线上的后端。',
  '相关领域（支付 / 高并发）的真实产出比学历和稳定性更重要。',
  '简历夸大 / 造假是一票否决，无论其他多亮眼。',
  '跳槽频繁不等于不行——只要每段都有拿得出手的生产级交付。',
];

// ---------------------------------------------------------------------------
// 训练集：专家在这里"带教"——看 agent 判断，认同 / 改判 / 圈错补规则。
// ---------------------------------------------------------------------------
export const TRAINING: TrainingCase[] = [
  {
    id: 't_fullstack',
    handle: '候选人 A',
    headline: '全栈工程师｜前端后端算法都能做',
    years: 4,
    blurb:
      '自述"全栈全能"，简历罗列了 10+ 技术栈；细看项目多为个人小项目与前端页面，缺乏线上后端系统的规模与容灾经历。',
    features: { prodBackend: false, claimsFullstack: true, oss: false, domainMatch: false, jobHopping: false, overclaim: false },
    baseVerdict: 'advance',
    baseReason: '技能覆盖面很广、自述全栈，看起来什么都能做，建议推进。',
    expertVerdict: 'maybe',
    teachesRuleId: 'r_fullstack_no_backend',
  },
  {
    id: 't_domain',
    handle: '候选人 B',
    headline: '5 年后端｜做过支付清结算与对账系统',
    years: 5,
    blurb:
      '描述朴实，没有花哨头衔；但深度参与过支付清结算、对账与资金安全，扛过大促峰值。正是本岗位的领域核心。',
    features: { prodBackend: true, claimsFullstack: false, oss: false, domainMatch: true, jobHopping: false, overclaim: false },
    baseVerdict: 'maybe',
    baseReason: '经历扎实但自我描述平淡、亮点不突出，暂列待定。',
    expertVerdict: 'advance',
    teachesRuleId: 'r_domain_prod',
  },
  {
    id: 't_overclaim',
    handle: '候选人 C',
    headline: '首席架构师｜主导公司核心系统架构',
    years: 6,
    blurb:
      '头衔为"首席架构师"，但深入追问的项目职责主要是运维脚本与配置，与"主导核心架构"的自述明显不符，存在夸大。',
    features: { prodBackend: true, claimsFullstack: false, oss: false, domainMatch: false, jobHopping: false, overclaim: true },
    baseVerdict: 'advance',
    baseReason: '"首席架构师"头衔亮眼、年限达标，建议推进。',
    expertVerdict: 'reject',
    teachesRuleId: 'r_overclaim_reject',
  },
  {
    id: 't_oss',
    handle: '候选人 D',
    headline: '自由职业｜高并发网关开源项目维护者',
    years: 3,
    blurb:
      '没有大厂全职后端 title，但长期维护一个被生产环境使用的高并发网关开源项目，issue / PR 质量高，社区认可。',
    features: { prodBackend: false, claimsFullstack: false, oss: true, domainMatch: true, jobHopping: false, overclaim: false },
    baseVerdict: 'maybe',
    baseReason: '缺少正式全职后端岗位经历，履历不够"标准"，列为待定。',
    expertVerdict: 'advance',
    teachesRuleId: 'r_oss_domain',
  },
  {
    id: 't_hop',
    handle: '候选人 E',
    headline: '3 年 4 家｜每段都上线过支付相关系统',
    years: 3,
    blurb:
      '任期偏短、跳槽频繁；但每一段都有明确的生产级交付（上线过风控、账务相关服务），无夸大痕迹。',
    features: { prodBackend: true, claimsFullstack: false, oss: false, domainMatch: true, jobHopping: true, overclaim: false },
    baseVerdict: 'reject',
    baseReason: '3 年换了 4 家，稳定性太差，风险高，建议拒。',
    expertVerdict: 'advance',
    teachesRuleId: 'r_hop_but_ship',
  },
  {
    id: 't_agree_adv',
    handle: '候选人 F',
    headline: '7 年支付后端｜主导过资金账户系统重构',
    years: 7,
    blurb: '领域高度匹配、有明确生产级重构成果、描述可核验。教科书式的强候选。',
    features: { prodBackend: true, claimsFullstack: false, oss: false, domainMatch: true, jobHopping: false, overclaim: false },
    baseVerdict: 'advance',
    baseReason: '领域匹配、经历扎实、成果清晰，建议推进。',
    expertVerdict: 'advance',
    teachesRuleId: null,
  },
  {
    id: 't_agree_rej',
    handle: '候选人 G',
    headline: '应届｜实习做过管理系统 CRUD',
    years: 0,
    blurb: '应届、无生产级后端经历、无领域相关产出，与"高级"岗位差距明显。',
    features: { prodBackend: false, claimsFullstack: false, oss: false, domainMatch: false, jobHopping: false, overclaim: false },
    baseVerdict: 'reject',
    baseReason: '经验与岗位级别不符，建议拒。',
    expertVerdict: 'reject',
    teachesRuleId: null,
  },
  {
    id: 't_agree_maybe',
    handle: '候选人 H',
    headline: '5 年通用后端｜电商订单系统',
    years: 5,
    blurb: '有真实生产级后端经历但非支付领域，能力达标、领域需转，属于可谈但非首选。',
    features: { prodBackend: true, claimsFullstack: false, oss: false, domainMatch: false, jobHopping: false, overclaim: false },
    baseVerdict: 'maybe',
    baseReason: '后端经历扎实但领域不完全匹配，列为待定。',
    expertVerdict: 'maybe',
    teachesRuleId: null,
  },
];

// ---------------------------------------------------------------------------
// 验收集（holdout）：专家不在这里批改；用来实测"带教前 vs 带教后"与专家一致率。
// ---------------------------------------------------------------------------
export const HOLDOUT: Candidate[] = [
  {
    id: 'h1',
    handle: '候选人 J',
    headline: '全能全栈｜一个人搞定一切',
    years: 4,
    blurb: '强调"全栈全能"，但缺少线上后端规模化经历，与候选人 A 同型。',
    features: { prodBackend: false, claimsFullstack: true, oss: false, domainMatch: false, jobHopping: false, overclaim: false },
    baseVerdict: 'advance',
    baseReason: '自述全栈、技能面广，推进。',
    expertVerdict: 'maybe',
  },
  {
    id: 'h2',
    handle: '候选人 K',
    headline: '6 年后端｜交易撮合与对账',
    years: 6,
    blurb: '低调、描述朴实，但交易撮合 / 对账等支付核心经历扎实。',
    features: { prodBackend: true, claimsFullstack: false, oss: false, domainMatch: true, jobHopping: false, overclaim: false },
    baseVerdict: 'maybe',
    baseReason: '描述平淡、亮点不突出，待定。',
    expertVerdict: 'advance',
  },
  {
    id: 'h3',
    handle: '候选人 L',
    headline: '技术总监｜从 0 搭建整个技术体系',
    years: 8,
    blurb: '自述"从 0 搭建整个技术体系"，但可核验的职责与规模远小于表述，存在夸大。',
    features: { prodBackend: true, claimsFullstack: false, oss: false, domainMatch: false, jobHopping: false, overclaim: true },
    baseVerdict: 'advance',
    baseReason: '"技术总监"头衔 + 8 年经验，推进。',
    expertVerdict: 'reject',
  },
  {
    id: 'h4',
    handle: '候选人 M',
    headline: '独立开发者｜风控规则引擎开源作者',
    years: 4,
    blurb: '无大厂 title，但风控 / 支付相关开源项目被生产使用，产出真实。',
    features: { prodBackend: false, claimsFullstack: false, oss: true, domainMatch: true, jobHopping: false, overclaim: false },
    baseVerdict: 'maybe',
    baseReason: '缺正式全职后端岗位，履历不标准，待定。',
    expertVerdict: 'advance',
  },
  {
    id: 'h5',
    handle: '候选人 N',
    headline: '4 年 5 段｜每段都上线支付服务',
    years: 4,
    blurb: '跳槽很频繁，但每段都有清晰的支付相关生产级交付，无夸大。',
    features: { prodBackend: true, claimsFullstack: false, oss: false, domainMatch: true, jobHopping: true, overclaim: false },
    baseVerdict: 'reject',
    baseReason: '跳槽过于频繁，稳定性风险高，拒。',
    expertVerdict: 'advance',
  },
  {
    id: 'h6',
    handle: '候选人 P',
    headline: '9 年支付后端｜资金安全负责人',
    years: 9,
    blurb: '领域顶配、生产级经历深厚、描述可核验。强候选。',
    features: { prodBackend: true, claimsFullstack: false, oss: false, domainMatch: true, jobHopping: false, overclaim: false },
    baseVerdict: 'advance',
    baseReason: '领域匹配、经历深厚，推进。',
    expertVerdict: 'advance',
  },
  {
    id: 'h7',
    handle: '候选人 Q',
    headline: '应届｜课程作业与个人博客',
    years: 0,
    blurb: '应届、无生产级后端、无领域产出，与高级岗差距大。',
    features: { prodBackend: false, claimsFullstack: false, oss: false, domainMatch: false, jobHopping: false, overclaim: false },
    baseVerdict: 'reject',
    baseReason: '经验不足，拒。',
    expertVerdict: 'reject',
  },
  {
    id: 'h8',
    handle: '候选人 R',
    headline: '5 年后端｜内容平台 feed 系统',
    years: 5,
    blurb: '真实生产级后端经历，但领域为内容平台、非支付，需转领域。',
    features: { prodBackend: true, claimsFullstack: false, oss: false, domainMatch: false, jobHopping: false, overclaim: false },
    baseVerdict: 'maybe',
    baseReason: '能力达标但领域需转，待定。',
    expertVerdict: 'maybe',
  },
  {
    id: 'h9',
    handle: '候选人 S',
    headline: '6 年支付后端｜多次带人但协作评价存疑',
    years: 6,
    blurb:
      '领域匹配、有生产级经历——但背调中多位同事提到协作 / 沟通问题（这一维度当前技能卡尚未覆盖）。专家据此给"待定"。',
    features: { prodBackend: true, claimsFullstack: false, oss: false, domainMatch: true, jobHopping: false, overclaim: false },
    baseVerdict: 'advance',
    baseReason: '领域匹配、经历扎实，推进。',
    expertVerdict: 'maybe',
  },
];
