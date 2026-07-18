// 明镜 GlassTutor — 确定性掌握度引擎
//
// 这不是"演示用假逻辑"：作答如何改变 AI 对你的估计、下一题为什么被选中、
// 校正如何重排路径、以及「对比」页里省下多少无效操练——全部由本文件的确定性算法算出。
// 没有随机、没有后端、没有 LLM，任何人跑同样的操作都得到同样的结果。

import type {
  ModelState,
  SkillState,
  SelectionScore,
  Question,
  ComparisonResult,
  ReplayStep,
} from '../types';
import { SKILLS, SKILL_BY_ID } from '../data/skills';
import { QUESTIONS_BY_SKILL } from '../data/questions';

// ---- 常量（可解释、可复现）----
const SLOPE = 5; // logistic 斜率：mastery 与 difficulty 的差异敏感度
const CONF_GAIN = 0.28; // 每次观测的置信度增益
const SPILLOVER = 0.15; // 答对时对前置技能的正向溢出比例
const READINESS_EXP = 2.0; // 前置就绪度的门控指数（越大，前置不足时下游被压得越狠）
export const MASTERED = 0.8; // 视为"已掌握"的掌握度阈值
export const MASTERED_CONF = 0.55; // 配套的置信度阈值

const clamp = (x: number) => Math.max(0, Math.min(1, x));

// AI 对学习者能力的初始估计：普遍不确定、且刻意与"真实水平"有偏差，
// 好让作答去揭示/校正它——这正是玻璃盒要展示的过程。
const INITIAL_MASTERY: Record<string, number> = {
  select: 0.5,
  where: 0.45,
  orderby: 0.42,
  aggregate: 0.4,
  groupby: 0.3,
  join: 0.35,
  subquery: 0.28,
  window: 0.2,
};

export function initModel(): ModelState {
  const model: ModelState = {};
  for (const s of SKILLS) {
    model[s.id] = {
      skillId: s.id,
      mastery: INITIAL_MASTERY[s.id] ?? 0.35,
      confidence: 0.15,
      interest: 1,
      lastPracticedTurn: -1,
      evidence: [
        {
          turn: 0,
          text: '初始先验估计（尚无你的作答证据，置信度低）',
          delta: 0,
          kind: 'init',
        },
      ],
    };
  }
  return model;
}

// 给定掌握度与难度，答对的期望概率（IRT-lite）。
export function expectedCorrect(mastery: number, difficulty: number): number {
  return 1 / (1 + Math.exp(-SLOPE * (mastery - difficulty)));
}

// 前置就绪度：前置技能的平均估计掌握度（无前置则 1）。
export function readiness(model: ModelState, skillId: string): number {
  const skill = SKILL_BY_ID[skillId];
  if (!skill || skill.prereqs.length === 0) return 1;
  const sum = skill.prereqs.reduce((a, p) => a + (model[p]?.mastery ?? 0), 0);
  return sum / skill.prereqs.length;
}

export function isMastered(st: SkillState): boolean {
  return st.mastery >= MASTERED && st.confidence >= MASTERED_CONF;
}

function cloneModel(model: ModelState): ModelState {
  const out: ModelState = {};
  for (const k of Object.keys(model)) {
    out[k] = { ...model[k], evidence: [...model[k].evidence] };
  }
  return out;
}

// 作答：更新被测技能的掌握度与置信度，答对时对前置技能做正向溢出。返回新模型与主 delta。
export function applyAnswer(
  model: ModelState,
  question: Question,
  correct: boolean,
  turn: number,
): { model: ModelState; delta: number } {
  const next = cloneModel(model);
  const st = next[question.skillId];
  const pExp = expectedCorrect(st.mastery, question.difficulty);
  const outcome = correct ? 1 : 0;
  // 学习率随置信度下降：早期作答移动更多，后期趋稳。
  const lr = 0.18 + 0.4 * (1 - st.confidence);
  const delta = lr * (outcome - pExp);
  st.mastery = clamp(st.mastery + delta);
  st.confidence = clamp(st.confidence + (1 - st.confidence) * CONF_GAIN);
  st.lastPracticedTurn = turn;
  const skillName = SKILL_BY_ID[question.skillId].short;
  st.evidence.push({
    turn,
    text: `${correct ? '答对' : '答错'} ${question.id}（难度 ${question.difficulty.toFixed(
      2,
    )}）→ ${skillName} 掌握度 ${(st.mastery - delta).toFixed(2)}→${st.mastery.toFixed(2)}`,
    delta,
    kind: 'answer',
  });

  // 答对：向直接前置技能做小幅正向溢出（间接证据）。
  if (correct && delta > 0) {
    for (const p of SKILL_BY_ID[question.skillId].prereqs) {
      const ps = next[p];
      const sp = SPILLOVER * delta;
      ps.mastery = clamp(ps.mastery + sp);
      ps.evidence.push({
        turn,
        text: `间接证据：答对 ${skillName} → 前置 ${SKILL_BY_ID[p].short} +${sp.toFixed(2)}`,
        delta: sp,
        kind: 'answer',
      });
    }
  }
  return { model: next, delta };
}

