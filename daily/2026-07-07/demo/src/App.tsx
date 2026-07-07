import { useEffect, useMemo, useRef, useState } from 'react';
import { SCENARIOS, maxT } from './data/scenarios';
import { diagnose } from './logic/detectors';
import { VerdictHeader } from './components/VerdictHeader';
import { InteractionGraph } from './components/InteractionGraph';
import { Timeline } from './components/Timeline';
import { DiagnosisPanel } from './components/DiagnosisPanel';
import { EventLog } from './components/EventLog';
import { HowItWorks } from './components/HowItWorks';

type Page = 'console' | 'how';
type View = 'concord' | 'raw';

const STEP_MS = 200; // 每帧推进的模拟时间
const FRAME_MS = 90; // 播放帧间隔

export default function App() {
  const [page, setPage] = useState<Page>('console');
  const [view, setView] = useState<View>('concord');
  const [scenarioId, setScenarioId] = useState(SCENARIOS[0].id);
  const [currentTime, setCurrentTime] = useState(0);
  const [playing, setPlaying] = useState(true);
  const timer = useRef<number | null>(null);

  const scenario = useMemo(
    () => SCENARIOS.find((s) => s.id === scenarioId) ?? SCENARIOS[0],
    [scenarioId],
  );
  const maxTime = useMemo(() => maxT(scenario), [scenario]);

  // 切换场景：从头开始播放
  useEffect(() => {
    setCurrentTime(0);
    setPlaying(true);
  }, [scenarioId]);

  // 播放循环
  useEffect(() => {
    if (!playing) return;
    timer.current = window.setInterval(() => {
      setCurrentTime((t) => {
        const next = t + STEP_MS;
        if (next >= maxTime) {
          setPlaying(false);
          return maxTime;
        }
        return next;
      });
    }, FRAME_MS);
    return () => {
      if (timer.current) window.clearInterval(timer.current);
    };
  }, [playing, maxTime]);

  const activeEvents = useMemo(
    () => scenario.events.filter((e) => e.t <= currentTime),
    [scenario, currentTime],
  );

  const result = useMemo(
    () => diagnose(activeEvents, scenario.participants),
    [activeEvents, scenario.participants],
  );

  const verdictPill = (id: string) => {
    // 用完整事件流预判 verdict，给场景卡加个状态角标
    const s = SCENARIOS.find((x) => x.id === id);
    if (!s) return null;
    const full = diagnose(s.events, s.participants);
    const cls =
      full.verdict === 'STUCK' ? 'crit' : full.verdict === 'DEGRADED' ? 'warn' : 'ok';
    return <span className={`pill ${cls}`}>{full.verdict}</span>;
  };

  return (
    <div className="app">
      <div className="topbar">
        <div className="brand">
          <h1>
            Concord<span className="dot">.</span>
          </h1>
          <span className="tag">多 Agent 协作失调诊断器 · Coordination-Failure Detective</span>
        </div>
        <div className="nav">
          <button
            className={page === 'console' ? 'active' : ''}
            onClick={() => setPage('console')}
          >
            诊断台
          </button>
          <button
            className={page === 'how' ? 'active' : ''}
            onClick={() => setPage('how')}
          >
            工作原理
          </button>
        </div>
      </div>

      {page === 'how' ? (
        <HowItWorks />
      ) : (
        <>
          <p className="lead">
            事件驱动 / 自组织多 Agent 团队的故障是<b>关系性、时间性、涌现的</b>：每个 agent 单看都"在正常工作"，
            系统级却已卡死或空烧 token。Concord 吃运行事件流，用确定性检测器<b>自动判病并开处方</b>。
            选一个场景 → 播放时间轴 → 看 Concord 实时诊断。
          </p>

          <VerdictHeader result={result} />

          <div className="viewtoggle">
            <button
              className={view === 'concord' ? 'active' : ''}
              onClick={() => setView('concord')}
            >
              Concord 诊断视图（after）
            </button>
            <button className={view === 'raw' ? 'active' : ''} onClick={() => setView('raw')}>
              原始事件日志（before）
            </button>
          </div>

          <div className="grid">
            <div className="card">
              <h3>选择运行场景</h3>
              {SCENARIOS.map((s) => (
                <button
                  key={s.id}
                  className={`scenario ${s.id === scenarioId ? 'active' : ''}`}
                  onClick={() => setScenarioId(s.id)}
                >
                  <div className="s-name">
                    {s.name} {verdictPill(s.id)}
                  </div>
                  <div className="s-blurb">{s.blurb}</div>
                </button>
              ))}
            </div>

            <div>
              <InteractionGraph
                participants={scenario.participants}
                activeEvents={activeEvents}
                result={result}
              />
              <Timeline
                events={scenario.events}
                currentTime={currentTime}
                maxTime={maxTime}
                playing={playing}
                result={result}
                onTogglePlay={() => {
                  if (currentTime >= maxTime) setCurrentTime(0);
                  setPlaying((p) => !p);
                }}
                onSeek={(t) => {
                  setPlaying(false);
                  setCurrentTime(t);
                }}
                onRestart={() => {
                  setCurrentTime(0);
                  setPlaying(true);
                }}
              />
            </div>

            {view === 'concord' ? (
              <DiagnosisPanel result={result} />
            ) : (
              <EventLog
                events={activeEvents}
                participants={scenario.participants}
                result={result}
              />
            )}
          </div>

          <div className="footer">
            纯前端 mock Demo（Vite + React + TS，<code>base:'./'</code>）。检测逻辑在{' '}
            <code>src/logic/detectors.ts</code> 中真实实现，随时间轴切片增量运行——不是硬编码 verdict。
            不接后端 / 数据库 / 外部 API / 登录。信号来源：product-hunt-radar 2026-07-07。
          </div>
        </>
      )}
    </div>
  );
}
