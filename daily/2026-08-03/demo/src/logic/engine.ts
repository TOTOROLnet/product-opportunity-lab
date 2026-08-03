import type {
  Autonomy,
  Classified,
  Interaction,
  Outcome,
  Profile,
  Stakes,
  Situation,
  Topic,
  TopicRule,
  WeekSummary,
} from '../types';
import { DEFAULT_DECISIONS, SITUATIONS, TOPIC_ORDER } from '../data/situations';

// ————— 数值化：授权档与风险档 —————
// 授权数值：越大越放手。
const AUTONOMY_NUM: Record<Autonomy, number> = { never: 0, ask: 1, draft: 2, handle: 3 };
const NUM_AUTONOMY: Autonomy[] = ['never', 'ask', 'draft', 'handle'];
// 风险位置（用于单调推导）：低 0 / 中 1 / 高 2。
const STAKES_NUM: Record<Stakes, number> = { low: 0, mid: 1, high: 2 };
// 风险权重（用于"出格贴近度"）：风险越高，放手的代价越大。
const STAKES_WEIGHT: Record<Stakes, number> = { low: 1, mid: 2, high: 3 };

// "差一点出格"阈值：授权数值 × 风险权重 >= 6 视为需要你留意
// （例如：高风险被拟稿 2×3=6、中风险被放手 3×2=6、高风险被放手 3×3=9）。
export const OVERSTEP_THRESHOLD = 6;

export function autonomyNum(a: Autonomy): number {
  return AUTONOMY_NUM[a];
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

// 由一次拍板生成该话题的规则：
// - 选"绝不可碰"→ 红线（所有风险档一律禁碰）。
// - 否则记录 (level, atStakes)，其余风险档按单调规则推导。
export function ruleFromDecision(stakes: Stakes, level: Autonomy): TopicRule {
  return { level, atStakes: stakes, redline: level === 'never' };
}

// 推导某话题在指定风险档上的授权档：
// 红线 → 一律 never；否则随风险每升一档、授权最多降一档（单调不增），在锚点处严格等于所选。
export function cellAutonomy(rule: TopicRule, stakes: Stakes): Autonomy {
  if (rule.redline) return 'never';
  const delta = STAKES_NUM[stakes] - STAKES_NUM[rule.atStakes];
  const n = clamp(AUTONOMY_NUM[rule.level] - delta, 0, 3);
  return NUM_AUTONOMY[n];
}

// 授权档 → 回放结果用词。
export function outcomeFor(a: Autonomy): Outcome {
  switch (a) {
    case 'handle':
      return 'handled';
    case 'draft':
      return 'draft';
    case 'ask':
      return 'ask';
    case 'never':
      return 'blocked';
  }
}

// 出格贴近度：授权数值 × 风险权重。
export function overstepRisk(a: Autonomy, stakes: Stakes): number {
  return AUTONOMY_NUM[a] * STAKES_WEIGHT[stakes];
}

// 默认分寸画像：由 DEFAULT_DECISIONS 在各彩排卡的风险档上合成。
export function defaultProfile(): Profile {
  const stakesOf: Record<Topic, Stakes> = {} as Record<Topic, Stakes>;
  for (const s of SITUATIONS) stakesOf[s.topic] = s.stakes;
  const topics = {} as Record<Topic, TopicRule>;
  for (const t of TOPIC_ORDER) {
    topics[t] = ruleFromDecision(stakesOf[t], DEFAULT_DECISIONS[t]);
  }
  return { topics };
}

// 用一次彩排拍板更新画像（覆盖该话题的规则）。
export function applyDecision(profile: Profile, situation: Situation, level: Autonomy): Profile {
  return {
    topics: {
      ...profile.topics,
      [situation.topic]: ruleFromDecision(situation.stakes, level),
    },
  };
}

// 收紧某话题一档（放手→拟稿→先问→绝不可碰），并把锚点移到该话题最高风险以确保整行收紧。
export function tightenTopic(profile: Profile, topic: Topic): Profile {
  const rule = profile.topics[topic];
  const nextNum = clamp(AUTONOMY_NUM[rule.level] - 1, 0, 3);
  const nextLevel = NUM_AUTONOMY[nextNum];
  return {
    topics: {
      ...profile.topics,
      [topic]: { level: nextLevel, atStakes: rule.atStakes, redline: nextLevel === 'never' },
    },
  };
}

// 分类单条互动。
export function classify(interaction: Interaction, profile: Profile): Classified {
  const rule = profile.topics[interaction.topic];
  const autonomy = cellAutonomy(rule, interaction.stakes);
  const risk = overstepRisk(autonomy, interaction.stakes);
  return {
    interaction,
    autonomy,
    outcome: outcomeFor(autonomy),
    risk,
    flagged: risk >= OVERSTEP_THRESHOLD,
  };
}

// 回放一周：分类 + 汇总计数 + 收集"差点出格"。
export function classifyWeek(interactions: Interaction[], profile: Profile): WeekSummary {
  const items = interactions.map((i) => classify(i, profile));
  const counts: Record<Outcome, number> = { handled: 0, draft: 0, ask: 0, blocked: 0 };
  for (const it of items) counts[it.outcome] += 1;
  const flags = items.filter((it) => it.flagged);
  return { items, counts, flags, total: items.length };
}

// 画像"性格"一句话解读：按各话题在中风险档上的平均授权判断。
export function avgMidAutonomy(profile: Profile): number {
  const vals = TOPIC_ORDER.map((t) => AUTONOMY_NUM[cellAutonomy(profile.topics[t], 'mid')]);
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

export function profileArchetype(profile: Profile): { title: string; note: string } {
  const avg = avgMidAutonomy(profile);
  if (avg > 2.2) {
    return {
      title: '偏放手型',
      note: '你倾向让代表多做事、少打扰你——注意别把高风险的事一起放了出去。',
    };
  }
  if (avg >= 1.2) {
    return {
      title: '偏协作型',
      note: '多数事你让它拟稿待批、关键事亲自拍板——信任建立在"看得见"上。',
    };
  }
  return {
    title: '偏亲力亲为型',
    note: '你把关很紧，代表更多是帮你拟稿和过滤，而非替你决定。',
  };
}

// 红线话题清单。
export function redlineTopics(profile: Profile): Topic[] {
  return TOPIC_ORDER.filter((t) => profile.topics[t].redline);
}