// 校正 A：「我其实会这个（刚才手滑）」——撤销最近一次负向作答，并小幅加信。
export function applyCorrectionSlip(
  model: ModelState,
  skillId: string,
  turn: number,
): ModelState {
  const next = cloneModel(model);
  const st = next[skillId];
  // 找最近一次使掌握度下降的作答证据，把它加回去。
  let restore = 0.15;
  for (let i = st.evidence.length - 1; i >= 0; i--) {
    if (st.evidence[i].kind === 'answer' && st.evidence[i].delta < 0) {
      restore = -st.evidence[i].delta;
      break;
    }
  }
  const before = st.mastery;
  st.mastery = clamp(st.mastery + restore);
  st.confidence = clamp(st.confidence + (1 - st.confidence) * 0.15);
  st.evidence.push({
    turn,
    text: `校正：你标记「刚才手滑」→ 回调 ${SKILL_BY_ID[skillId].short} 掌握度 ${before.toFixed(
      2,
    )}→${st.mastery.toFixed(2)}（撤销误判）`,
    delta: st.mastery - before,
    kind: 'correction',
  });
  return next;
}

// 校正 B：调整学习意图（我想先攻 / 先不管）。dir=+1 上调，-1 下调。上调时前置也略升。
export function applyInterest(
  model: ModelState,
  skillId: string,
  dir: 1 | -1,
  turn: number,
): ModelState {
  const next = cloneModel(model);
  const st = next[skillId];
  const before = st.interest;
  st.interest = Math.max(0.4, Math.min(1.6, st.interest + dir * 0.6));
  st.evidence.push({
    turn,
    text: `校正：你${dir > 0 ? '想先攻' : '暂时搁置'}此技能 → 兴趣权重 ${before.toFixed(
      1,
    )}→${st.interest.toFixed(1)}`,
    delta: 0,
    kind: 'correction',
  });
  if (dir > 0) {
    for (const p of SKILL_BY_ID[skillId].prereqs) {
      next[p].interest = Math.min(1.6, next[p].interest + 0.3);
    }
  }
  return next;
}

// 校正 C：直接告诉 AI 我在某技能上的真实水平（玻璃盒里手动设定掌握度）。
export function applyManualMastery(
  model: ModelState,
  skillId: string,
  value: number,
  turn: number,
): ModelState {
  const next = cloneModel(model);
  const st = next[skillId];
  const before = st.mastery;
  st.mastery = clamp(value);
  st.confidence = clamp(Math.max(st.confidence, 0.6)); // 用户亲口确认 → 提升置信度
  st.evidence.push({
    turn,
    text: `校正：你手动告知真实水平 → ${SKILL_BY_ID[skillId].short} 掌握度 ${before.toFixed(
      2,
    )}→${st.mastery.toFixed(2)}`,
    delta: st.mastery - before,
    kind: 'correction',
  });
  return next;
}

// 近期已练则降权：避免连续重复同一技能，让路径像真实导师一样轮换。
export function recencyFactor(lastPracticedTurn: number, turn: number): number {
  const gap = turn - lastPracticedTurn;
  if (lastPracticedTurn < 0) return 1;
  if (gap <= 1) return 0.25;
  if (gap === 2) return 0.55;
  if (gap === 3) return 0.8;
  return 1;
}

// 选题打分：对每个技能算 gap / uncertainty / readiness / interest / recency → 综合分。返回排序后的明细。
export function computeSelectionScores(
  model: ModelState,
  turn: number,
): SelectionScore[] {
  const scores: SelectionScore[] = SKILLS.map((s) => {
    const st = model[s.id];
    const gap = 1 - st.mastery;
    const uncertainty = 1 - st.confidence;
    const ready = readiness(model, s.id);
    const readyGate = Math.pow(ready, READINESS_EXP); // 前置未就绪则强力压低
    const rec = recencyFactor(st.lastPracticedTurn, turn);
    const base = 0.62 * gap + 0.38 * uncertainty;
    const score = base * readyGate * st.interest * rec;
    return {
      skillId: s.id,
      gap,
      uncertainty,
      readiness: ready,
      interest: st.interest,
      recency: rec,
      score,
      chosen: false,
    };
  }).sort((a, b) => b.score - a.score);
  if (scores.length) scores[0].chosen = true;
  return scores;
}

// 为某技能选一道题：难度最接近当前掌握度，优先未答过的。
export function pickQuestion(
  model: ModelState,
  skillId: string,
  answeredIds: Set<string>,
): Question | null {
  const pool = QUESTIONS_BY_SKILL[skillId] ?? [];
  if (pool.length === 0) return null;
  const mastery = model[skillId].mastery;
  const rank = (q: Question) =>
    Math.abs(q.difficulty - mastery) + (answeredIds.has(q.id) ? 1.5 : 0);
  return [...pool].sort((a, b) => rank(a) - rank(b))[0];
}

