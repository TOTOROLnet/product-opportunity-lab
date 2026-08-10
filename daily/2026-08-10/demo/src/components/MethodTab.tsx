import type { MethodRow, PlanStep } from '../types';

function FitDot({ fit }: { fit: MethodRow['fit'] }) {
  const label = fit === 'best' ? '● 最合适' : fit === 'ok' ? '○ 可用' : '× 不适用';
  return <span className={`fit-dot ${fit}`}>{label}</span>;
}

export default function MethodTab({
  matrix,
  plan,
  method,
}: {
  matrix: MethodRow[];
  plan: PlanStep[];
  method: string;
}) {
  return (
    <div>
      <p className="h-note">
        <b>该用哪种方法？</b> 在 23 种后训练方法的家族里对号——不仅告诉你选谁，更告诉你{' '}
        <b>为什么不是其他几个</b>，并生成一份可执行的训练计划。当前推荐：
        <b style={{ color: 'var(--text)' }}> {method}</b>。
      </p>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="matrix">
          <thead>
            <tr>
              <th>方法</th>
              <th>契合度</th>
              <th>数据需求</th>
              <th>显存画像</th>
              <th>在当前配置下</th>
            </tr>
          </thead>
          <tbody>
            {matrix.map((m) => (
              <tr key={m.id} className={m.fit === 'best' ? 'best' : m.fit === 'no' ? 'no' : ''}>
                <td>
                  <b style={{ color: 'var(--text)' }}>{m.name}</b>
                  <div style={{ color: 'var(--text-faint)', fontSize: 11.5 }}>{m.family}</div>
                </td>
                <td>
                  <FitDot fit={m.fit} />
                </td>
                <td style={{ color: 'var(--text-dim)' }}>{m.dataNeed}</td>
                <td style={{ color: 'var(--text-dim)' }}>{m.vramProfile}</td>
                <td style={{ color: 'var(--text-dim)' }}>{m.fitNote || m.whenToUse}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 style={{ fontSize: 15, margin: '24px 0 12px' }}>生成的训练计划（可执行清单）</h3>
      <ol className="plan">
        {plan.map((s, i) => (
          <li key={i}>
            <span className="check">✓</span>
            <div>
              <div className="step-title">{s.title}</div>
              <div className="step-detail">{s.detail}</div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
