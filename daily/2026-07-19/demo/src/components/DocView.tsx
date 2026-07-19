import type { ReactNode } from 'react';
import type { Section, TraceStep } from '../types';

function renderBody(body: string, humanText?: string): ReactNode {
  if (humanText && body.includes(humanText)) {
    const idx = body.indexOf(humanText);
    return (
      <>
        {body.slice(0, idx)}
        <mark>{humanText}</mark>
        {body.slice(idx + humanText.length)}
      </>
    );
  }
  return body;
}

interface SectionMeta {
  cls: string;
  badge: ReactNode;
}

function metaFor(step: TraceStep, sec: Section): SectionMeta {
  const id = sec.id;
  const hl = step.highlight;
  const owner = step.ownership[id];
  const deferred = step.pending.includes(id);

  if (sec.deleted) {
    return { cls: 'deleted', badge: <span className="badge bad">已删除</span> };
  }
  if (hl.lostAt === id) {
    return { cls: 'bad', badge: <span className="badge bad">编辑丢失</span> };
  }
  if (hl.interruptedAt === id) {
    return { cls: 'bad', badge: <span className="badge bad">被打断</span> };
  }
  if (hl.wastedAt === id) {
    return { cls: 'bad', badge: <span className="badge bad">白做</span> };
  }
  if (hl.revalidatedAt === id) {
    return { cls: 'edited', badge: <span className="badge agent">已再校验落改</span> };
  }
  if (hl.parallelAt === id) {
    return { cls: 'edited', badge: <span className="badge agent">并行落改</span> };
  }
  if (hl.agentEdited === id) {
    return { cls: 'edited', badge: <span className="badge agent">agent 落改</span> };
  }
  if (deferred) {
    return { cls: 'deferred', badge: <span className="badge defer">agent 延后中</span> };
  }
  if (owner === 'human') {
    return { cls: 'owner-human', badge: <span className="badge human">🧑 你在此</span> };
  }
  if (owner === 'agent') {
    return { cls: 'owner-agent', badge: <span className="badge agent">agent 认领中</span> };
  }
  return { cls: '', badge: <span className="badge free">空闲</span> };
}

export default function DocView({
  step,
  humanTexts,
}: {
  step: TraceStep;
  humanTexts: Record<string, string>;
}) {
  return (
    <div className="doc">
      {step.doc.map((sec) => {
        const { cls, badge } = metaFor(step, sec);
        return (
          <div key={sec.id} className={`section ${cls}`}>
            <div className="sec-head">
              <span className="sec-title">§ {sec.title}</span>
              {badge}
            </div>
            <div className="sec-body">{renderBody(sec.body, humanTexts[sec.id])}</div>
          </div>
        );
      })}
    </div>
  );
}