export function nextQuestion(
  model: ModelState,
  answeredIds: Set<string>,
  turn: number,
): { question: Question | null; scores: SelectionScore[] } {
  const scores = computeSelectionScores(model, turn);
  const chosen = scores.find((s) => s.chosen);
  if (!chosen) return { question: null, scores };
  return { question: pickQuestion(model, chosen.skillId, answeredIds), scores };
}

// ---------------------------------------------------------------------------
// 「对比」页：黑盒 vs 玻璃盒 的确定性重放。
//
// 场景（课程中段）：基础（SELECT/WHERE/ORDER）其实早已掌握，进阶（JOIN/GROUP/子查询/窗口）尚弱。
// 学习者在一道 WHERE 复习题上"手滑"答错一次（其实会）。
// - 黑盒：无法看见、无法校正 → 误判让 WHERE 显得"不稳"，引擎一次次把 WHERE（及邻近基础）
//   拉回复习"以防万一"，把宝贵的题耗在你早已会的内容上；WHERE 作为前置被拉低，也连累下游就绪度。
// - 玻璃盒：学习者当场标记「手滑」→ 引擎回调 WHERE、把 WHERE 移出复习队列 → 每一题都投向真正的薄弱点。
//
// "无效操练题数" = 被喂到"学习者其实已掌握（真实水平 ≥ 0.8）技能"上的题数。
// 这个数字是引擎跑出来的，不是写死的。
// ---------------------------------------------------------------------------

const SIM_STEPS = 12;
const SLIP_SKILL = 'where';

// 对比场景的"课程中段"起点：基础已建立、进阶尚弱。
const WARM_MASTERY: Record<string, [number, number]> = {
  select: [0.86, 0.62],
  where: [0.82, 0.6],
  orderby: [0.8, 0.56],
  aggregate: [0.55, 0.5],
  groupby: [0.3, 0.22],
  join: [0.35, 0.22],
  subquery: [0.28, 0.22],
  window: [0.2, 0.16],
};

function warmModel(): ModelState {
  const model = initModel();
  for (const id of Object.keys(WARM_MASTERY)) {
    const [m, c] = WARM_MASTERY[id];
    model[id].mastery = m;
    model[id].confidence = c;
  }
  return model;
}

// 确定性作答：真实水平是否足以答对该难度（越难越需要高真实水平）。
function trueOutcome(skillId: string, difficulty: number): boolean {
  const t = SKILL_BY_ID[skillId].trueMastery;
  return t >= 0.35 + 0.45 * difficulty;
}

function runReplay(withCorrection: boolean): {
  steps: ReplayStep[];
  redundant: number;
} {
  let model = warmModel();
  const answered = new Set<string>();
  const steps: ReplayStep[] = [];
  let redundant = 0;

  // Turn 1：强制一道 WHERE 复习题，学习者手滑答错（其实早已掌握）。
  {
    const q = pickQuestion(model, SLIP_SKILL, answered)!;
    redundant++; // WHERE 真实水平 0.85，属已掌握 → 记为无效操练
    answered.add(q.id);
    model = applyAnswer(model, q, false, 1).model;
    const step: ReplayStep = {
      index: 1,
      skillId: SLIP_SKILL,
      skillShort: SKILL_BY_ID[SLIP_SKILL].short,
      redundant: true,
      note: withCorrection ? '手滑 → 你当场校正' : '手滑答错（其实会）',
    };
    if (withCorrection) model = applyCorrectionSlip(model, SLIP_SKILL, 1);
    steps.push(step);
  }

  for (let turn = 2; turn <= SIM_STEPS; turn++) {
    const { question, scores } = nextQuestion(model, answered, turn);
    const chosen = scores.find((s) => s.chosen)!;
    const skillId = chosen.skillId;
    if (!question) break;

    const trulyMastered = SKILL_BY_ID[skillId].trueMastery >= MASTERED;
    if (trulyMastered) redundant++;
    const correct = trueOutcome(skillId, question.difficulty);
    answered.add(question.id);
    model = applyAnswer(model, question, correct, turn).model;
    steps.push({
      index: turn,
      skillId,
      skillShort: SKILL_BY_ID[skillId].short,
      redundant: trulyMastered,
    });
  }
  return { steps, redundant };
}

let _cachedComparison: ComparisonResult | null = null;

export function simulateComparison(): ComparisonResult {
  if (_cachedComparison) return _cachedComparison;
  const black = runReplay(false);
  const glass = runReplay(true);
  _cachedComparison = {
    blackBox: black.steps,
    glassBox: glass.steps,
    blackBoxRedundant: black.redundant,
    glassBoxRedundant: glass.redundant,
    saved: black.redundant - glass.redundant,
    slipSkillShort: SKILL_BY_ID[SLIP_SKILL].short,
  };
  return _cachedComparison;
}
