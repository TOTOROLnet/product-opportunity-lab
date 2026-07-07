import type { DiagnosisResult } from '../types';

function fmt(n: number): string {
  return n.toLocaleString('en-US');
}

export function DiagnosisPanel({ result }: { result: DiagnosisResult }) {
  const { detections } = result;
  return (
    <div className="card">
      <h3>Concord 诊断</h3>
      {detections.length === 0 ? (
        <div className="diag-empty">
          目前切片内 <b>未检测到协作反模式</b>。
          <br />
          继续播放时间轴，若出现活锁 / 重试风暴 / 无主任务 / 写入冲突 / 空转，这里会实时列出病灶、因果链、浪费成本与修复处方。
        </div>
      ) : (
        <div className="diag">
          {detections.map((d, i) => (
            <div key={i} className={`detection ${d.severity}`}>
              <div className="det-head">
                <span className="det-title">{d.title}</span>
                <span className={`pill ${d.severity === 'critical' ? 'crit' : 'warn'}`}>
                  {d.severity === 'critical' ? '致命' : '警告'}
                </span>
              </div>
              <div className="det-cost">
                <span>
                  浪费 token <b>{fmt(d.wastedTokens)}</b>
                </span>
                <span>
                  影响时长 <b>{(d.wastedMs / 1000).toFixed(1)}s</b>
                </span>
                <span>涉及 {d.agents.length} agent</span>
              </div>
              <div className="det-cause">
                <b style={{ color: 'var(--text)' }}>病因：</b>
                {d.cause}
              </div>
              <div className="det-fix">
                <b>修复处方 →</b> {d.fix}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
