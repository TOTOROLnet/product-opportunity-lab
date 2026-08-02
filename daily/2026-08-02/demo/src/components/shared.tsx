// 换挡 Downshift — 共享的展示元件与裁决元数据。
import type { ReactNode } from 'react';
import type { ReasonKey, Verdict } from '../types';

export interface VerdictMeta {
  label: string;
  color: string;
  soft: string; // 半透明底色
  action: string; // 一句话动作
}

export const VERDICT_META: Record<Verdict, VerdictMeta> = {
  SWAP: {
    label: '值得换',
    color: '#38d39f',
    soft: 'rgba(56,211,159,0.14)',
    action: '每成功任务更便宜，且成功率守住底线 —— 直接换。',
  },
  SWAP_WITH_FIXES: {
    label: '有条件换',
    color: '#4ea8ff',
    soft: 'rgba(78,168,255,0.14)',
    action: '更便宜，但成功率略低于底线 —— 微调 prompt/工具后可换。',
  },
  FIX_FIRST: {
    label: '先修再换',
    color: '#f0a441',
    soft: 'rgba(240,164,65,0.15)',
    action: '成本很划算，但成功率明显低于底线 —— 先把差距补上再换。',
  },
  KEEP: {
    label: '别换',
    color: '#ff6b6b',
    soft: 'rgba(255,107,107,0.14)',
    action: '按成功任务算反而更贵 —— 保持现有模型。',
  },
};

export const REASON_TEXT: Record<ReasonKey, string> = {
  'cheaper-success-held': '每成功任务成本明显下降，且成功率没有掉出可接受范围。',
  'minor-quality-gap': '每成功任务成本大幅下降，成功率只差底线一点点，值得投一点 prompt 工程去补。',
  'quality-gap-material': '单价确实便宜，但成功率明显低于产品可上线底线，便宜也不能上——先补差距。',
  'cost-flip': '别被表面单价骗了：算上步数膨胀 / 成功率下降后，每个成功任务反而更贵。',
  'both-bad': '既算不出成本优势，成功率又低于底线——没有任何理由迁移。',
  'marginal-ok': '成本大致持平、成功率达标，可以换但收益有限。',
};

/** 补救建议：按裁决给出可执行下一步。 */
export function remediations(verdict: Verdict): string[] {
  switch (verdict) {
    case 'SWAP':
      return [
        '灰度 5% 流量做线上 A/B，确认真实成功率与重放一致',
        '监控每成功任务成本与步数，防止长尾任务反弹',
      ];
    case 'SWAP_WITH_FIXES':
      return [
        '针对失败样本改写 system prompt / few-shot，把成功率拉回底线',
        '收紧输出格式约束，抑制啰嗦度带来的输出成本',
        '补齐后重跑重放，确认越过底线再灰度',
      ];
    case 'FIX_FIRST':
      return [
        '定位成功率下降的失败簇（多半是工具调用格式 / 长程规划）',
        '专门为候选模型重写工具 schema 与调用示例',
        '差距补到底线以上再进入迁移评估，切勿因单价便宜硬上',
      ];
    case 'KEEP':
      return [
        '保持现有模型；把便宜模型留给低风险 / 离线批处理场景',
        '若仍想省钱，优先压缩上下文 / 提升缓存命中，而不是换更弱的模型',
        '等第三方复现基准或该模型后训练更新后再评估',
      ];
  }
}

export function Card({
  children,
  className,
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div className={`card${className ? ' ' + className : ''}`} style={style}>
      {children}
    </div>
  );
}

export function Stat({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  tone?: 'good' | 'bad' | 'muted';
}) {
  return (
    <div className="stat">
      <div className="stat-label">{label}</div>
      <div className={`stat-value${tone ? ' ' + tone : ''}`}>{value}</div>
      {sub != null && <div className="stat-sub">{sub}</div>}
    </div>
  );
}

export function VerdictPill({ verdict }: { verdict: Verdict }) {
  const m = VERDICT_META[verdict];
  return (
    <span className="pill" style={{ background: m.soft, color: m.color, borderColor: m.color }}>
      {m.label}
    </span>
  );
}
