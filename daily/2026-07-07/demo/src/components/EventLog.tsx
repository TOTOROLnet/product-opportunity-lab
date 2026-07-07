import { useMemo } from 'react';
import type { DiagnosisResult, Participant, RunEvent } from '../types';

interface Props {
  events: RunEvent[];
  participants: Participant[];
  result: DiagnosisResult;
}

export function EventLog({ events, participants, result }: Props) {
  const flagged = useMemo(() => {
    const s = new Set<string>();
    for (const d of result.detections) for (const id of d.eventIds) s.add(id);
    return s;
  }, [result]);

  const nameOf = (id?: string) =>
    id ? participants.find((p) => p.id === id)?.name ?? id : '';

  return (
    <div className="card">
      <h3>原始事件日志（before）</h3>
      <div className="log">
        {events.length === 0 && (
          <div className="diag-empty">拖动时间轴或点播放，事件会逐条流入。</div>
        )}
        {events.map((e) => (
          <div key={e.id} className={`log-row ${flagged.has(e.id) ? 'flagged' : ''}`}>
            <span className="log-t">{(e.t / 1000).toFixed(1)}s</span>
            <span className={`log-type ${e.type}`}>{e.type}</span>
            <span className="log-sum">
              <span className="log-from">
                {nameOf(e.from)}
                {e.to ? ` → ${nameOf(e.to)}` : ''}
                {e.resource ? ` · ${e.resource}` : ''}:{' '}
              </span>
              {e.summary}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
