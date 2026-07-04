import type { Claim, Evidence, EvidenceType } from '../types';
import { VERDICT_LABEL, VERDICT_SHORT } from '../logic/scoring';

interface Props {
  claim: Claim;
  evidenceById: Map<string, Evidence>;
}

const TYPE_LABEL: Record<EvidenceType, string> = {
  diff: '代码 diff',
  test: '测试输出',
  command: '命令 / 退出码',
  log: '运行日志',
  screenshot: '截图',
};

export function EvidencePanel({ claim, evidenceById }: Props) {
  const linked = claim.evidenceIds
    .map((id) => evidenceById.get(id))
    .filter((e): e is Evidence => Boolean(e));

  return (
    <div className="ev-panel">
      <div className="ev-panel-head">
        <span className={'v-badge big ' + claim.verdict}>
          {VERDICT_SHORT[claim.verdict]} · {VERDICT_LABEL[claim.verdict]}
        </span>
        <p className="ev-claim-text">“{claim.text}”</p>
      </div>

      <div className="ev-rationale">
        <span className="ev-section-label">判定依据</span>
        <p>{claim.rationale}</p>
      </div>

      <div className="ev-linked">
        <span className="ev-section-label">
          连线到的证据（{linked.length}）
        </span>
        {linked.length === 0 ? (
          <div className="ev-empty">
            找不到任何支撑这条声明的证据 —— 这正是“幻觉式完成”最常藏身的地方。建议人工复核或要求
            agent 补齐证据。
          </div>
        ) : (
          <ul className="ev-cards">
            {linked.map((e) => (
              <li key={e.id} className={'ev-card ' + e.type}>
                <div className="ev-card-head">
                  <span className={'ev-type ' + e.type}>{TYPE_LABEL[e.type]}</span>
                  <span className="ev-title">{e.title}</span>
                  {e.meta && <span className="ev-meta">{e.meta}</span>}
                </div>
                <pre className="ev-detail">{e.detail}</pre>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
