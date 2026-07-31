import type { Memory, TrustBreakdown } from '../types';
import { trustColor } from '../logic/trust';

export function TrustRing({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  return (
    <div className="trust">
      <div
        className="ring"
        style={{ ['--p' as string]: pct, ['--c' as string]: trustColor(score) } as React.CSSProperties}
        aria-hidden
      />
      <div className="score" style={{ color: trustColor(score) }}>
        {pct}
      </div>
    </div>
  );
}

export interface Badge {
  label: string;
  cls: string;
}

export function badgesFor(m: Memory, b: TrustBreakdown): Badge[] {
  const out: Badge[] = [];
  out.push({ label: m.category === 'durable' ? '耐久事实' : '易变信息', cls: '' });

  if (m.pinned) out.push({ label: 'PINNED', cls: 'pin' });

  if (!m.retired) {
    if (b.freshness < 0.3) out.push({ label: `过期 · ${b.ageDays}天未确认`, cls: 'bad' });
    else if (b.freshness < 0.6) out.push({ label: `偏旧 · ${b.ageDays}天`, cls: 'warn' });
    else out.push({ label: `新鲜 · ${b.ageDays}天`, cls: 'ok' });

    if (m.confirmations <= 1) out.push({ label: '单次确认', cls: 'warn' });
    else out.push({ label: `${m.confirmations}× 确认`, cls: 'ok' });

    if (b.losesConflict) out.push({ label: '被更新/更权威记忆推翻', cls: 'bad' });
    else if (b.activeConflictIds.length > 0) out.push({ label: '存在未消解矛盾', cls: 'warn' });
  }

  if (m.retired) out.push({ label: '已退役', cls: '' });
  return out;
}

export function sourceKindLabel(t: string): string {
  if (t === 'chat') return '对话';
  if (t === 'tool') return '工具/系统';
  if (t === 'doc') return '文档/政策';
  return t;
}
