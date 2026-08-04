import { CONF_THRESHOLD } from '../logic/engine';

export const C = {
  good: '#38d39f',
  fix: '#f2b34d',
  unseen: '#6f7cab',
  stop: '#f2657a',
  accent: '#5fd0b6',
};

export function cx(...parts: (string | false | undefined)[]): string {
  return parts.filter(Boolean).join(' ');
}

export function verdictColor(verdict: 'good' | 'fix' | 'unseen'): string {
  return C[verdict];
}

// 「看得清吗」实时置信度条：阈值线 + 达标/看不清着色。
export function ConfidenceMeter({ confidence }: { confidence: number }) {
  const pct = Math.round(confidence * 100);
  const ok = confidence >= CONF_THRESHOLD;
  const col = ok ? C.good : C.stop;
  return (
    <div className="conf">
      <div className="conf-top">
        <span>看得清吗（感知置信度）</span>
        <b style={{ color: col }}>{pct}%</b>
      </div>
      <div className="conf-track">
        <div className="conf-fill" style={{ width: pct + '%', background: col }} />
        <div className="conf-thr" style={{ left: CONF_THRESHOLD * 100 + '%' }} title="判定阈值">
          <span>阈值 {Math.round(CONF_THRESHOLD * 100)}%</span>
        </div>
      </div>
      <div className="conf-note" style={{ color: col }}>
        {ok ? '能看清 → 才给判定' : '看不清 → 只说看不清，不计数、不瞎纠'}
      </div>
    </div>
  );
}

export function Dot({ color, size = 10 }: { color: string; size?: number }) {
  return <span style={{ width: size, height: size, borderRadius: '50%', background: color, display: 'inline-block', flex: 'none' }} />;
}

export function StatChip({ label, value, color, sub }: { label: string; value: string | number; color?: string; sub?: string }) {
  return (
    <div className="statchip">
      <div className="statchip-label">{label}</div>
      <div className="statchip-value" style={color ? { color } : undefined}>
        {value}
      </div>
      {sub && <div className="statchip-sub">{sub}</div>}
    </div>
  );
}
