import { useMemo, useState } from 'react';
import type { ScanResult } from '../logic/scan';
import { HealthScore, KIND_LABEL, SeverityTag, Stat, StatusPill, STATUS_LABEL } from './shared';

export function Ledger({
  result,
  appliedFixes,
  onToggleFix,
  onFixAll,
  onResetFixes,
}: {
  result: ScanResult;
  appliedFixes: Set<string>;
  onToggleFix: (id: string) => void;
  onFixAll: () => void;
  onResetFixes: () => void;
}) {
  const [query, setQuery] = useState('');
  const [onlyProblems, setOnlyProblems] = useState(true);
  const [open, setOpen] = useState<string | null>(null);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return result.claims.filter((c) => {
      if (onlyProblems && c.effectiveStatus === 'aligned') return false;
      if (!q) return true;
      return (
        c.title.toLowerCase().includes(q) ||
        c.sourceFile.toLowerCase().includes(q) ||
        c.quote.toLowerCase().includes(q) ||
        KIND_LABEL[c.kind].includes(q)
      );
    });
  }, [result.claims, query, onlyProblems]);

  return (
    <>
      <div className="panel">
        <h2>② 契约账本 · 逐条判决</h2>
        <p className="sub">
          勾选任意一条的「采纳对表修复」，健康分实时重算——看着散落的指令一步步收敛到单一真源。
        </p>
        <HealthScore health={result.health} problemCount={result.problemCount} />
        <div className="stats">
          <Stat value={result.counts.conflict} label="冲突（互相矛盾）" tone={result.counts.conflict ? 'bad' : 'good'} />
          <Stat value={result.counts.stale} label="漂移（与现实不符）" tone={result.counts.stale ? 'warn' : 'good'} />
          <Stat value={result.counts.unverifiable} label="无法验证" tone={result.counts.unverifiable ? 'neutral' : 'good'} />
          <Stat value={result.counts.aligned} label="已对齐真值" tone="good" />
        </div>
      </div>

      <div className="panel">
        <div className="toolbar">
          <input
            type="search"
            placeholder="搜索声明 / 文件 / 命令…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <label className="cf-toggle">
            <input
              type="checkbox"
              checked={onlyProblems}
              onChange={(e) => setOnlyProblems(e.target.checked)}
            />
            只看有问题
          </label>
          <button className="btn" onClick={onFixAll}>
            一键全部对表
          </button>
          <button className="btn" onClick={onResetFixes} disabled={appliedFixes.size === 0}>
            重置
          </button>
        </div>

        {rows.length === 0 && (
          <div className="empty-row">没有匹配的声明（试试关掉「只看有问题」）。</div>
        )}

        {rows.map((c) => {
          const isOpen = open === c.id;
          return (
            <div key={c.id} className={`claim ${c.fixed ? 'is-fixed' : ''}`}>
              <div className="crow" onClick={() => setOpen(isOpen ? null : c.id)}>
                <div className="cmain">
                  <div className="ctitle">
                    {c.title}
                    <span className="ckind">{KIND_LABEL[c.kind]}</span>
                    {c.fixed && <span className="fixed-badge">已对表</span>}
                  </div>
                  <code className="cquote">
                    {c.sourceFile} · {c.quote}
                  </code>
                </div>
                <div className="cverdict">
                  <StatusPill status={c.effectiveStatus} />
                  <SeverityTag severity={c.effectiveSeverity} />
                  <span className="chev">{isOpen ? '▲' : '▼'}</span>
                </div>
              </div>

              {isOpen && (
                <div className="cdetail">
                  <div className="dgrid">
                    <div>
                      <div className="dk">指令文件里的原文</div>
                      <code>{c.quote}</code>
                    </div>
                    <div>
                      <div className="dk">仓库现实 / CI 真值</div>
                      <div className="dv">{c.reality}</div>
                    </div>
                  </div>
                  <div className="dk" style={{ marginTop: 12 }}>判决依据</div>
                  <div className="dv">{c.evidence}</div>
                  {c.conflictsWith && c.conflictsWith.length > 0 && (
                    <div className="conflict-note">
                      ⇄ 与其他文件的声明直接冲突：{c.conflictsWith.join(' · ')}
                    </div>
                  )}
                  <div className="dk" style={{ marginTop: 12 }}>一个 agent 照此执行会怎样</div>
                  <div className="consequence">{c.consequence}</div>

                  {c.fix ? (
                    <label className="fix-toggle">
                      <input
                        type="checkbox"
                        checked={c.fixed}
                        onChange={() => onToggleFix(c.id)}
                      />
                      采纳对表修复 → <code className="fix-to">{c.fix.to}</code>
                      {c.fix.note && <span className="fix-note">（{c.fix.note}）</span>}
                      <span className="fix-result">
                        修复后：{STATUS_LABEL[c.fix.resultStatus]}
                      </span>
                    </label>
                  ) : (
                    <div className="fix-none">✓ 已是真值 / 无需修复</div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
