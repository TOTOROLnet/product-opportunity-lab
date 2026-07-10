import type { GenElement, Grounding, Scenario } from '../types';

// Pane 的"可信度"聚合与展示逻辑。
// 注意：这里不做真实判定——每个元素的 grounding 已由 mock 数据预先标注。
// 本模块负责把这些标注聚合成"界面级真实度"，并给出徽标/预检的展示信息。

export interface GroundingMeta {
  label: string; // 徽标文案
  short: string; // 极简标记
  tone: Grounding; // 用于 CSS 配色
}

export const GROUNDING_META: Record<Grounding, GroundingMeta> = {
  verified: { label: '已核实', short: '✓', tone: 'verified' },
  guessed: { label: '模型推测', short: '?', tone: 'guessed' },
  placeholder: { label: '占位·未绑定', short: '∅', tone: 'placeholder' },
};

export interface TruthSummary {
  total: number;
  verified: number;
  guessed: number;
  placeholder: number;
  verifiedPct: number;
  guessedPct: number;
  placeholderPct: number;
  trustworthy: boolean; // 是否可放心信任（无 guessed / placeholder）
}

// 统计一份生成界面里各 grounding 等级的占比。
export function summarize(elements: GenElement[]): TruthSummary {
  const total = elements.length || 1;
  const verified = elements.filter((e) => e.grounding === 'verified').length;
  const guessed = elements.filter((e) => e.grounding === 'guessed').length;
  const placeholder = elements.filter((e) => e.grounding === 'placeholder').length;
  const pct = (n: number) => Math.round((n / total) * 100);
  return {
    total: elements.length,
    verified,
    guessed,
    placeholder,
    verifiedPct: pct(verified),
    guessedPct: pct(guessed),
    placeholderPct: pct(placeholder),
    trustworthy: guessed === 0 && placeholder === 0,
  };
}

// 计算某个动作按钮在被点击时应展示的预检信息。
export interface ActionPrecheck {
  title: string;
  bodyLines: string[];
  tone: 'safe' | 'money' | 'none';
  needsConfirm: boolean; // 是否需要用户显式确认才执行
  confirmLabel: string;
}

export function buildPrecheck(el: GenElement): ActionPrecheck {
  const a = el.action;
  if (!a) {
    return {
      title: el.label,
      bodyLines: ['该元素不是动作按钮。'],
      tone: 'none',
      needsConfirm: false,
      confirmLabel: '知道了',
    };
  }
  if (!a.realBinding) {
    return {
      title: `⚠️ "${el.label}" 未绑定真实能力`,
      bodyLines: [
        a.plainEffect,
        '这是模型为了界面完整而生成的占位按钮。在裸界面里，它和真正的按钮完全无法区分——你可能以为已经下单/操作成功，其实什么都没发生。',
      ],
      tone: 'none',
      needsConfirm: false,
      confirmLabel: '知道了',
    };
  }
  if (a.risk === 'money') {
    return {
      title: `需要确认："${el.label}"`,
      bodyLines: [
        '此操作会真实执行，且涉及金钱：',
        a.plainEffect,
        '在提交前，你能明确看到它到底会做什么——而不是被一个漂亮的按钮直接带走。',
      ],
      tone: 'money',
      needsConfirm: true,
      confirmLabel: '我已知晓，确认执行',
    };
  }
  return {
    title: `预检："${el.label}"`,
    bodyLines: [a.plainEffect, '这是一个只读 / 无副作用的动作，可放心执行。'],
    tone: 'safe',
    needsConfirm: true,
    confirmLabel: '执行',
  };
}

// 裸模式下点击动作按钮时的"直接执行"结果文案（用于对照，凸显危险）。
export function nakedActionResult(el: GenElement): { title: string; body: string } {
  const a = el.action;
  if (a && !a.realBinding) {
    return {
      title: '已提交 ✅',
      body:
        '（裸界面直接反馈"成功"，但这其实是个未绑定能力的占位按钮——你以为订到了 ¥1,280 的票，实际什么都没发生，而那个价格本身还是模型编的。）',
    };
  }
  if (a && a.risk === 'money') {
    return {
      title: '已提交 ✅',
      body:
        '（裸界面二话不说就真的发起了分期——一笔会花钱、可能影响征信的操作，没有任何预检，而且它基于的还是一个算错的总额。）',
    };
  }
  return { title: '已完成 ✅', body: '（裸界面直接执行，没有告诉你它到底做了什么。）' };
}

// 供说明页/自测复用：一份界面里"有问题"的元素（guessed 数字 或 placeholder 动作）。
export function riskyElements(scenario: Scenario): GenElement[] {
  return scenario.elements.filter(
    (e) => e.grounding === 'guessed' || (e.kind === 'action' && e.grounding === 'placeholder'),
  );
}
