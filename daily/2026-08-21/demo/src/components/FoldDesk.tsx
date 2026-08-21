import { useMemo, useState } from 'react';
import type { Trajectory, FoldRow } from '../types';
import { evaluateCompaction } from '../engine';
import { Badge, Card, Meter } from './ui';
import { FOLD_LABEL, TYPE_ICON, TYPE_LABEL, riskTier, fmtTokens } from '../labels';
import { SUGGESTED_PINS } from '../data/trajectory';

const FOLD_TONE: Record<string, 'good' | 'mid' | 'high'> = {
  kept: 'good',
  lossy: 'mid',
  dropped: 'high',
};

function FoldItem({ row, onToggle }: { row: FoldRow; onToggle: () => void }) {
  const { item, effectiveState, defaultState, pinned, triggersIncident } = row;
  const changed = effectiveState !== defaultState;
  const tier = riskTier(item.riskWeight);
  return (
    <div className={`folditem folditem--${effectiveState} ${triggersIncident ? 'folditem--danger' : ''}`}>
      <div className="folditem__head">
        <span className="folditem__ico">{TYPE_ICON[item.type]}</span>
        <span className="folditem__label">{item.label}</span>
        <span className={`chip chip--${FOLD_TONE[effectiveState]}`}>{FOLD_LABEL[effectiveState]}</span>
        {changed ? <span className="chip chip--pin">← 因保命清单改判</span> : null}
      </div>
      <div className="folditem__body">{item.content}</div>
      <div className="folditem__meta">
        <span className="folditem__type">{TYPE_LABEL[item.type]}</span>
        <span className="folditem__tok">{item.tokens} tok</span>
        <span className={`folditem__risk folditem__risk--${tier.tone}`}>
          丢弃风险 {item.riskWeight}（{tier.label}）
        </span>
        {item.causesDriftAtStep !== undefined ? (
          <span className="folditem__mine">⚠ 若丢：第 {item.causesDriftAtStep} 步{item.severity === 'fatal' ? '致命跑偏' : '返工'}</span>
        ) : (
          <span className="folditem__safe">丢弃安全</span>
        )}
        {item.pinnable ? (
          <button
            className={`pinbtn ${pinned ? 'pinbtn--on' : ''}`}
            onClick={onToggle}
            title={pinned ? '取消钉住' : '钉入保命清单（压缩时必须保留）'}
          >
            {pinned ? '📌 已钉住' : '📌 钉住'}
          </button>
        ) : (
          <span className="pinbtn pinbtn--na">不建议钉</span>
        )}
      </div>
    </div>
  );
}

