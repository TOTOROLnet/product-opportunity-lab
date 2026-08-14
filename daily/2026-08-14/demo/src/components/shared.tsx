import type { Shot, ShotStatus, DiffToken, Pace } from '../types';

export const PACE_LABEL: Record<Pace, string> = { slow: '慢', keep: '常规', fast: '快' };

export const STATUS_META: Record<ShotStatus, { label: string; cls: string }> = {
  locked: { label: '🔒 已锁定', cls: 'pill pill-locked' },
  toRevise: { label: '✎ 待重生成', cls: 'pill pill-revise' },
  untouched: { label: '— 未改动', cls: 'pill pill-untouched' },
};

export function StatusPill({ status }: { status: ShotStatus }) {
  const m = STATUS_META[status];
  return <span className={m.cls}>{m.label}</span>;
}

export function EnergyDots({ value }: { value: number }) {
  return (
    <span className="energy" title={`情绪强度 ${value}/5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= value ? 'dot on' : 'dot'} />
      ))}
    </span>
  );
}

export function ShotThumb({ shot, small }: { shot: Shot; small?: boolean }) {
  return (
    <div
      className={small ? 'thumb thumb-sm' : 'thumb'}
      style={{ background: `linear-gradient(135deg, ${shot.color}, #1b2233)` }}
    >
      <span className="thumb-emoji">{shot.emoji}</span>
      <span className="thumb-idx">#{shot.index}</span>
    </div>
  );
}

export function DiffText({ tokens }: { tokens: DiffToken[] }) {
  return (
    <p className="difftext">
      {tokens.map((t, i) => {
        if (t.kind === 'del') return <del key={i}>{t.text}</del>;
        if (t.kind === 'add') return <ins key={i}>{t.text}</ins>;
        if (t.kind === 'emph') return <mark key={i}>{t.text}</mark>;
        return <span key={i}>{t.text}</span>;
      })}
    </p>
  );
}

export function MetaRow({ shot }: { shot: Shot }) {
  return (
    <div className="meta-row">
      <span className="tag">⏱ {shot.durationSec}s</span>
      <span className="tag">节奏 {PACE_LABEL[shot.pace]}</span>
      <span className="tag energy-tag">
        情绪 <EnergyDots value={shot.energy} />
      </span>
    </div>
  );
}
