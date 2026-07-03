import type { Policy, RiskResult, Scenario } from '../types';

interface Props {
  scenario: Scenario;
  policies: Record<string, Policy>;
  firewalls: Record<string, boolean>;
  result: RiskResult;
  baseline: RiskResult;
  onSetPolicy: (toolId: string, policy: Policy) => void;
  onToggleFirewall: (ruleId: string) => void;
  onReset: () => void;
}

const POLICIES: Policy[] = ['always', 'approval', 'blocked'];
const POLICY_SHORT: Record<Policy, string> = {
  always: 'Always',
  approval: 'Approval',
  blocked: 'Blocked',
};

function Stat({
  label,
  value,
  base,
  suffix,
}: {
  label: string;
  value: number;
  base: number;
  suffix?: string;
}) {
  const d = value - base;
  const color = d < 0 ? 'var(--low)' : d > 0 ? 'var(--high)' : 'var(--text-dim)';
  const txt = d === 0 ? '与初始持平' : `${d < 0 ? '↓' : '↑'} ${Math.abs(d)} vs 初始`;
  return (
    <div className="stat">
      <div className="sl">{label}</div>
      <div className="sv" style={{ color: value > base ? 'var(--high)' : undefined }}>
        {value}
        {suffix}
      </div>
      <div className="sd" style={{ color }}>
        {txt}
      </div>
    </div>
  );
}

export default function PolicySimulator({
  scenario,
  policies,
  firewalls,
  result,
  baseline,
  onSetPolicy,
  onToggleFirewall,
  onReset,
}: Props) {
  const tools = scenario.nodes.filter((n) => n.kind === 'tool');
  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0 }}>策略模拟器 · 改一处，看全局风险如何收敛</h3>
        <button className="reset" onClick={onReset}>
          重置为初始策略
        </button>
      </div>

      <div className="sim-summary" style={{ margin: '14px 0 18px' }}>
        <Stat label="总风险" value={result.totalRisk} base={baseline.totalRisk} suffix=" / 100" />
        <Stat label="高危链路" value={result.highCount} base={baseline.highCount} />
        <Stat label="可执行链路" value={result.activePaths.length} base={baseline.activePaths.length} />
      </div>

      <h3>工具权限（Always allow / Needs approval / Blocked）</h3>
      <div className="policy-grid">
        {tools.map((t) => {
          const cur = policies[t.id] ?? 'always';
          return (
            <div className="policy-row" key={t.id}>
              <div className="meta">
                <b>{t.label}</b>
                <div className="m2">
                  {t.capability === 'read' ? '读取' : t.capability === 'write' ? '写入' : '外发'}
                  {t.guardMissing ? ` · ⚠ ${t.guardMissing}` : ''}
                </div>
              </div>
              <div className="seg">
                {POLICIES.map((p) => (
                  <button
                    key={p}
                    data-p={p}
                    className={cur === p ? 'on' : ''}
                    onClick={() => onSetPolicy(t.id, p)}
                  >
                    {POLICY_SHORT[p]}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <h3 style={{ marginTop: 18 }}>数据 / 写入防火墙规则</h3>
      <div className="policy-grid">
        {scenario.firewalls.map((f) => {
          const on = firewalls[f.id] ?? false;
          return (
            <div className="fw-row" key={f.id}>
              <div
                className={`switch ${on ? 'on' : ''}`}
                onClick={() => onToggleFirewall(f.id)}
                role="switch"
                aria-checked={on}
              />
              <div className="meta">
                <b>{f.label}</b>
                <div className="m2">{f.desc}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
