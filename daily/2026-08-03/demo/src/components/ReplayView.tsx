import { useMemo } from 'react';
import type { Profile, Topic } from '../types';
import { TOPIC_ICON, TOPIC_LABEL, WEEK_INTERACTIONS } from '../data/situations';
import {
  avgMidAutonomy,
  classifyWeek,
  defaultProfile,
  OVERSTEP_THRESHOLD,
  profileArchetype,
} from '../logic/engine';
import { AUTONOMY_COLOR, AutonomyPill, cx, DistBar, OutcomeChip, StakesBadge } from './shared';

interface Props {
  profile: Profile;
  onTighten: (topic: Topic) => void;
  onGoRehearsal: () => void;
}

export default function ReplayView({ profile, onTighten, onGoRehearsal }: Props) {
  const week = useMemo(() => classifyWeek(WEEK_INTERACTIONS, profile), [profile]);
  const base = useMemo(() => classifyWeek(WEEK_INTERACTIONS, defaultProfile()), []);
  const arch = profileArchetype(profile);

  const flagTopics = Array.from(new Set(week.flags.map((f) => f.interaction.topic)));

  return (
    <div className="view">
      <div className="view-head">
        <div>
          <h2>一周回放 · 按你的分寸，它这周会怎么做</h2>
          <p className="muted">
            用当前画像回放 {week.total} 条 mock 互动。诚实告诉你它会<b>替你处理 / 拟稿 / 退回 / 拦下</b>各多少，并高亮<b>差一点出格</b>的几件——一键收紧后<b>实时重算</b>。
          </p>
        </div>
        <button className="ghost" onClick={onGoRehearsal}>
          ← 回彩排台改拍板
        </button>
      </div>

      <div className="replay-summary two-col">
        <div className="card">
          <h4>本周处理分布（{week.total} 件）</h4>
          <DistBar counts={week.counts} total={week.total} />
          <div className="count-row">
            <span className="count-chip" style={{ color: '#38d39f' }}>替你处理 <b>{week.counts.handled}</b></span>
            <span className="count-chip" style={{ color: '#7c9cff' }}>拟稿待批 <b>{week.counts.draft}</b></span>
            <span className="count-chip" style={{ color: '#f2b34d' }}>退回拍板 <b>{week.counts.ask}</b></span>
            <span className="count-chip" style={{ color: '#f2657a' }}>直接拦下 <b>{week.counts.blocked}</b></span>
          </div>
          <div className="arch-line">当前分寸性格：<b>{arch.title}</b></div>
        </div>

        <div className="card compare-card">
          <h4>初始默认 → 当前</h4>
          <div className="compare-row">
            <span>差一点出格</span>
            <span className="compare-vals">
              <b className="dim">{base.flags.length}</b>
              <span className="arrow">→</span>
              <b style={{ color: week.flags.length === 0 ? '#38d39f' : '#f2b34d' }}>{week.flags.length}</b>
            </span>
          </div>
          <div className="compare-row">
            <span>替你处理</span>
            <span className="compare-vals">
              <b className="dim">{base.counts.handled}</b>
              <span className="arrow">→</span>
              <b>{week.counts.handled}</b>
            </span>
          </div>
          <div className="compare-row">
            <span>平均授权（中风险）</span>
            <span className="compare-vals">
              <b className="dim">{avgMidAutonomy(defaultProfile()).toFixed(2)}</b>
              <span className="arrow">→</span>
              <b>{avgMidAutonomy(profile).toFixed(2)}</b>
            </span>
          </div>
          <p className="muted small">收紧一条，就能立刻看到"它会替你做多少、还差点出格几件"随之变化——信任是可校准的，不是开机赌运气。</p>
        </div>
      </div>

      <div className="card flags-card">
        <div className="flags-head">
          <h4>
            差一点出格 <span className="flag-count">{week.flags.length}</span>
            <span className="muted small">（出格贴近度 = 授权 × 风险 ≥ {OVERSTEP_THRESHOLD}）</span>
          </h4>
          {flagTopics.length > 0 && (
            <button className="cta small" onClick={() => flagTopics.forEach((t) => onTighten(t))}>
              一键收紧全部出格项
            </button>
          )}
        </div>
        {week.flags.length === 0 ? (
          <div className="all-clear">✓ 本周没有"差一点出格"的事了 —— 你已经把边界收到自己安心的程度。</div>
        ) : (
          <ul className="flag-list">
            {week.flags.map((f) => (
              <li key={f.interaction.id} className="flag-item">
                <div className="flag-main">
                  <div className="flag-title">
                    {TOPIC_ICON[f.interaction.topic]} {f.interaction.summary}
                  </div>
                  <div className="flag-meta">
                    <StakesBadge stakes={f.interaction.stakes} />
                    <span className="muted small">它会：</span>
                    <AutonomyPill level={f.autonomy} />
                    <span className="muted small">出格贴近度 {f.risk}</span>
                  </div>
                  <div className="flag-why">
                    高风险的事被"{f.autonomy === 'handle' ? '放手直接做' : '拟稿待批'}"，一旦它做得不合你意，可能已经以你的名义说出去了。
                  </div>
                </div>
                <button
                  className="tighten-btn"
                  style={{ borderColor: AUTONOMY_COLOR.ask }}
                  onClick={() => onTighten(f.interaction.topic)}
                >
                  收紧「{TOPIC_LABEL[f.interaction.topic]}」一档
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="card timeline-card">
        <h4>一周时间线</h4>
        <ul className="timeline">
          {week.items.map((it) => (
            <li key={it.interaction.id} className={cx('tl-item', it.flagged && 'tl-flagged')}>
              <span className="tl-day">
                {it.interaction.day} {it.interaction.time}
              </span>
              <span className="tl-topic">
                {TOPIC_ICON[it.interaction.topic]} {TOPIC_LABEL[it.interaction.topic]}
              </span>
              <span className="tl-summary">{it.interaction.summary}</span>
              <StakesBadge stakes={it.interaction.stakes} />
              <OutcomeChip outcome={it.outcome} />
              {it.flagged && <span className="tl-flag">⚠ 差点出格</span>}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
