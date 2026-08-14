import type { Shot, DirectorNote } from '../types';
import { statusOf, regenerate } from '../engine';
import { ShotThumb, StatusPill, DiffText, MetaRow } from './shared';

interface Props {
  shots: Shot[];
  notes: Record<string, DirectorNote>;
  onApply: () => void;
  onBack: () => void;
}

// 改动预览：before/after 的 keep-vs-regenerate diff + 成本/保留度可视化 + 改稿路径对比。
export default function DiffTab({ shots, notes, onApply, onBack }: Props) {
  const total = shots.length;
  const revised = shots.filter((s) => statusOf(notes[s.id]) === 'toRevise').length;
  const locked = shots.filter((s) => statusOf(notes[s.id]) === 'locked').length;
  const kept = total - revised;
  const keepPct = Math.round((kept / total) * 100);

  return (
    <div className="tab">
      <div className="panel-head">
        <div>
          <h2>改动预览 · 只改被点名的，其余逐字保留</h2>
          <p className="muted">
            左＝初稿，右＝改稿引擎的提案。锁定与未改动镜头 100% 保留；只有「待重生成」镜头被改写。
          </p>
        </div>
        <button className="btn ghost" onClick={onBack}>
          ← 回导演台
        </button>
      </div>

      <div className="value-cards">
        <div className="vcard">
          <div className="vnum">{kept}/{total}</div>
          <div className="vlab">镜头逐字保留</div>
          <div className="bar">
            <span style={{ width: `${keepPct}%` }} />
          </div>
          <div className="muted small">保留度 {keepPct}%（其中 🔒 锁定 {locked} 镜）</div>
        </div>
        <div className="vcard">
          <div className="vnum">{revised}</div>
          <div className="vlab">镜头被重生成</div>
          <div className="muted small">只对点名镜头调用生成，精确作用</div>
        </div>
        <div className="vcard accent">
          <div className="vnum">省 {total - revised}×</div>
          <div className="vlab">相对「整片重来」省下的镜头生成</div>
          <div className="muted small">整片重来会重烧 {total} 镜；说戏只烧 {revised} 镜</div>
        </div>
      </div>

      <div className="diff-list">
        {shots.map((s) => {
          const note = notes[s.id];
          const st = statusOf(note);
          const regen = st === 'toRevise' ? regenerate(s, note) : null;
          const after: Shot = regen
            ? { ...s, script: regen.result.script, pace: regen.result.pace, energy: regen.result.energy, durationSec: regen.result.durationSec }
            : s;
          return (
            <div key={s.id} className={'diff-row ' + st}>
              <div className="diff-side before">
                <div className="side-head">
                  <ShotThumb shot={s} small />
                  <span className="shot-label">
                    #{s.index} {s.label}
                  </span>
                  <span className="side-tag">初稿</span>
                </div>
                <p className="script">{s.script}</p>
                <MetaRow shot={s} />
              </div>

              <div className="diff-arrow">
                <StatusPill status={st} />
              </div>

              <div className="diff-side after">
                <div className="side-head">
                  <span className="side-tag right">{regen ? '重生成' : '保留原样'}</span>
                </div>
                {regen ? (
                  <>
                    <DiffText tokens={regen.tokens} />
                    <MetaRow shot={after} />
                    <ul className="rationale">
                      {regen.rationale.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <p className="script kept">
                    {s.script}
                    <span className="keep-badge">
                      {st === 'locked' ? '🔒 已认可 · 逐字保留' : '— 未改动 · 逐字保留'}
                    </span>
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="compare">
        <h3>为什么用「说戏」，而不是另外两条路</h3>
        <table className="compare-table">
          <thead>
            <tr>
              <th>改稿路径</th>
              <th>保住已认可的镜头？</th>
              <th>能精确指向某一镜？</th>
              <th>成本 / 门槛</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>回时间线手剪</td>
              <td className="bad">要，但得自己动手</td>
              <td className="ok">能</td>
              <td className="bad">否定「无时间线」，还得会剪辑</td>
            </tr>
            <tr>
              <td>整片重生成</td>
              <td className="bad">✗ 丢掉好的 80%</td>
              <td className="bad">✗ 只能整片重来</td>
              <td className="bad">重烧 {total} 镜，结果还可能变差</td>
            </tr>
            <tr className="win">
              <td>说戏（本方案）</td>
              <td className="ok">✓ 锁定即逐字保留</td>
              <td className="ok">✓ 镜头级、意图级</td>
              <td className="ok">只烧 {revised} 镜，可解释</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="cta-row">
        <span className="muted">确认后应用改动，回放映台看收敛后的成片。</span>
        <button className="btn primary" onClick={onApply}>
          ✓ 应用改动，回放映台
        </button>
      </div>
    </div>
  );
}
