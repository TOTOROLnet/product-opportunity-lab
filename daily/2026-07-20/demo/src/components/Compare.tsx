import type { Mode, RunResult } from '../types';
import { ACTIVITIES } from '../data/scenario';

interface Props {
  runs: Record<Mode, RunResult>;
}

function ModeCard({ run, title, lead }: { run: RunResult; title: string; lead: string }) {
  const m = run.metrics;
  const cls = run.mode; // 'naive' | 'aptly'
  const pushByAct = new Map<string, RunResult['pushes']>();
  for (const a of ACTIVITIES) pushByAct.set(a.id, run.pushes.filter((p) => p.activityId === a.id));
  return (
    <div className={`card ${cls}`}>
      <h3>
        {title}
        <span className="lead" style={{ color: cls === 'aptly' ? 'var(--accent)' : 'var(--warn)' }}>
          {lead}
        </span>
      </h3>

      <div className="mstrip">
        <div className="metric">
          <div className="v">{m.interruptions}</div>
          <div className="k">总打扰</div>
        </div>
        <div className="metric">
          <div className="v good">{m.useful}</div>
          <div className="k">有用命中</div>
        </div>
        <div className="metric">
          <div className={`v ${m.precision >= 0.8 ? 'good' : m.precision >= 0.5 ? 'warn' : 'bad'}`}>
            {Math.round(m.precision * 100)}%
          </div>
          <div className="k">精确率</div>
        </div>
        <div className="metric">
          <div className={`v ${m.criticalCovered === m.criticalTotal ? 'good' : 'bad'}`}>
            {m.criticalCovered}/{m.criticalTotal}
          </div>
          <div className="k">关键覆盖</div>
        </div>
        <div className="metric">
          <div className={`v ${m.harmful ? 'bad' : 'good'}`}>{m.harmful}</div>
          <div className="k">过时误导</div>
        </div>
        <div className="metric">
          <div className={`v ${m.correctSilence === m.silenceTotal ? 'good' : 'warn'}`}>
            {m.correctSilence}/{m.silenceTotal}
          </div>
          <div className="k">正确沉默</div>
        </div>
      </div>

      <div className="cmptl">
        {ACTIVITIES.map((a) => {
          const ps = pushByAct.get(a.id) ?? [];
          return (
            <div key={a.id} className="cmpline">
              <span className="ct">{a.time}</span>
              <span style={{ flex: 1 }}>{a.label}</span>
              {ps.length === 0 ? (
                <span className="cf">· 安静</span>
              ) : (
                ps.map((p, i) => (
                  <span
                    key={i}
                    className={`cf ${p.useful ? 'hit' : p.stale ? 'miss' : 'noise'}`}
                  >
                    {p.memoryId}
                    {p.stale ? '⚠过时' : p.duplicate ? '·重复' : p.useful ? '✓' : '·噪音'}
                  </span>
                ))
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function Compare({ runs }: Props) {
  const n = runs.naive.metrics;
  const a = runs.aptly.metrics;
  return (
    <div>
      <div className="headline">
        同一条工作流、同一批记忆，两种策略回放的<b>实测结果</b>：
        知时把打扰从 <b className="r">{n.interruptions} 次</b> 降到 <b className="g">{a.interruptions} 次</b>，
        精确率从 <b className="r">{Math.round(n.precision * 100)}%</b> 提到 <b className="g">{Math.round(a.precision * 100)}%</b>，
        关键时刻覆盖从 <b className="r">{n.criticalCovered}/{n.criticalTotal}</b>（漏了"退款 API 参数变更"）提到{' '}
        <b className="g">{a.criticalCovered}/{a.criticalTotal}</b>，过时误导从 <b className="r">{n.harmful} 条</b> 降到{' '}
        <b className="g">{a.harmful} 条</b>。<b className="g">更少打扰 ≠ 少干活，而是更懂何时该闭嘴。</b>
      </div>

      <div className="cmp">
        <ModeCard run={runs.naive} title="朴素推送" lead="相关就推 · 无纪律" />
        <ModeCard run={runs.aptly} title="知时 Aptly" lead="有阈值/去重/防过时/预算" />
      </div>

      <p className="note">
        为什么朴素更多打扰反而更差：① 它<b>重复</b>推同一条（无去重）；② 它把<b>过时</b>的旧 SOP（¥500，已被 ¥1000 取代）也推给你，
        制造错误信息；③ 它按字面标签匹配，<b>漏掉</b>"改退款代码"与"退款 API 参数改名"的关联；④ 它在你只是随手翻博客时也<b>骚扰</b>你。
        知时用<b>克制</b>换来了信任 —— 这正是历代"主动提醒"产品（Google Now 等）没做好、而环境记忆真正缺的判断层。
      </p>
    </div>
  );
}
