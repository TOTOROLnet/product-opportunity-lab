import type { ReconcileResult, Scenario } from '../types';
import { verdictText } from '../logic/reconcile';
import { StatCard } from './shared';

function buildBriefText(scenario: Scenario, result: ReconcileResult): string {
  const lines: string[] = [];
  lines.push(`# 复跑简报 · ${scenario.taskName}`);
  lines.push(`run ${scenario.taskId} · 暂停于 step ${scenario.pausedAtStep}/${scenario.runbookTotal} · 缺口 ${scenario.gapLabel}`);
  lines.push('');
  lines.push(`裁决：${result.verdictHeadline}`);
  lines.push('');
  lines.push(`世界假设：一致 ${result.counts.aligned} · 漂移 ${result.counts.drifted} · 已失效 ${result.counts.invalidated}`);
  lines.push('');
  lines.push('逐条动作：');
  for (const g of result.gated) {
    lines.push(`  [${verdictText(g.verdict)}] ${g.title} → ${g.action}`);
  }
  lines.push('');
  lines.push(`避免高危事故 ${result.metrics.avoidedHighRisk} 起 · 需人工介入 ${result.metrics.needHuman} 项 · 可跳过 ${result.metrics.skipCount} 项 · 自动续 ${result.metrics.autoContinue} 项`);
  lines.push('');
  lines.push('（本简报由「归位」根据 mock 世界快照生成，仅供演示。）');
  return lines.join('\n');
}

export function Brief({ scenario, result }: { scenario: Scenario; result: ReconcileResult }) {
  return (
    <>
      <div className={`verdict ${result.recommendResume ? 'good' : 'bad'}`}>
        <span className="vi">{result.recommendResume ? '✅' : '⛔'}</span>
        <div>{result.verdictHeadline}</div>
      </div>

      <div className="panel">
        <h2>增量价值 · 朴素回放 vs 归位安检后复跑</h2>
        <p className="sub">
          同一份日志、同一个 Agent，差别只在「续跑前有没有校一眼世界」。左边是盲目续跑撞上的事故，右边是归位改写后的安全动作。
        </p>
        <div className="ba">
          <div className="col naive">
            <div className="colhead">
              ① 朴素回放（Muse Code 式盲目续跑）
              <small>信任日志、原地续第 {scenario.pausedAtStep + 1} 步，假设世界没变</small>
            </div>
            {result.incidents.length ? (
              <ul>
                {result.incidents.map((it) => (
                  <li key={it.assumptionId}>
                    <span className="lt">⚠ {it.title}</span>
                    {it.consequence}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="empty">当前世界假设全部一致，朴素回放这次也不会出事。</div>
            )}
          </div>
          <div className="col gated">
            <div className="colhead">
              ② 归位安检后复跑
              <small>逐条校世界、改写计划，只在必要处叫停/找人</small>
            </div>
            <ul>
              {result.gated.map((g) => (
                <li key={g.assumptionId}>
                  <span className="lt">
                    [{verdictText(g.verdict)}] {g.title}
                  </span>
                  {g.action}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="panel">
        <h2>一眼看清归位省下了什么</h2>
        <div className="stats">
          <StatCard tone="bad" value={result.metrics.avoidedHighRisk} label="避免的高危事故" />
          <StatCard tone="warn" value={result.metrics.needHuman} label="需人工介入项" />
          <StatCard tone="neutral" value={result.metrics.skipCount} label="安全跳过项" />
          <StatCard tone="good" value={result.metrics.autoContinue} label="一致·自动续" />
          <StatCard tone="good" value={result.metrics.autoSteps} label="可自动续步骤" />
          <StatCard tone="warn" value={result.metrics.attentionSteps} label="需关注步骤" />
        </div>
      </div>

      <div className="panel" style={{ marginBottom: 0 }}>
        <h2>可交接的复跑简报（文本）</h2>
        <p className="sub">归位把裁决整理成一份人话简报，可贴进值班群 / 复跑审批工单。</p>
        <div className="brief">{buildBriefText(scenario, result)}</div>
      </div>
    </>
  );
}
