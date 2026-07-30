import type { HostVerbosity } from '../types';
import {
  KIND_LABEL,
  ROLE_META,
  minutesRemaining,
  type BuiltProgram,
} from '../logic/engine';

export type SegStatus = 'pending' | 'read' | 'skipped';

interface Props {
  built: BuiltProgram;
  verbosity: HostVerbosity;
  currentIndex: number;
  statuses: SegStatus[];
  onRead: () => void;
  onSkip: () => void;
}

export default function PlayerView({
  built,
  verbosity,
  currentIndex,
  statuses,
  onRead,
  onSkip,
}: Props) {
  const seg = built.segments[currentIndex];
  const meta = ROLE_META[seg.role];
  const remaining = minutesRemaining(built.segments, currentIndex);
  const isLast = currentIndex === built.segments.length - 1;
  const skippedSoFar = statuses.filter((s) => s === 'skipped').length;

  return (
    <div className="player" style={{ ['--role-accent' as string]: meta.accent }}>
      <div className="progress-wrap">
        <div className="progress-head">
          <span>
            第 {currentIndex + 1} / {built.segments.length} 条
          </span>
          <span className="rem">还剩约 {remaining} 分钟 · 然后收播</span>
        </div>
        <div className="pbar">
          {built.segments.map((s, i) => {
            let cls = 'seg-bar';
            if (i === currentIndex) cls += ' now';
            else if (statuses[i] === 'read') cls += ' done';
            else if (statuses[i] === 'skipped') cls += ' skip';
            return <div key={s.item.id} className={cls} />;
          })}
        </div>
      </div>

      <div className="host-block">
        <div className="avatar">🎙️</div>
        <div>
          <div className="who">收播主持 · 串场口播</div>
          <p className="say">{seg.segment.hostIntro[verbosity]}</p>
        </div>
      </div>

      <div className="content-card">
        <span className="role-badge">{meta.label} · {meta.hint}</span>
        <h3>{seg.item.title}</h3>
        <div className="srcline">
          <span>{seg.item.source}</span>
          <span>· {KIND_LABEL[seg.item.kind]}</span>
          <span>· {seg.item.minutes} 分钟</span>
          <span style={{ color: 'var(--amber)' }}>· 存了 {seg.item.savedDaysAgo} 天</span>
        </div>
        <p className="excerpt">{seg.item.excerpt}</p>
        <div className="own">— 摘自你自己保存的内容，主持没有改写一个字。</div>
        <div className="tags">
          {seg.item.tags.map((t) => (
            <span key={t}>#{t}</span>
          ))}
        </div>
      </div>

      <div className="controls">
        <button className="btn btn-primary" onClick={onRead}>
          {isLast ? '读完了 · 收播 ↦' : '读完了 · 下一条 →'}
        </button>
        <button className="btn btn-ghost" onClick={onSkip}>
          {isLast ? '跳过 · 直接收播' : '跳过这条'}
        </button>
      </div>
      {skippedSoFar > 0 && (
        <div className="skip-note">
          主持记了一笔：你今晚跳过了 {skippedSoFar} 条，它们会留在积压里，明天可能再排给你。
        </div>
      )}
    </div>
  );
}
