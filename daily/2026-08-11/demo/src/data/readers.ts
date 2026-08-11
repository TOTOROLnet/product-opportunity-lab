import type { Reader } from '../types';

// 读者画像池（全 mock）。patience = 初始注意力/耐心，越低越早流失。
// 真实产品里，这些画像会被翻译成 persona 提示，条件化不同阅读动机/耐心/领域背景的 LLM 模拟。
export const READER_POOL: Record<string, Reader> = {
  rp_client: {
    id: 'rp_client',
    name: '潜在客户 · 决策者',
    emoji: '💼',
    role: '一家公司的决策者，收件箱里堆着几十封相似的自荐',
    caresAbout: '3 秒内看到“对我有什么具体价值”，讨厌泛泛自夸',
    patience: 45,
  },
  rp_hr: {
    id: 'rp_hr',
    name: '招聘经理',
    emoji: '🧑‍💼',
    role: '今天要筛 60 份求职材料的招聘经理',
    caresAbout: '你和这个岗位/团队的具体匹配点，别背简历',
    patience: 40,
  },
  rp_investor: {
    id: 'rp_investor',
    name: '早期投资人',
    emoji: '📈',
    role: '每天扫上百条 pitch 的早期投资人，极度惜时',
    caresAbout: '一句话内看懂：谁、解决什么、为什么是你、凭什么现在',
    patience: 35,
  },
  rp_skim: {
    id: 'rp_skim',
    name: '匆忙扫读者',
    emoji: '⏩',
    role: '边走边用手机扫一眼的普通收件人',
    caresAbout: '能不能一眼扫到重点，废话即走',
    patience: 30,
  },
  rp_skeptic: {
    id: 'rp_skeptic',
    name: '怀疑者',
    emoji: '🤨',
    role: '默认不信、要证据的挑剔读者',
    caresAbout: '有没有真凭实据，最烦形容词堆砌与空口承诺',
    patience: 50,
  },
  rp_peer: {
    id: 'rp_peer',
    name: '领域专家 / 同行',
    emoji: '🧠',
    role: '同领域的行家，看得懂门道',
    caresAbout: '专业度与具体细节，一眼识别外行话',
    patience: 60,
  },
};
