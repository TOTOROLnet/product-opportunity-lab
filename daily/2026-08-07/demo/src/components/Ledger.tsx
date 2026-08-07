import { useState } from 'react';
import type { ReconcileResult, Scenario } from '../types';
import { StatusPill, SeverityTag, VerdictTag } from './shared';

const KIND_LABEL: Record<string, string> = {
  'repo-head': 'REPO HEAD',
  'pr-state': 'PULL REQUEST',
  'config-flag': 'CONFIG FLAG',
  'ci-status': 'CI 状态',
  'db-migration': 'DB MIGRATION',
  dependency: '依赖版本',
  'ticket-status': '目标工单',
};

export function Ledger({
  scenario,
  result,
  onToggle,
  onResetAll,
  onAlignAll,
}: {
  scenario: Scenario;
  result: ReconcileResult;
  onToggle: (id: string) => void;
  onResetAll: () => void;
  onAlignAll: () => void;
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState<string | null>(result.items.find((i) => i.status !== 'aligned')?.assumption.id ?? null);

  const q = query.trim().toLowerCase();
  const visible = result.items.filter((r) => {
    if (!q) return true;
    return (
      r.assumption.title.toLowerCase().includes(q) ||
      (KIND_LABEL[r.assumption.kind] ?? '').toLowerCase().includes(q) ||
      r.assumption.remembered.label.toLowerCase().includes(q) ||
      r.assumption.current.label.toLowerCase().includes(q)
    );
  });

  return (
    <>
      <div className={`verdict ${result.recommendResume ? 'good' : 'bad'}`}>
        <span className="vi">{result.recommendResume ? '✅' : '⛔'}</span>
        <div>{result.verdictHeadline}</div>
      </div>

      <div className="panel">
        <h2>假设账本 · Agent 记得的世界(T0) vs 现在(T1)</h2>
        <p className="sub">
          从事件日志抽出复跑会依赖的每条世界假设，对活世界探测后判级。
          点任一条看证据；勾选「假装这条其实没变」可让下方引擎<b>实时重算</b>裁决——证明这是逻辑，不是写死的文案。
        </p>

        <div className="toolbar">
          <input
            type="search"
            placeholder="搜索假设 / 类型 / 值（如 PR、migration、billing）…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button className="btn" onClick={onAlignAll}>
            全部假装未变
          </button>
          <button className="btn" onClick={onResetAll}>
            恢复真实世界
          </button>
        </div>

        {visible.map((r) => {
          const a = r.assumption;
          const isOpen = open === a.id;
          return (
            <div key={a.id} className={`assumption ${r.status === 'aligned' ? 'is-aligned' : ''}`}>
              <div className="arow" onClick={() => setOpen(isOpen ? null : a.id)}>
                <div>
                  <div className="atitle">{a.title}</div>
                  <div className="akind">{KIND_LABEL[a.kind] ?? a.kind}</div>
                </div>
                <div className="tval t0">
                  <span className="lab">T0 记得</span>
                  {a.remembered.label}
                </div>
                <div className={`tval t1 ${r.status !== 'aligned' ? 'changed' : ''}`}>
                  <span className="lab">T1 现在{r.overriddenAligned ? '（已假装未变）' : ''}</span>
                  {r.effectiveLabel}
                </div>
                <div className="verdict-col">
                  <StatusPill status={r.status} />
                  {r.status !== 'aligned' && <SeverityTag severity={r.severity} />}
                  <VerdictTag verdict={r.verdict} />
                  <span className="chev">{isOpen ? '▲' : '▼'}</span>
                </div>
              </div>

              {isOpen && (
                <div className="adetail">
                  <div className="dgrid">
                    <div>
                      <div className="dk">假设从何而来（事件日志）</div>
                      <div>{a.logExcerpt}</div>
                      <div className="dk" style={{ marginTop: 10 }}>
                        复跑前如何探测活世界
                      </div>
                      <code>{a.probe}</code>
                      <div className="dk" style={{ marginTop: 10 }}>
                        依赖它的后续步骤
                      </div>
                      <div>step {a.dependentSteps.join(', ')}</div>
                    </div>
                    <div>
                      <div className="dk">朴素回放的后果</div>
                      <div className="consequence">
                        {r.status === 'aligned' ? '（本条一致，无事故）' : a.blindConsequence}
                      </div>
                      <div className="dk" style={{ marginTop: 10 }}>
                        归位安检后的动作
                      </div>
                      <div className="gated">{a.gatedAction}</div>
                    </div>
                  </div>

                  <label className="cf-toggle">
                    <input
                      type="checkbox"
                      checked={r.overriddenAligned}
                      onChange={() => onToggle(a.id)}
                    />
                    反事实：假装「{a.title}」其实没变，重算裁决
                  </label>
                </div>
              )}
            </div>
          );
        })}
        {visible.length === 0 && (
          <div className="ba empty">没有匹配「{query}」的世界假设。</div>
        )}
      </div>

      <StepStrip scenario={scenario} result={result} />
    </>
  );
}

function StepStrip({ scenario, result }: { scenario: Scenario; result: ReconcileResult }) {
  const doneSteps = Array.from({ length: scenario.pausedAtStep }, (_, i) => i + 1);
  return (
    <div className="panel">
      <h2>复跑计划（第 {scenario.pausedAtStep + 1}–{scenario.runbookTotal} 步的裁决）</h2>
      <p className="sub">
        已完成 {scenario.pausedAtStep} 步（灰）。归位据世界假设给每个待续步骤裁决——
        {result.metrics.autoSteps} 步可自动续，{result.metrics.attentionSteps} 步需关注。
      </p>
      <div className="steps">
        {doneSteps.map((s) => (
          <div key={s} className="stepbox done" title={`step ${s} 已完成`}>
            {s}
          </div>
        ))}
        {result.stepPlans.map((sp) => (
          <div
            key={sp.step}
            className={`stepbox v-${sp.worstVerdict}`}
            title={`step ${sp.step} · ${sp.reasons.join(' / ')}`}
          >
            {sp.step}
          </div>
        ))}
      </div>
      <div className="legend">
        <span className="lg-done">已完成</span>
        <span className="lg-auto">自动续</span>
        <span className="lg-skip">跳过</span>
        <span className="lg-confirm">人工确认</span>
        <span className="lg-replan">重规划</span>
        <span className="lg-abort">中止</span>
      </div>
    </div>
  );
}
