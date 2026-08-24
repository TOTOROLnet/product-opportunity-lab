import { useMemo, useState } from 'react';
import type { StressAxis, WorkloadProfile } from '../types';
import { DEFAULT_PROFILE, SCENARIOS } from '../data/scenarios';
import { AXIS_META, evaluate, fmtInt, fmtMoney, fmtPct, stressScan } from '../lib/costModel';
import { advise } from '../lib/advisor';
import { StressChart } from './charts/StressChart';
import { TriangleRadar } from './charts/TriangleRadar';

interface SliderDef {
  key: keyof WorkloadProfile;
  label: string;
  min: number;
  max: number;
  step: number;
  unit: string;
  hint: string;
  pct?: boolean;
}

const SLIDERS: SliderDef[] = [
  { key: 'mau', label: '活跃用户数 (MAU)', min: 20, max: 5000, step: 10, unit: '人', hint: '月活跃用户' },
  { key: 'pricePerMonth', label: '定价', min: 0, max: 99, step: 1, unit: '$/月', hint: '每用户每月订阅价' },
  { key: 'tasksPerUserPerDay', label: '每人每日任务数', min: 1, max: 40, step: 1, unit: '个', hint: '使用强度' },
  { key: 'avgTaskMinutes', label: '平均任务时长', min: 0.5, max: 60, step: 0.5, unit: '分钟', hint: 'agent 真正忙碌的时长' },
  { key: 'idleRatio', label: '闲置比', min: 0, max: 0.9, step: 0.05, unit: '', pct: true, hint: '会话开着但没在 tool-call 的时间占比' },
  { key: 'burstMultiplier', label: '并发峰值倍数', min: 1, max: 8, step: 0.5, unit: '×', hint: '峰值并发 / 平均并发' },
  { key: 'whaleRatio', label: '鲸鱼用户比例', min: 0, max: 0.5, step: 0.02, unit: '', pct: true, hint: '「来了不回」的重度用户占比' },
  { key: 'whaleAmplify', label: '鲸鱼用量放大', min: 1, max: 15, step: 1, unit: '×', hint: '重度用户相对普通用户的用量倍数' },
];

const AXES: StressAxis[] = ['idleRatio', 'whaleAmplify', 'mau'];

