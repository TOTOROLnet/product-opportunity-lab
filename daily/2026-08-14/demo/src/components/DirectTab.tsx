import { useState } from 'react';
import type { Shot, DirectorNote, Pace } from '../types';
import { statusOf, hasEdit, regenerate } from '../engine';
import { TONE_OPTIONS } from '../data/mock';
import { ShotThumb, StatusPill, DiffText, PACE_LABEL } from './shared';

interface Props {
  shots: Shot[];
  notes: Record<string, DirectorNote>;
  setNote: (shotId: string, patch: Partial<DirectorNote>) => void;
  applyPreset: () => void;
  resetNotes: () => void;
  onPreview: () => void;
}

const PACES: Pace[] = ['slow', 'keep', 'fast'];

// 导演台：产品核心界面。逐镜说戏——自然语言笔记 + 快捷控件 + 锁定。
export default function DirectTab({ shots, notes, setNote, applyPreset, resetNotes, onPreview }: Props) {
  const [selId, setSelId] = useState(shots[0].id);
  const sel = shots.find((s) => s.id === selId)!;
  const selNote = notes[selId];
  const locked = selNote.locked;

  const counts = shots.reduce(
    (acc, s) => {
      acc[statusOf(notes[s.id])]++;
      return acc;
    },
    { locked: 0, toRevise: 0, untouched: 0 } as Record<string, number>,
  );

  const preview = statusOf(selNote) === 'toRevise' ? regenerate(sel, selNote) : null;

  return (
    <div className="tab">
      <div className="panel-head">
        <div>
          <h2>导演台 · 逐镜说戏</h2>
          <p className="muted">
            像导演对剪辑师说戏一样：选中镜头，给一句话意图或点几下控件；满意的镜头就 🔒 锁定，改稿时逐字保留。
          </p>
        </div>
        <div className="head-actions">
          <button className="btn ghost" onClick={applyPreset}>
            ✨ 一键填充导演意图
          </button>
          <button className="btn ghost" onClick={resetNotes}>
            重置
          </button>
        </div>
      </div>

      <div className="tally">
        <span className="pill pill-locked">🔒 锁定 {counts.locked}</span>
        <span className="pill pill-revise">✎ 待重生成 {counts.toRevise}</span>
        <span className="pill pill-untouched">— 未改动 {counts.untouched}</span>
      </div>

      <div className="direct-grid">
        <aside className="shot-list">
          {shots.map((s) => (
            <button
              key={s.id}
              className={'shot-chip' + (s.id === selId ? ' sel' : '')}
              onClick={() => setSelId(s.id)}
            >
              <ShotThumb shot={s} small />
              <div className="chip-body">
                <div className="chip-top">
                  <span>
                    #{s.index} {s.label}
                  </span>
                  <StatusPill status={statusOf(notes[s.id])} />
                </div>
                <div className="chip-script muted">{s.script}</div>
              </div>
            </button>
          ))}
        </aside>

        <section className="editor">
          <div className="editor-head">
            <span className="shot-label">
              #{sel.index} {sel.label}
            </span>
            <label className="lock-toggle">
              <input
                type="checkbox"
                checked={locked}
                onChange={(e) => setNote(selId, { locked: e.target.checked })}
              />
              🔒 锁定这个镜头（已认可，改稿时保留原样）
            </label>
          </div>

          <p className="orig-script">{sel.script}</p>

          <fieldset className="controls" disabled={locked}>
            <label className="field">
              <span>导演笔记（自然语言）</span>
              <textarea
                rows={2}
                placeholder="例如：钩子太温，前两秒直接抛冲突，别铺垫"
                value={selNote.text}
                onChange={(e) => setNote(selId, { text: e.target.value })}
              />
            </label>

            <div className="quick">
              <div className="qgroup">
                <span className="qlabel">节奏</span>
                <div className="seg">
                  {PACES.map((p) => (
                    <button
                      key={p}
                      className={selNote.pace === p ? 'on' : ''}
                      onClick={() => setNote(selId, { pace: p })}
                    >
                      {PACE_LABEL[p]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="qgroup">
                <span className="qlabel">情绪</span>
                <div className="seg">
                  {([-1, 0, 1] as const).map((d) => (
                    <button
                      key={d}
                      className={selNote.energyDelta === d ? 'on' : ''}
                      onClick={() => setNote(selId, { energyDelta: d })}
                    >
                      {d > 0 ? '+ 更燃' : d < 0 ? '− 克制' : '保持'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="qgroup">
                <span className="qlabel">强调</span>
                <button
                  className={'toggle' + (selNote.emphasize ? ' on' : '')}
                  onClick={() => setNote(selId, { emphasize: !selNote.emphasize })}
                >
                  {selNote.emphasize ? '✓ 突出关键短语' : '突出关键短语'}
                </button>
              </div>

              <div className="qgroup">
                <span className="qlabel">语气</span>
                <select value={selNote.tone} onChange={(e) => setNote(selId, { tone: e.target.value })}>
                  {TONE_OPTIONS.map((t) => (
                    <option key={t} value={t}>
                      {t === '' ? '不改' : t}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </fieldset>

          <div className="live">
            <div className="live-head">实时预览（导演引擎会怎么改这一镜）</div>
            {locked ? (
              <p className="muted">🔒 已锁定 —— 改稿时逐字保留，不会重生成。</p>
            ) : preview ? (
              <>
                <DiffText tokens={preview.tokens} />
                <ul className="rationale">
                  {preview.rationale.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="muted">
                {hasEdit(selNote) ? '' : '还没给这一镜说戏 —— 它会保持原样（未改动）。'}
              </p>
            )}
          </div>
        </section>
      </div>

      <div className="cta-row">
        <span className="muted">
          说好了？下一步只重生成「待重生成」的镜头，锁定与未改动的逐字保留。
        </span>
        <button className="btn primary" onClick={onPreview} disabled={counts.toRevise === 0}>
          预览改动 →
        </button>
      </div>
    </div>
  );
}
