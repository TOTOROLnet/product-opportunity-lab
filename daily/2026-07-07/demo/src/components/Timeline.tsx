import { useMemo } from 'react';
import type { DiagnosisResult, RunEvent } from '../types';

interface Props {
  events: RunEvent[];
  currentTime: number;
  maxTime: number;
  playing: boolean;
  result: DiagnosisResult;
  onTogglePlay: () => void;
  onSeek: (t: number) => void;
  onRestart: () => void;
}

export function Timeline({
  events,
  currentTime,
  maxTime,
  playing,
  result,
  onTogglePlay,
  onSeek,
  onRestart,
}: Props) {
  // 每个检测器在其因果链"最后一个事件"的时间点放一个标记
  const marks = useMemo(() => {
    const idToEvent = new Map(events.map((e) => [e.id, e] as const));
    return result.detections.map((d) => {
      const times = d.eventIds
        .map((id) => idToEvent.get(id)?.t ?? 0)
        .filter((t) => t > 0 || d.eventIds.length === 1);
      const t = times.length ? Math.max(...times) : 0;
      return { t, severity: d.severity, title: d.title };
    });
  }, [events, result]);

  return (
    <div className="timeline">
      <div className="tl-controls">
        <button onClick={onTogglePlay}>{playing ? '⏸ 暂停' : '▶ 播放'}</button>
        <button className="ghost" onClick={onRestart}>
          ↻ 重放
        </button>
        <span className="tl-time">
          t = {(currentTime / 1000).toFixed(1)}s / {(maxTime / 1000).toFixed(1)}s ·{' '}
          {events.filter((e) => e.t <= currentTime).length}/{events.length} 事件
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={maxTime}
        step={50}
        value={currentTime}
        onChange={(e) => onSeek(Number(e.target.value))}
      />
      <div className="tl-track">
        {marks.map((m, i) => (
          <div
            key={i}
            className={`tl-mark ${m.severity === 'critical' ? 'crit' : 'warn'}`}
            style={{ left: `${maxTime ? (m.t / maxTime) * 100 : 0}%` }}
            title={`${m.title} @ ${(m.t / 1000).toFixed(1)}s`}
          />
        ))}
      </div>
    </div>
  );
}