export function FoldDesk({
  traj,
  pinned,
  onTogglePin,
  onPinAll,
  onClearPins,
}: {
  traj: Trajectory;
  pinned: Set<string>;
  onTogglePin: (id: string) => void;
  onPinAll: (ids: string[]) => void;
  onClearPins: () => void;
}) {
  const [selectedId, setSelectedId] = useState(traj.compactions[0].id);
  const event = traj.compactions.find((c) => c.id === selectedId)!;
  const result = useMemo(() => evaluateCompaction(traj, event, pinned), [traj, event, pinned]);

  const droppedRisky = result.rows.filter(
    (r) => r.effectiveState === 'dropped' && r.item.causesDriftAtStep !== undefined,
  );
  const totalTok = result.rows.reduce((s, r) => s + r.item.tokens, 0);

  const beforeRows = result.rows;
  const afterRows = result.rows.filter((r) => r.effectiveState !== 'dropped');

  return (
    <div className="folddesk">
      {/* 左：轨迹时间线 */}
      <Card className="tl">
        <h3 className="card__h">轨迹时间线</h3>
        <p className="muted sm">
          {traj.title} · 共 {traj.totalSteps} 步 · {traj.compactions.length} 次压缩。点选压缩事件查看它折叠了什么。
        </p>
        <ol className="tl__list">
          {traj.steps.map((s) => {
            const isComp = s.kind === 'compaction';
            const active = isComp && s.compactionId === selectedId;
            return (
              <li
                key={s.step}
                className={`tl__row tl__row--${s.kind} ${active ? 'tl__row--active' : ''} ${isComp ? 'tl__row--click' : ''}`}
                onClick={isComp ? () => setSelectedId(s.compactionId!) : undefined}
              >
                <span className="tl__step">{s.step}</span>
                <span className="tl__title">
                  {s.title}
                  {s.detail ? <span className="tl__detail"> — {s.detail}</span> : null}
                </span>
              </li>
            );
          })}
        </ol>
      </Card>

      {/* 中：折叠差异 before/after */}
      <Card className="diff">
        <div className="diff__top">
          <div>
            <h3 className="card__h">折叠差异 · {event.title}</h3>
            <p className="muted sm">{event.reason}</p>
          </div>
        </div>

        {droppedRisky.length > 0 ? (
          <div className="alert alert--danger">
            ⚠ 本次压缩静默丢弃了 {droppedRisky.length} 条高危条目：
            <b> {droppedRisky.map((r) => r.item.label).join('、')} </b>
            —— 会在后续引爆跑偏。到右侧把它钉入保命清单。
          </div>
        ) : (
          <div className="alert alert--good">✅ 本次压缩仅丢弃安全条目（闲聊 / 已完成 / 已弃用），无高危丢弃。</div>
        )}

        <div className="ba">
          <div className="ba__col">
            <div className="ba__head">压缩前 · 窗口里的 {beforeRows.length} 条</div>
            {beforeRows.map((r) => (
              <FoldItem key={r.item.id} row={r} onToggle={() => onTogglePin(r.item.id)} />
            ))}
          </div>
          <div className="ba__arrow">⟶ 压缩 ⟶</div>
          <div className="ba__col">
            <div className="ba__head">压缩后 · 保留下来的 {afterRows.length} 条</div>
            {afterRows.length === 0 ? <div className="muted sm">（全部被丢）</div> : null}
            {afterRows.map((r) => (
              <div key={r.item.id} className={`aftercard aftercard--${r.effectiveState}`}>
                <span className="folditem__ico">{TYPE_ICON[r.item.type]}</span>
                <span className="aftercard__label">{r.item.label}</span>
                <span className={`chip chip--${FOLD_TONE[r.effectiveState]}`}>{FOLD_LABEL[r.effectiveState]}</span>
                {r.pinned ? <span className="chip chip--pin">📌 保命清单</span> : null}
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* 右：保命清单 + 本次压缩账单 */}
      <Card className="keeplist">
        <h3 className="card__h">保命清单（控制面）</h3>
        <p className="muted sm">钉住的条目：压缩时<b>必须保留</b>，绝不静默丢弃。</p>

        <div className="kl__actions">
          <button className="btn btn--sm" onClick={() => onPinAll(SUGGESTED_PINS)}>
            一键钉住风险项
          </button>
          <button className="btn btn--sm btn--ghost" onClick={onClearPins}>
            清空
          </button>
        </div>

        <div className="kl__scoreboard">
          <div className="kl__score">
            <div className="kl__score-h">本次压缩风险分</div>
            <div className={`kl__score-v kl__score-v--${riskTier(result.riskScore).tone}`}>
              {result.riskScore}
            </div>
            <Meter value={result.riskScore} max={200} tone={riskTier(result.riskScore).tone} />
          </div>
          <div className="kl__score">
            <div className="kl__score-h">本次省下 token</div>
            <div className="kl__score-v kl__score-v--low">{result.tokensSaved}</div>
            <Meter value={result.tokensSaved} max={totalTok} tone="mid" />
            <div className="muted xs">窗口共 {totalTok} tok</div>
          </div>
        </div>

        <div className="kl__list">
          {traj.items
            .filter((it) => event.windowItemIds.includes(it.id))
            .map((it) => {
              const row = result.rows.find((r) => r.item.id === it.id)!;
              const tier = riskTier(it.riskWeight);
              return (
                <label key={it.id} className={`kl__item ${!it.pinnable ? 'kl__item--na' : ''}`}>
                  <input
                    type="checkbox"
                    disabled={!it.pinnable}
                    checked={pinned.has(it.id)}
                    onChange={() => onTogglePin(it.id)}
                  />
                  <span className="kl__ico">{TYPE_ICON[it.type]}</span>
                  <span className="kl__name">{it.label}</span>
                  <Badge tone={tier.tone}>{it.riskWeight}</Badge>
                  <span className={`kl__state kl__state--${FOLD_TONE[row.effectiveState]}`}>
                    {FOLD_LABEL[row.effectiveState]}
                  </span>
                </label>
              );
            })}
        </div>

        <div className="kl__hint">
          已钉住 <b>{[...pinned].filter((id) => event.windowItemIds.includes(id)).length}</b> / 本窗口
          {event.windowItemIds.filter((id) => traj.items.find((i) => i.id === id)?.pinnable).length} 可钉项。
          去「回放」页看钉住后的结局变化 →
        </div>
      </Card>
    </div>
  );
}
