import { useMemo, useState } from 'react';
import { DRIFTS, GROUND_TRUTH } from '../data/pipeline';
import { evaluate } from '../logic/engine';
import { CompareBar, Metric, Pill } from './ui';

export default function SentinelView({
  selected,
  toggle,
}: {
  selected: string[];
  toggle: (id: string) => void;
}) {
  const [guard, setGuard] = useState(false);
  const [migrated, setMigrated] = useState<Set<string>>(new Set());

  const v = useMemo(() => evaluate(selected), [selected]);
  const anyBreaking = v.breakingSelected.length > 0;
  const migratedAll = anyBreaking && v.breakingSelected.every((d) => migrated.has(d.id));
  const m = v.metrics;

  function onToggleDrift(id: string) {
    toggle(id);
    setMigrated(new Set()); // 改动集合变化 → 迁移状态重置
  }
  function applyMigration(id: string) {
    setMigrated((prev) => new Set(prev).add(id));
  }
  function applyAll() {
    setMigrated(new Set(v.breakingSelected.map((d) => d.id)));
  }

  return (
    <div className="view">
      <div className="panel">
        <div className="panel-head">
          <h2>漂移哨兵</h2>
          <span className="panel-sub">
            让研究员发起一次改动 → 切换榫卯 OFF/ON，看下游 agent 的结局如何改变
          </span>
        </div>

        <div className="sentinel-grid">
          {/* 左：改动选择器 */}
          <div>
            <div className="cmp-label" style={{ marginBottom: 10 }}>
              研究员对 <code>findings.json</code> 的改动（可多选）
            </div>
            <div className="drift-list">
              {DRIFTS.map((d) => {
                const on = selected.includes(d.id);
                return (
                  <button
                    key={d.id}
                    className={`drift ${on ? 'on' : ''}`}
                    onClick={() => onToggleDrift(d.id)}
                  >
                    <span className="drift-check">{on ? '✓' : ''}</span>
                    <span className="drift-body">
                      <span className="drift-label">
                        {d.label}
                        {d.breaking ? (
                          <Pill tone="bad">破坏契约</Pill>
                        ) : (
                          <Pill tone="good">安全演进</Pill>
                        )}
                      </span>
                      <span className="drift-detail">{d.detail}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 右：世界切换 + 结局 */}
          <div>
            <div className="guard-bar">
              <div className="guard-toggle">
                <button
                  className={`guard-opt ${!guard ? 'sel-off' : ''}`}
                  onClick={() => setGuard(false)}
                >
                  榫卯 OFF
                </button>
                <button
                  className={`guard-opt ${guard ? 'sel-on' : ''}`}
                  onClick={() => setGuard(true)}
                >
                  榫卯 ON
                </button>
              </div>
              <span className="guard-cap">
                基准：<code>findings.score = {GROUND_TRUTH.score}</code>（0–100）·{' '}
                <code>sampleSize = {GROUND_TRUTH.sampleSize}</code> · 真实结论应为「建议推进」
              </span>
            </div>

            {!guard ? <OffWorld v={v} /> : <OnWorld v={v} migrated={migrated} migratedAll={migratedAll} onApply={applyMigration} onApplyAll={applyAll} />}
          </div>
        </div>
      </div>

      {/* 两个世界最终报告对比（始终可见） */}
      <div className="panel">
        <div className="panel-head">
          <h2>同一次改动，两个世界的最终报告</h2>
          <span className="panel-sub">报告员写出的结论 report.md</span>
        </div>
        <div className="two-worlds">
          <div className="world off">
            <span className="world-tag tag-off">🔴 榫卯 OFF（今天的默认）</span>
            <div className={`report-line ${v.off.correct ? '' : 'wrong'}`}>{v.off.reporter.line}</div>
            {!v.off.correct && (
              <div className="fs-val" style={{ marginTop: 6, fontSize: 12.5 }}>
                与真实结论不符——但<b>没有任何 agent 报错</b>。
              </div>
            )}
          </div>
          <div className="world on">
            <span className="world-tag tag-on">🟢 榫卯 ON（迁移后）</span>
            <div className="report-line">{v.on.reporter.line}</div>
            <div className="fs-val" style={{ marginTop: 6, fontSize: 12.5 }}>
              与研究员的真实意图一致 ✓
            </div>
          </div>
        </div>
      </div>

      {/* 价值条 */}
      <div className="panel">
        <div className="panel-head">
          <h2>价值可视化 · 榫卯 OFF vs ON</h2>
          <span className="panel-sub">数字全部由确定性引擎实时算出</span>
        </div>
        <div className="metrics-row" style={{ marginBottom: 18 }}>
          <Metric
            label="静默腐坏的下游工件"
            value={String(m.silentCorruptionsOff)}
            sub={anyBreaking ? '错误在无人察觉中传播' : '无破坏性改动'}
            tone={m.silentCorruptionsOff > 0 ? 'bad' : undefined}
          />
          <Metric
            label="检测延迟（步）"
            value={String(m.detectionLatencyOff)}
            sub={anyBreaking ? '直到报告页才暴露' : '—'}
            tone={m.detectionLatencyOff > 0 ? 'bad' : undefined}
          />
          <Metric
            label="ON 保护的下游工件"
            value={String(m.protectedDownstreamOn)}
            sub={anyBreaking ? '写入时即拦截' : '无需拦截'}
            tone={m.protectedDownstreamOn > 0 ? 'good' : undefined}
          />
          <Metric
            label="ON 给出的最小迁移"
            value={String(m.migrationsOffered)}
            sub="改名映射 / 单位适配 / …"
            tone={m.migrationsOffered > 0 ? 'good' : undefined}
          />
        </div>
        <div className="cmp-grid">
          <CompareBar
            label="静默腐坏的下游工件数"
            off={m.silentCorruptionsOff}
            on={m.silentCorruptionsOn}
            max={2}
            fmt={(n) => `${n}`}
            betterWhenLower
          />
          <CompareBar
            label="检测延迟（从改动到暴露隔了几步）"
            off={m.detectionLatencyOff}
            on={m.detectionLatencyOn}
            max={2}
            fmt={(n) => `${n} 步`}
            betterWhenLower
          />
          <CompareBar
            label="被污染的下游 agent 数"
            off={m.blastAgentsOff}
            on={0}
            max={2}
            fmt={(n) => `${n}`}
            betterWhenLower
          />
          <CompareBar
            label="排障回溯步数（逐工件反查根因）"
            off={m.debugStepsOff}
            on={m.debugStepsOn}
            max={3}
            fmt={(n) => `${n} 步`}
            betterWhenLower
          />
        </div>
      </div>
    </div>
  );
}

function OffWorld({ v }: { v: ReturnType<typeof evaluate> }) {
  const anyBreaking = v.breakingSelected.length > 0;
  const a = v.off.analyst;
  return (
    <div className="world off">
      <span className="world-tag tag-off">🔴 榫卯 OFF：改动被静默接受</span>
      {!anyBreaking ? (
        <div className="fs-val">
          没有破坏性漂移，下游照常正确运行。（试试勾选左侧带「破坏契约」标记的改动。）
        </div>
      ) : (
        <div className="flow">
          <div className="flow-step">
            <div className="fs-file">① findings.json 被写入（已漂移）</div>
            <div className="fs-val">
              {v.breakingSelected.map((d) => (
                <div key={d.id}>· {d.detail}</div>
              ))}
            </div>
          </div>
          <div className="flow-step">
            <div className="fs-file">② 分析师照旧读入（用旧契约假设）</div>
            <div className="fs-val">
              读到 <b>score={a.scoreRawLabel}</b>（仍当 0–100 用）、样本
              <b>{a.reliableSample ? '充分' : '不足'}</b>、情绪<b>{a.moodSeen}</b> → 综合置信{' '}
              <b className="wrong">{a.confidenceIndex}/100</b>
            </div>
          </div>
          <div className="flow-step">
            <div className="fs-file">③ report.md 写出结论</div>
            <div className={`report-line ${v.off.correct ? '' : 'wrong'}`}>
              {v.off.reporter.line}
            </div>
            <div className="fs-val" style={{ marginTop: 4 }}>
              <span className="wrong">
                💥 爆炸半径：{v.metrics.blastAgentsOff} 个下游 agent 被污染，错误传播{' '}
                {v.metrics.detectionLatencyOff} 步后才在报告里暴露；全程<b>零报错</b>。
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function OnWorld({
  v,
  migrated,
  migratedAll,
  onApply,
  onApplyAll,
}: {
  v: ReturnType<typeof evaluate>;
  migrated: Set<string>;
  migratedAll: boolean;
  onApply: (id: string) => void;
  onApplyAll: () => void;
}) {
  const anyBreaking = v.breakingSelected.length > 0;
  return (
    <div className="world on">
      {!anyBreaking ? (
        <>
          <span className="world-tag tag-on">🟢 榫卯 ON：无破坏性漂移</span>
          <div className="fs-val">
            {v.safeSelected.length > 0
              ? '识别为安全演进（向后兼容），静默放行并纳入契约可选字段——榫卯不做「一刀切拦截」。'
              : '没有改动，下游正常运行。'}
          </div>
        </>
      ) : migratedAll ? (
        <>
          <span className="world-tag tag-on">🟢 榫卯 ON：{v.breakingSelected.length} 处迁移已应用</span>
          <div className="flow">
            <div className="flow-step">
              <div className="fs-file">✓ 迁移生效，下游按契约恢复正确</div>
              <div className="fs-val">
                综合置信 <b className="blocked">{v.on.analyst.confidenceIndex}/100</b>、情绪
                <b>{v.on.analyst.moodSeen}</b>
              </div>
              <div className="report-line">{v.on.reporter.line}</div>
            </div>
          </div>
        </>
      ) : (
        <>
          <span className="world-tag tag-on">
            ⏸ 写入时拦截：{v.breakingSelected.length} 处破坏，{v.metrics.protectedDownstreamOn} 个下游暂停
          </span>
          <div className="intercept">
            {v.breakingSelected.map((d) => {
              const done = migrated.has(d.id);
              return (
                <div className="intercept-item" key={d.id}>
                  <div className="ii-head">
                    {d.label}
                    <Pill tone="bad">严重度 {d.severity >= 3 ? '高' : '中'}</Pill>
                    {done && <Pill tone="good">已迁移 ✓</Pill>}
                  </div>
                  <div className="ii-clause">✗ 违反契约：{d.clause}</div>
                  <div className="ii-effect">若放行：{d.downstreamEffect}</div>
                  <div className="ii-mig">
                    🔧 最小迁移：<b>{d.migration}</b>
                    {!done && (
                      <button
                        className="btn btn-sm btn-ghost"
                        style={{ marginLeft: 10 }}
                        onClick={() => onApply(d.id)}
                      >
                        应用迁移
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            {v.safeSelected.map((d) => (
              <div className="intercept-item safe-item" key={d.id}>
                <div className="ii-head">
                  {d.label}
                  <Pill tone="good">安全放行</Pill>
                </div>
                <div className="ii-effect">{d.downstreamEffect}</div>
              </div>
            ))}
          </div>
          {v.breakingSelected.length > 1 && (
            <button className="btn btn-sm" style={{ marginTop: 12 }} onClick={onApplyAll}>
              一键应用全部迁移
            </button>
          )}
        </>
      )}
    </div>
  );
}
