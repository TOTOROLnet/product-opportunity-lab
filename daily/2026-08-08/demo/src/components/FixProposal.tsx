import { useMemo, useState } from 'react';
import type { Scenario } from '../types';
import { fixableIds, scan } from '../logic/scan';
import { healthTone, KIND_LABEL, STATUS_LABEL } from './shared';

function buildReport(scenario: Scenario): string {
  const base = scan(scenario, new Set());
  const lines: string[] = [];
  lines.push(`对表 Duìbiǎo · 契约体检报告`);
  lines.push(`repo: ${scenario.repo.name}`);
  lines.push(`健康分: ${base.health}/100  ·  ${base.problemCount} 条声明需对表`);
  lines.push(
    `分布: 冲突 ${base.counts.conflict} · 漂移 ${base.counts.stale} · 无法验证 ${base.counts.unverifiable} · 对齐 ${base.counts.aligned}`,
  );
  lines.push('');
  lines.push('待对表声明:');
  for (const c of base.claims) {
    if (c.effectiveStatus === 'aligned') continue;
    lines.push(
      `  [${STATUS_LABEL[c.effectiveStatus]}] ${c.sourceFile} · ${KIND_LABEL[c.kind]} :: ${c.quote}`,
    );
    lines.push(`      → ${c.reality}`);
    if (c.fix) lines.push(`      对表: ${c.fix.to}`);
  }
  return lines.join('\n');
}

export function FixProposal({ scenario }: { scenario: Scenario }) {
  const [copied, setCopied] = useState(false);

  const { before, after, report } = useMemo(() => {
    const all = new Set(fixableIds(scenario));
    return {
      before: scan(scenario, new Set()),
      after: scan(scenario, all),
      report: buildReport(scenario),
    };
  }, []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(report);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <>
      <div className="panel">
        <h2>③ 对表修复 · 收敛到单一真源</h2>
        <p className="sub">
          以 CI(ci.yml) + README 为真值基准，把 AGENTS.md / CLAUDE.md / .cursor/rules 全部对齐。
        </p>
        <div className="delta">
          <div className={`delta-box before-${healthTone(before.health)}`}>
            <div className="delta-k">修复前</div>
            <div className="delta-v">{before.health}</div>
            <div className="delta-s">{before.problemCount} 条需对表</div>
          </div>
          <div className="delta-arrow">→</div>
          <div className={`delta-box after-${healthTone(after.health)}`}>
            <div className="delta-k">全部对表后</div>
            <div className="delta-v">{after.health}</div>
            <div className="delta-s">{after.problemCount} 条残留（secret 值无法静态验证）</div>
          </div>
        </div>
      </div>

      <div className="panel">
        <h2>修复 diff（提议写回）</h2>
        <div className="diff">
          {scenario.fixDiff.map((d, i) => (
            <div key={i} className="diff-file">
              <div className="diff-fname">{d.file}</div>
              {d.minus && <div className="dl minus">- {d.minus}</div>}
              {d.plus && <div className="dl plus">+ {d.plus}</div>}
            </div>
          ))}
        </div>
      </div>

      <div className="panel">
        <h2>修复前 / 后：agent 的一次典型执行</h2>
        <div className="ba">
          <div className="col naive">
            <div className="colhead">
              不对表 · agent 照散落指令跑
              <small>指令互相矛盾 + 命令过期</small>
            </div>
            <ul>
              {scenario.runBefore.map((s, i) => (
                <li key={i}>
                  <span className="lt">{s.ok ? '✓' : '✗'} {s.label}</span>
                  {s.detail}
                </li>
              ))}
            </ul>
          </div>
          <div className="col gated">
            <div className="colhead">
              对表后 · agent 照单一真源跑
              <small>一致 + 与 CI 对齐</small>
            </div>
            <ul>
              {scenario.runAfter.map((s, i) => (
                <li key={i}>
                  <span className="lt">{s.ok ? '✓' : '✗'} {s.label}</span>
                  {s.detail}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="report-head">
          <h2>可复制的契约体检报告</h2>
          <button className="btn" onClick={copy}>
            {copied ? '已复制 ✓' : '复制报告'}
          </button>
        </div>
        <pre className="report">{report}</pre>
      </div>
    </>
  );
}
