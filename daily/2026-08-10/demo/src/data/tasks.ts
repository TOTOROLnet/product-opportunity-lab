import type { TaskDef } from '../types';

// Mock 任务意图集：覆盖"该走哪条决策路径"的几种典型形态。
export const TASKS: TaskDef[] = [
  {
    id: 'persona',
    name: '学我司客服的语气与话术',
    desc: '让模型稳定地用我们品牌的语气、结构、话术回复（行为/风格问题，不是新知识）。',
    affinity: 'SFT_LORA',
    needsFreshKnowledge: false,
    preferenceNature: false,
  },
  {
    id: 'extract',
    name: '把发票/合同抽成结构化 JSON',
    desc: '固定输入→固定 schema 输出，强格式约束（监督示例最有效）。',
    affinity: 'SFT_LORA',
    needsFreshKnowledge: false,
    preferenceNature: false,
  },
  {
    id: 'refusal',
    name: '更礼貌、更稳的拒答/安全对齐',
    desc: '同一问题存在"更好/更差"的回答排序，是偏好/行为对齐问题，而非唯一正确答案。',
    affinity: 'PREF_ALIGN',
    needsFreshKnowledge: false,
    preferenceNature: true,
  },
  {
    id: 'tone_rank',
    name: '让回答更符合我们的偏好排序',
    desc: '有一批"这条比那条好"的成对反馈，想把模型往人类偏好拉。',
    affinity: 'PREF_ALIGN',
    needsFreshKnowledge: false,
    preferenceNature: true,
  },
  {
    id: 'domain_qa',
    name: '基于我们私有文档做领域问答',
    desc: '答案依赖会更新的私有/最新事实知识（知识型需求）。',
    affinity: 'PROMPT_RAG',
    needsFreshKnowledge: true,
    preferenceNature: false,
  },
  {
    id: 'distill',
    name: '把 14B 的能力蒸成 3B 好部署',
    desc: '想用小模型逼近大模型在某任务上的表现，便于端侧/低成本部署。',
    affinity: 'DISTILL',
    needsFreshKnowledge: false,
    preferenceNature: false,
  },
];
