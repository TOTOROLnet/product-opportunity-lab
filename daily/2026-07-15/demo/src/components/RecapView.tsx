import type { AnswerMap, Doc, UnitMastery } from '../types';
import {
  PASSIVE_BASELINE,
  computeUnitMastery,
  estimatedRetention,
  relistenQueue,
} from '../logic/mastery';
import { ScoreRing, StatusPill } from './shared';

interface Props {
  doc: Doc;
  answers: AnswerMap;
  onRelisten: (unit: UnitMastery) => void;
  onRestart: () => void;
  onBackToLibrary: () => void;
}

export function RecapView({ doc, answers, onRelisten, onRestart, onBackToLibrary }: Props) {
  const mastery = computeUnitMastery(doc, answers);
  const retention = estimatedRetention(mastery);
  const queue = relistenQueue(mastery);
  const lift = retention - PASSIVE_BASELINE;
  const confidentlyWrong = mastery.filter((m) => m.confidentlyWrong);

  return (
    <div className="view recap">
      <div className="recap__head">
        <div>
          <h1 className="recap__title">回顾 · {doc.title}</h1>
          <p className="recap__sub">这不是"听完了"，而是"听完记住了多少"——以及接下来该补哪里。</p>
        </div>
        <div className="recap__actions">
          <button className="btn btn--ghost" onClick={onRestart}>
            重头再听一遍
          </button>
          <button className="btn btn--ghost" onClick={onBackToLibrary}>
            换一份材料
          </button>
        </div>
      </div>

      <section className="ba">
        <div className="ba__title">被动听 vs 主动回忆听 · 估算留存对比</div>
        <div className="ba__bars">
          <div className="ba__row">
            <span className="ba__label">被动听基线</span>
            <div className="bar">
              <div className="bar__fill bar__fill--passive" style={{ width: `${PASSIVE_BASELINE}%` }}>
                <span>{PASSIVE_BASELINE}%</span>
              </div>
            </div>
          </div>
          <div className="ba__row">
            <span className="ba__label">耳记（本次）</span>
            <div className="bar">
              <div className="bar__fill bar__fill--active" style={{ width: `${retention}%` }}>
                <span>{retention}%</span>
              </div>
            </div>
          </div>
        </div>
        <div className="ba__lift">
          本次主动回忆相比被动听，估算多留存 <b>{lift > 0 ? `+${lift}` : lift}</b> 个百分点。
          <span className="ba__note">
            （被动听基线为教育学经验值，非精确测量；主动回忆留存取本次已作答概念掌握分均值。）
          </span>
        </div>
      </section>

      <section>
        <div className="section-title">保留度地图（逐概念）</div>
        <div className="map-grid">
          {mastery.map((m) => (
            <div key={m.unitId} className={`map-card map-card--${m.status}`}>
              <div className="map-card__top">
                <ScoreRing score={m.answered ? m.score : 0} />
                <StatusPill status={m.status} />
              </div>
              <div className="map-card__title">{m.title}</div>
              {m.confidentlyWrong && (
                <div className="map-card__warn">⚠ 自信地答错，最该纠偏</div>
              )}
            </div>
          ))}
        </div>
      </section>

      {confidentlyWrong.length > 0 && (
        <div className="danger-note">
          你有 <b>{confidentlyWrong.length}</b> 个概念属于"危险的自信"——你以为懂了，其实错了。
          被动听永远发现不了这一点，这正是主动回忆的价值。
        </div>
      )}

      <section className="queue">
        <div className="section-title">
          自适应重听队列 · 60 秒重听
          <span className="queue__count">{queue.length} 个待巩固</span>
        </div>
        {queue.length === 0 ? (
          <div className="queue__empty">🎉 本次所有概念都达到"已掌握"，无需重听。</div>
        ) : (
          <ul className="queue__list">
            {queue.map((m, i) => (
              <li key={m.unitId} className="queue__item">
                <span className="queue__rank">{i + 1}</span>
                <div className="queue__info">
                  <div className="queue__name">{m.title}</div>
                  <div className="queue__meta">
                    掌握分 {m.score} · <StatusPill status={m.status} />
                    {m.confidentlyWrong && ' · ⚠ 自信地错'}
                  </div>
                </div>
                <button className="btn btn--primary btn--sm" onClick={() => onRelisten(m)}>
                  🔁 重听并再测
                </button>
              </li>
            ))}
          </ul>
        )}
        <p className="queue__foot">
          队列按掌握分升序：最薄弱、以及"自信地错"的概念排在最前。重听是针对性的 60 秒微复习，
          而不是把整篇再放一遍——这就是"把注意力花在刀刃上"。
        </p>
      </section>
    </div>
  );
}
