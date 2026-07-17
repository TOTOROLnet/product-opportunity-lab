// 常青 Evergreen — 确定性鲜度引擎
// 输入：论断集合、来源版本、当前文档断言的版本、来源变更时间线、时间线位置
// 输出：逐条鲜/腐判定 + 文档鲜度分。这里没有任何随机 / 造假，鲜度是真算出来的。

import type {
  Claim,
  ClaimComputed,
  ClaimStatus,
  FreshnessResult,
  Source,
  TimelineEvent,
} from '../types';

/** 给定时间线位置，某来源"当前"处于第几个版本（应用前 pos 个事件后的结果）。 */
export function currentVersionIndex(
  sourceId: string,
  events: TimelineEvent[],
  timelinePos: number,
): number {
  let idx = 0;
  for (let i = 0; i < timelinePos && i < events.length; i += 1) {
    const e = events[i];
    if (e.sourceId === sourceId && e.toVersionIndex > idx) idx = e.toVersionIndex;
  }
  return idx;
}

export function renderTemplate(template: string, value: string): string {
  return template.replace('{value}', value);
}

export function computeClaim(
  claim: Claim,
  source: Source,
  assertedVersionIndex: number,
  events: TimelineEvent[],
  timelinePos: number,
): ClaimComputed {
  const curIdx = currentVersionIndex(claim.sourceId, events, timelinePos);
  const safeAsserted = Math.min(assertedVersionIndex, source.versions.length - 1);
  const assertedValue = source.versions[safeAsserted].value;
  const currentValue = source.versions[curIdx].value;

  let status: ClaimStatus;
  if (safeAsserted >= curIdx) {
    // 文档断言的版本不落后于来源现值 → 鲜（含"文档已提前更新"的回放边界情形）
    status = 'fresh';
  } else if (claim.manualOnly) {
    status = 'manual';
  } else {
    status = 'stale';
  }

  return {
    claim,
    source,
    assertedVersionIndex: safeAsserted,
    currentVersionIndex: curIdx,
    assertedValue,
    currentValue,
    assertedText: renderTemplate(claim.template, assertedValue),
    currentText: renderTemplate(claim.template, currentValue),
    status,
  };
}

export function computeAll(
  claims: Claim[],
  sources: Record<string, Source>,
  asserted: Record<string, number>,
  events: TimelineEvent[],
  timelinePos: number,
): FreshnessResult {
  const computed = claims.map((c) =>
    computeClaim(c, sources[c.sourceId], asserted[c.id] ?? 0, events, timelinePos),
  );
  const lb = computed.filter((c) => c.claim.loadBearing);
  const fresh = lb.filter((c) => c.status === 'fresh').length;
  const score = lb.length === 0 ? 100 : Math.round((fresh / lb.length) * 100);
  return {
    computed,
    loadBearingTotal: lb.length,
    loadBearingFresh: fresh,
    score,
    stale: computed.filter((c) => c.status === 'stale'),
    manual: computed.filter((c) => c.status === 'manual'),
  };
}