export function Sandbox() {
  const [profile, setProfile] = useState<WorkloadProfile>({ ...DEFAULT_PROFILE });
  const [activeScenario, setActiveScenario] = useState<string | null>(null);
  const [axis, setAxis] = useState<StressAxis>('idleRatio');

  const { usage, results, sweetSpotId } = useMemo(() => evaluate(profile), [profile]);
  const scan = useMemo(() => stressScan(profile, axis), [profile, axis]);
  const advice = useMemo(
    () => advise(profile, results, usage, sweetSpotId),
    [profile, results, usage, sweetSpotId],
  );

  const setKey = (k: keyof WorkloadProfile, v: number) => {
    setActiveScenario(null);
    setProfile((p) => ({ ...p, [k]: v }));
  };

  const applyScenario = (id: string) => {
    const s = SCENARIOS.find((x) => x.id === id);
    if (!s) return;
    setProfile({ ...s.profile });
    setActiveScenario(id);
  };

  return (
    <div className="sandbox">
      <section className="scenarios">
        <span className="scenarios-label">一键场景剧本：</span>
        {SCENARIOS.map((s) => (
          <button
            key={s.id}
            className={`scenario-chip ${activeScenario === s.id ? 'active' : ''}`}
            onClick={() => applyScenario(s.id)}
            title={s.blurb}
          >
            {s.name}
          </button>
        ))}
        <button
          className={`scenario-chip ${activeScenario === null ? 'active' : ''}`}
          onClick={() => {
            setProfile({ ...DEFAULT_PROFILE });
            setActiveScenario(null);
          }}
        >
          默认画像
        </button>
      </section>
      {activeScenario && (
        <p className="scenario-blurb">{SCENARIOS.find((s) => s.id === activeScenario)?.blurb}</p>
      )}

      <div className="sandbox-grid">
        <aside className="controls">
          <h3>用户行为画像</h3>
          {SLIDERS.map((s) => {
            const raw = profile[s.key];
            const display = s.pct ? `${Math.round(raw * 100)}%` : `${raw}${s.unit}`;
            return (
              <label key={s.key} className="slider">
                <div className="slider-top">
                  <span>{s.label}</span>
                  <b>{display}</b>
                </div>
                <input
                  type="range"
                  min={s.min}
                  max={s.max}
                  step={s.step}
                  value={raw}
                  onChange={(e) => setKey(s.key, Number(e.target.value))}
                />
                <span className="slider-hint">{s.hint}</span>
              </label>
            );
          })}
          <div className="usage-facts">
            <div>
              月总忙碌时长 <b>{fmtInt(usage.totalBusyHours)} h</b>
            </div>
            <div>
              峰值并发会话 <b>{usage.peakConcurrentSessions.toFixed(1)}</b>
            </div>
            <div>
              月营收 <b>{fmtMoney(profile.mau * profile.pricePerMonth)}</b>
            </div>
          </div>
        </aside>

        <main className="outputs">
          <div className="cards">
            {results.map((r) => {
              const cross = scan.crossing[r.arch.id];
              return (
                <article
                  key={r.arch.id}
                  className={`arch-card ${r.isSweetSpot ? 'sweet' : ''} ${
                    r.marginPct < 0 ? 'loss' : ''
                  }`}
                >
                  <header>
                    <h4>{r.arch.name}</h4>
                    {r.isSweetSpot && <span className="badge sweet-badge">甜点</span>}
                    {r.arch.capabilityGap && <span className="badge gap-badge">能力缺口</span>}
                  </header>
                  <p className="arch-tagline">{r.arch.tagline}</p>
                  <div className="metric-row">
                    <div className="metric">
                      <span>毛利率</span>
                      <b className={r.marginPct < 0 ? 'neg' : 'pos'}>{fmtPct(r.marginPct)}</b>
                    </div>
                    <div className="metric">
                      <span>月基础设施成本</span>
                      <b>{fmtMoney(r.infraCost)}</b>
                    </div>
                  </div>
                  <div className="metric-row small">
                    <div className="metric">
                      <span>冷启动</span>
                      <b>{(r.arch.coldStartMs / 1000).toFixed(1)}s</b>
                    </div>
                    <div className="metric">
                      <span>成本承担方</span>
                      <b className="tiny">{r.arch.costBearer}</b>
                    </div>
                  </div>
                  <div className="cliff-line">
                    {cross != null ? (
                      <>
                        毛利转负 @ {AXIS_META[axis].label} <b>{AXIS_META[axis].fmt(cross)}</b>
                      </>
                    ) : (
                      <>当前{AXIS_META[axis].label}范围内不转负</>
                    )}
                  </div>
                </article>
              );
            })}
          </div>

          <div className="chart-pair">
            <div className="chart-box">
              <div className="chart-head">
                <h4>毛利率 × {AXIS_META[axis].label}（转负点在哪）</h4>
                <div className="axis-switch">
                  {AXES.map((a) => (
                    <button
                      key={a}
                      className={axis === a ? 'active' : ''}
                      onClick={() => setAxis(a)}
                    >
                      {AXIS_META[a].label}
                    </button>
                  ))}
                </div>
              </div>
              <StressChart profile={profile} axis={axis} />
            </div>
            <div className="chart-box">
              <h4>不可能三角</h4>
              <TriangleRadar highlightId={sweetSpotId} />
            </div>
          </div>

          <div className="advisor">
            <h4>
              顾问解读 <span className="mock-tag">脚本化模拟 · 非真实 LLM 调用</span>
            </h4>
            <ul>
              {advice.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          </div>
        </main>
      </div>
    </div>
  );
}
