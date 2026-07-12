import type {
  ReconStep,
  ReconSummary,
  DeviationKind,
  ItemDecision,
  Verdict,
  DeliveryVerdict,
} from '../types';

// 计算一次运行的对账摘要：把每一步的守约 / 微调 / 越界统计出来，
// 再结合用户对越界项的处置（签署 / 驳回）给出「可否直接交付」的裁定。
//
// 裁定规则（交付口 gating）：
//   - blocked（⛔）：存在「未签署也未驳回」的越界项，或有越界项被驳回待重做 → 交付暂停。
//   - review（⚠）：越界项已全部签署，或存在计划内微调 → 建议复核后采用。
//   - safe（✓）：只有守约步、零越界零微调 → 完全守约，可直接采用。
export function computeSummary(
  steps: ReconStep[],
  decisions: Record<string, ItemDecision>,
): ReconSummary {
  let honored = 0;
  let adapted = 0;
  let deviated = 0;
  let openDeviations = 0;
  let signedDeviations = 0;
  let rejected = 0;

  for (const step of steps) {
    if (step.verdict === 'honored') honored += 1;
    else if (step.verdict === 'adapted') adapted += 1;
    else if (step.verdict === 'deviated') {
      deviated += 1;
      const decision = decisions[step.id];
      if (decision === 'signed') signedDeviations += 1;
      else if (decision === 'rejected') rejected += 1;
      else openDeviations += 1;
    }
  }

  let verdict: DeliveryVerdict;
  let headline: string;

  if (openDeviations > 0 || rejected > 0) {
    verdict = 'blocked';
    if (openDeviations > 0) {
      headline = `⛔ 检测到 ${openDeviations} 处未授权越界，交付已暂停——请逐项签署或驳回`;
    } else {
      headline = `⛔ 有 ${rejected} 处越界被驳回，待 agent 重做后再交付`;
    }
  } else if (signedDeviations > 0 || adapted > 0) {
    verdict = 'review';
    const parts: string[] = [];
    if (signedDeviations > 0) parts.push(`${signedDeviations} 处越界已由你签署`);
    if (adapted > 0) parts.push(`${adapted} 处计划内微调`);
    headline = `⚠ ${parts.join('、')}，建议复核后采用`;
  } else {
    verdict = 'safe';
    headline = '✓ 完全守约，可直接采用';
  }

  return { honored, adapted, deviated, openDeviations, signedDeviations, rejected, verdict, headline };
}

// 找出某个成品元素对应的对账步
export function stepForElement(steps: ReconStep[], sourceStepId: string): ReconStep | undefined {
  return steps.find((s) => s.id === sourceStepId);
}

// 三态中文标签
export function verdictLabel(v: Verdict): string {
  switch (v) {
    case 'honored':
      return '守约';
    case 'adapted':
      return '微调';
    case 'deviated':
      return '越界';
  }
}

// 越界 / 微调类别标签
export function deviationKindLabel(k?: DeviationKind): string {
  switch (k) {
    case 'scope':
      return '范围扩张';
    case 'external':
      return '未授权对外动作';
    case 'source':
      return '未授权数据源';
    case 'budget':
      return '超预算';
    case 'adapt':
      return '计划内替换';
    default:
      return '';
  }
}

// 交付裁定的中文短标签（给徽标用）
export function deliveryVerdictLabel(v: DeliveryVerdict): string {
  switch (v) {
    case 'blocked':
      return '交付暂停';
    case 'review':
      return '建议复核';
    case 'safe':
      return '可直接采用';
  }
}
