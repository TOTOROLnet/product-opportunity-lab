import { useMemo } from 'react';
import type { DiagnosisResult, SignatureId } from '../types';
import { CORPUS, SIGNATURES } from '../data/corpus';
import { Pill, SeverityTag } from './ui';

export function MovesView({
  live,
  selected,
  mastered,
  onSelect,
  onToggleMaster,
}: {
  live: DiagnosisResult;
  selected: SignatureId;
  mastered: Set<SignatureId>;
  onSelect: (id: SignatureId) => void;
  onToggleMaster: (id: SignatureId) => void;
}) {
  const sig = SIGNATURES[selected];
  const done = mastered.has(selected);

  // 用「你自己」命中该失手最典型的一次会话做复盘（取该 primary 下多花轮次最多的一条）
  const example = useMemo(() => {
    const cands = CORPUS.filter((a) => a.primary === selected);
    return cands.slice().sort((a, b) => b.rounds - a.rounds)[0];
  }, [selected]);

  // 招式按影响力排序，方便左栏浏览
  const ordered = live.perSignature.map((d) => d.signature.id);

  return (
    <div className="view moves-view">
      <aside className="moves-rail">
        <div className="rail-title">招式库</div>
        {ordered.map((id, i) => {
          const s = SIGNATURES[id];
          const m = mastered.has(id);
          return (
            <button
              key={id}
              className={`rail-item ${id === selected ? 'active' : ''} ${m ? 'mastered' : ''}`}
              onClick={() => onSelect(id)}
            >
              <span className="rail-emoji">{s.emoji}</span>
              <span className="rail-name">
                #{i + 1} {s.name}
              </span>
              {m && <span className="rail-check">✓</span>}
            </button>
          );
        })}
      </aside>

      <div className="moves-detail">
        <section className="panel">
          <div className="move-head">
            <span className="move-emoji">{sig.emoji}</span>
            <div>
              <div className="move-name-row">
                <h2>{sig.name}</h2>
                <SeverityTag severity={sig.severity} />
                {done && <Pill tone="good">已掌握</Pill>}
              </div>
              <p className="move-plain">{sig.plain}</p>
            </div>
          </div>

          <div className="move-block">
            <div className="block-label">💡 破解招式</div>
            <p className="move-move">{sig.move}</p>
          </div>

          <div className="move-block">
            <div className="block-label">📋 可复用模板（照抄改空即可）</div>
            <pre className="move-template">{sig.template}</pre>
          </div>
        </section>

        <section className="panel replay">
          <div className="panel-head">
            <h2>复盘：你自己的这一次</h2>
            <span className="panel-sub">
              {example.date} · {example.domain} · {example.task}
            </span>
          </div>
          <div className="replay-grid">
            <div className="replay-col before">
              <div className="replay-tag tag-before">当时（{example.rounds} 轮 · {outcomeLabel(example.outcome)}）</div>
              <div className="replay-sub">你的 prompt</div>
              <div className="replay-prompt">{example.prompt}</div>
              <div className="replay-sub">结果</div>
              <div className="replay-result">{example.beforeResult}</div>
            </div>
            <div className="replay-arrow">应用招式 →</div>
            <div className="replay-col after">
              <div className="replay-tag tag-after">改后</div>
              <div className="replay-sub">你的 prompt</div>
              <div className="replay-prompt">{example.fixedPrompt}</div>
              <div className="replay-sub">结果</div>
              <div className="replay-result">{example.afterResult}</div>
            </div>
          </div>
          <p className="mock-note">
            ⓘ 复盘为示意：掌握一招≠该毛病清零——习惯要反复练，引擎按「掌握后该失手伤害修复约 70%、残留 30%」
            建模，所以「长进」页的上手指数不会瞬间满分。
          </p>
        </section>

        <div className="move-actions">
          <button className={`btn ${done ? 'btn-ghost' : 'btn-primary'}`} onClick={() => onToggleMaster(selected)}>
            {done ? '取消「已掌握」' : '练这招 · 标记掌握 ✓'}
          </button>
          <span className="move-hint">标记掌握后，去「长进」页看你的指标怎么变。</span>
        </div>
      </div>
    </div>
  );
}

function outcomeLabel(o: string): string {
  return o === 'satisfied' ? '满意' : o === 'settled' ? '将就' : '放弃';
}
