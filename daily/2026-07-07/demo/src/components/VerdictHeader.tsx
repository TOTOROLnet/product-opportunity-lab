import type { DiagnosisResult } from '../types';

const SUBTITLE: Record<DiagnosisResult['verdict'], string> = {
  HEALTHY: '未检测到协作反模式——分工清晰、有前进、无冲突。',
  DEGRADED: '仍在推进，但存在会烧钱的反模式（警告级），建议干预。',
  STUCK: '检测到致命级反模式——run 实际已卡死/空转，需立即介入。',
};

function fmt(n: number): string {
  return n.toLocaleString('en-US');
}

export function VerdictHeader({ result }: { result: DiagnosisResult }) {
  const { verdict, detections, totalWastedTokens, totalWastedMs } = result;
  return (
    <div className={`verdict ${verdict}`}>
      <div className="badge">{verdict}</div>
      <div className="metrics">
        <div className="metric">
          <div className="m-val">{detections.length}</div>
          <div className="m-lbl">检测到的病灶</div>
        </div>
        <div className="metric">
          <div className="m-val">{fmt(totalWastedTokens)}</div>
          <div className="m-lbl">浪费 token（估）</div>
        </div>
        <div className="metric">
          <div className="m-val">{(totalWastedMs / 1000).toFixed(1)}s</div>
          <div className="m-lbl">受影响时长</div>
        </div>
      </div>
      <div className="sub">{SUBTITLE[verdict]}</div>
    </div>
  );
}
