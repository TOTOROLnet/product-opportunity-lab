import { useState } from 'react';
import type { Owner, RunResult } from '../types';

function ownerBadge(owner: Owner, pending: boolean) {
  if (owner === 'human') return <span className="badge human">🧑 你在执笔</span>;
  if (owner === 'agent') return <span className="badge agent">🤖 agent 执笔</span>;
  if (pending) return <span className="badge defer">空闲（有延后意图）</span>;
  return <span className="badge free">空闲</span>;
}

export default function OwnershipMap({ run, stepIdx }: { run: RunResult; stepIdx: number }) {
  const [sel, setSel] = useState<string | null>(null);
  const step = run.steps[stepIdx];
  const log = run.steps.slice(0, stepIdx + 1);

  return (
    <div>
      <div className="callout">
        <b>玻璃盒</b>：把抽象的「执笔权」摊开给你看——每个小节此刻属于谁、是否有 agent 的
        <b>延后意图（接力棒在队列里等待）</b>。这正是 CoBaton 相对「黑盒编辑器」的关键：协调逻辑可见、可回溯。
        点任一小节可筛选它的事件历史。{run.mode === 'naive' && '（朴素模式无所有权概念，agent 无视归属直接落改。）'}
      </div>

      <div className="map-grid">
        {step.doc.map((sec) => {
          const owner = step.ownership[sec.id];
          const pending = step.pending.includes(sec.id);
          return (
            <div
              key={sec.id}
              className={`map-cell ${sel === sec.id ? 'sel' : ''}`}
              onClick={() => setSel(sel === sec.id ? null : sec.id)}
            >
              <div className="mc-title">
                § {sec.title}
                {sec.deleted && <span className="badge bad" style={{ marginLeft: 6 }}>已删</span>}
              </div>
              <div className="mc-owner">{ownerBadge(owner, pending)}</div>
              {run.mode === 'cobaton' && pending && (
                <div className="baton">🟡 agent 意图已入队，等你离开后再校验落改</div>
              )}
            </div>
          );
        })}
      </div>

      <div className="card">
        <h3>
          逐事件日志{sel ? `（已筛选：§${step.doc.find((s) => s.id === sel)?.title ?? sel}）` : '（全部）'}
        </h3>
        <div className="log">
          {log
            .filter((s) => !sel || s.event.section === sel)
            .map((s) => (
              <div key={s.event.t} className={`log-item ${sel && s.event.section === sel ? 'hot' : ''}`}>
                <span className="t">#{s.event.t}</span>
                {s.note}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
