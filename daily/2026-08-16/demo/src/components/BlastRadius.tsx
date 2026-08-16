import type { Scorecard, Verdict } from '../types';
import { quadrantOf } from '../engine';
import { Delta } from './shared';

interface Props {
  verdicts: Verdict[];
  scorecard: Scorecard;
  baseline: Scorecard;
}

interface Cell {
  key: string;
  label: string;
  danger: boolean;
  items: Verdict[];
}

export default function BlastRadius({ verdicts, scorecard, baseline }: Props) {
  const allowed = verdicts.filter((v) => v.decision === 'allow');

  const cells: Cell[] = [
    { key: 'ir-hi', label: '不可逆 × 高影响', danger: true, items: [] },
    { key: 'ir-lo', label: '不可逆 × 低影响', danger: false, items: [] },
    { key: 're-hi', label: '可逆 × 高影响', danger: false, items: [] },
    { key: 're-lo', label: '可逆 × 低影响', danger: false, items: [] },
  ];
  for (const v of allowed) {
    const q = quadrantOf(v.action);
    const key = `${q.irreversible ? 'ir' : 're'}-${q.highImpact ? 'hi' : 'lo'}`;
    cells.find((c) => c.key === key)!.items.push(v);
  }

  const sortedAllowed = [...allowed].sort((a, b) => b.radius - a.radius);
  const maxRadius = Math.max(1, ...allowed.map((v) => v.radius));
  const gaps = verdicts.filter((v) => !v.matchedByRule);

  return (
    <section className="blast">
      <div className="blast-top">
        <div className="big-metric">
          <span className="bm-num">{scorecard.blastRadius}</span>
          <span className="bm-label">累计爆炸半径</span>
          <span className="bm-sub">
            vs 宽松基线 <Delta value={scorecard.blastRadius - baseline.blastRadius} />
          </span>
        </div>
        <div className="big-metric">
          <span className={`bm-num ${scorecard.leakedCount > 0 ? 'danger' : 'ok'}`}>
            {scorecard.leakedCount}
          </span>
          <span className="bm-label">漏网不可逆 / 敏感动作</span>
          <span className="bm-sub">
            vs 宽松基线 <Delta value={scorecard.leakedCount - baseline.leakedCount} />
          </span>
        </div>
        <div className="big-metric">
          <span className={`bm-num ${scorecard.reviewLoad > scorecard.reviewBudget ? 'warn' : 'ok'}`}>
            {scorecard.reviewLoad}/{scorecard.reviewBudget}
          </span>
          <span className="bm-label">人审负载 / 预算</span>
          <span className="bm-sub">
            vs 宽松基线 <Delta value={scorecard.reviewLoad - baseline.reviewLoad} goodWhenNegative={false} />
          </span>
        </div>
      </div>

      <p className="section-note">
        「爆炸半径」只统计<b>被自动放行</b>的动作——也就是上线后 agent 能自己干、没人盯着的部分。红区越空，越安全。
      </p>

      <div className="quadrant">
        {cells.map((c) => (
          <div key={c.key} className={`quad-cell ${c.danger ? 'danger' : ''}`}>
            <div className="quad-head">
              <span>{c.label}</span>
              <b>{c.items.length}</b>
            </div>
            {c.items.length === 0 ? (
              <span className="quad-empty">—</span>
            ) : (
              <ul>
                {c.items.map((v) => (
                  <li key={v.action.id}>
                    <span className="q-emoji">{v.action.emoji}</span>
                    <code>{v.action.title}</code>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>

      <div className="two-col">
        <div className="panel">
          <div className="panel-head">
            <h2>自动放行动作 · 按爆炸半径排序</h2>
          </div>
          {sortedAllowed.length === 0 ? (
            <div className="empty">这套策略没有自动放行任何动作。</div>
          ) : (
            <ul className="bar-list">
              {sortedAllowed.map((v) => (
                <li key={v.action.id} className={v.leaked ? 'leaked' : ''}>
                  <div className="bar-title">
                    <code>{v.action.title}</code>
                    <span className="bar-val">{v.radius}</span>
                  </div>
                  <div className="bar-track">
                    <div
                      className={`bar-fill ${v.leaked ? 'danger' : ''}`}
                      style={{ width: `${(v.radius / maxRadius) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="panel">
          <div className="panel-head">
            <h2>策略盲区（无规则命中，走默认路径）</h2>
            <span className="muted-sm">{gaps.length} 条</span>
          </div>
          {gaps.length === 0 ? (
            <div className="empty">没有盲区：每条动作都被显式规则 / 守卫命中。</div>
          ) : (
            <ul className="gap-list">
              {gaps.map((v) => (
                <li key={v.action.id}>
                  <span className="q-emoji">{v.action.emoji}</span>
                  <code>{v.action.title}</code>
                  <span className={`gap-dec gap-${v.decision}`}>→ 默认{decLabel(v.decision)}</span>
                </li>
              ))}
            </ul>
          )}
          <p className="hint-sm">
            盲区 = 你没显式表态、全凭默认路径处置的动作。给对应工具类加一条显式规则即可收窄盲区。
          </p>
        </div>
      </div>
    </section>
  );
}

function decLabel(d: Verdict['decision']): string {
  return d === 'allow' ? '放行' : d === 'review' ? '人审' : '否决';
}
