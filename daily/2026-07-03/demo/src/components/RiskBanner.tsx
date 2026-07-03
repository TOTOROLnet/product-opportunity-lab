import type { RiskResult } from '../types';

interface Props {
  result: RiskResult;
  baseline: RiskResult;
}

function gaugeColor(v: number): string {
  if (v >= 55) return 'var(--high)';
  if (v >= 25) return 'var(--medium)';
  return 'var(--low)';
}

function DeltaRow({ label, cur, base }: { label: string; cur: number; base: number }) {
  const d = cur - base;
  const cls = d < 0 ? 'down' : d > 0 ? 'up' : 'same';
  const arrow = d < 0 ? '▼' : d > 0 ? '▲' : '＝';
  const text = d === 0 ? '无变化' : `${arrow} ${Math.abs(d)}`;
  return (
    <div className="drow">
      <span className="dl">{label}</span>
      <span className={cls}>{text}</span>
    </div>
  );
}

export default function RiskBanner({ result, baseline }: Props) {
  const changed =
    result.totalRisk !== baseline.totalRisk || result.highCount !== baseline.highCount;
  return (
    <div className="banner">
      <div
        className="gauge"
        style={
          {
            ['--v' as string]: result.totalRisk,
            ['--gauge-color' as string]: gaugeColor(result.totalRisk),
          } as React.CSSProperties
        }
      >
        <div className="gv">
          <b>{result.totalRisk}</b>
          <span>/ 100</span>
        </div>
      </div>

      <div className="banner-main">
        <h2>
          发现 {result.highCount} 条高危链路
          {result.mediumCount > 0 ? ` · ${result.mediumCount} 条中危` : ''}
        </h2>
        <p>
          单看每个工具的权限都"还好"，但把它们能被 Agent 串起来的路径摊开看——总残余风险{' '}
          <b>{result.totalRisk}/100</b>。风险来自<b>组合</b>，不是单个工具。
        </p>
        <div className="pill-row">
          {result.activePaths.slice(0, 4).map((p) => (
            <span key={p.id} className={`pill ${p.severity}`}>
              {p.label.split(' → ')[0]} → …→ {p.label.split(' → ').slice(-1)[0]}（{p.score}）
            </span>
          ))}
          {result.activePaths.length === 0 && (
            <span className="pill">当前策略下已无可执行的高危链路</span>
          )}
        </div>
      </div>

      <div className="delta">
        <div className="dl">相对初始策略（before → after）</div>
        <DeltaRow label="总风险" cur={result.totalRisk} base={baseline.totalRisk} />
        <DeltaRow label="高危链路" cur={result.highCount} base={baseline.highCount} />
        {!changed && (
          <div className="drow">
            <span className="same" style={{ fontSize: 11 }}>
              到「策略模拟器」收紧权限试试
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
