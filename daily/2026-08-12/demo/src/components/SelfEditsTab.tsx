import { useState } from 'react';
import type { AgentRun } from '../types';
import { chapterById } from '../logic/engine';

export default function SelfEditsTab({ run }: { run: AgentRun }) {
  const [marked, setMarked] = useState<Record<string, boolean>>({});

  return (
    <div>
      <div className="lead">
        这趟运行里，agent 不只改了你的项目，<b>还按 Continual Harness 给自己改了 {run.selfEdits.length} 处</b>
        （新增/更新了它的 skill 与 memory）。这些自我修订按 ID 可回滚，但如果你从不看，你的 agent
        会在你不知情的情况下慢慢变成另一个样子。随读把它单独拎出来给你<b>读懂</b>——只看懂 +
        可选「标记下次留意」，<b>不打分、不放行、不替你判对错</b>。
      </div>

      {run.selfEdits.map((s) => {
        const ch = chapterById(run, s.chapterId);
        return (
          <div className="selfedit" key={s.id}>
            <div className="row1">
              <span className="op">{s.op === 'add' ? '＋ 新增' : '✎ 更新'}</span>
              <span className="kindpill">{s.kind}</span>
              <span className="sename mono">{s.name}</span>
            </div>

            <div className="ba">
              <div className="col before">
                <div className="lab">此前</div>
                <div className="val">{s.before ?? '（此前没有这条）'}</div>
              </div>
              <div className="col after">
                <div className="lab">改成</div>
                <div className="val">{s.after}</div>
              </div>
            </div>

            <div className="se-meta">
              <div className="k">这会如何改变它下次的行为</div>
              <div className="impact">{s.futureImpact}</div>
              <div className="ev">
                触发依据：{s.evidence}
                {ch ? `（发生在「${ch.phase} · ${ch.title}」）` : ''}
              </div>
            </div>

            <div className="mark">
              <button
                className={`markbtn ${marked[s.id] ? 'on' : ''}`}
                onClick={() => setMarked((m) => ({ ...m, [s.id]: !m[s.id] }))}
              >
                {marked[s.id] ? '✓ 已标记「下次留意」' : '标记「下次留意」'}
              </button>
              <div className="nonverdict">
                标记只是给你自己留个记号，随读不会替你回滚或放行——真实产品里，回滚由你在
                harness 侧按 ID 执行。
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
