import type { AgentRun, EvidenceType } from '../types';
import {
  claimGaps,
  countByVerdict,
  evidenceScore,
  orphanEvidence,
  SELF_REPORTED_SCORE,
  VERDICT_WEIGHT,
} from '../logic/scoring';

interface Props {
  run: AgentRun;
}

const TYPE_LABEL: Record<EvidenceType, string> = {
  diff: '代码 diff',
  test: '测试输出',
  command: '命令 / 退出码',
  log: '运行日志',
  screenshot: '截图',
};

export function EvidenceBoard({ run }: Props) {
  const score = evidenceScore(run.claims);
  const counts = countByVerdict(run.claims);
  const gaps = claimGaps(run);
  const orphans = orphanEvidence(run);
  const orphanSet = new Set(orphans);

  const referencedBy = (evId: string) =>
    run.claims.filter((c) => c.evidenceIds.includes(evId));

  return (
    <div className="board">
      <div className="board-col">
        <h2 className="board-title">本次运行的证据（{run.evidence.length}）</h2>
        <p className="board-sub">
          这些是运行里<b>已存在</b>的 artifact。信任分不是凭空给的——它来自“每条声明能连到哪些证据”。
        </p>
        <ul className="board-ev-list">
          {run.evidence.map((e) => {
            const refs = referencedBy(e.id);
            const orphan = orphanSet.has(e.id);
            return (
              <li key={e.id} className={'board-ev ' + (orphan ? 'orphan' : '')}>
                <div className="board-ev-head">
                  <span className={'ev-type ' + e.type}>{TYPE_LABEL[e.type]}</span>
                  <span className="ev-title">{e.title}</span>
                  {e.meta && <span className="ev-meta">{e.meta}</span>}
                </div>
                <div className="board-ev-refs">
                  {orphan ? (
                    <span className="orphan-tag">孤儿证据 · 没有任何声明引用它</span>
                  ) : (
                    <span className="ref-tag">被 {refs.length} 条声明引用</span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="board-col">
        <h2 className="board-title">声明缺口</h2>
        <p className="board-sub">有 claim、却连不到任何证据的声明——高危区。</p>
        {gaps.length === 0 ? (
          <div className="board-empty">没有缺口：每条声明都至少连到一条证据。</div>
        ) : (
          <ul className="gap-list">
            {gaps.map((c) => (
              <li key={c.id} className={'gap-item ' + c.verdict}>
                <span className={'v-dot ' + c.verdict} />
                <span>{c.text}</span>
              </li>
            ))}
          </ul>
        )}

        <h2 className="board-title mt">孤儿证据</h2>
        <p className="board-sub">证据存在、却没有任何声明认领它（可能 agent 漏说了，或证据无关）。</p>
        {orphans.length === 0 ? (
          <div className="board-empty">没有孤儿证据。</div>
        ) : (
          <ul className="gap-list">
            {orphans.map((id) => {
              const e = run.evidence.find((x) => x.id === id)!;
              return (
                <li key={id} className="gap-item orphan">
                  <span className="v-dot orphan" />
                  <span>{e.title}</span>
                </li>
              );
            })}
          </ul>
        )}

        <div className="formula">
          <h3>信任分怎么算（透明规则）</h3>
          <p>
            自述信任分固定 = <b>{SELF_REPORTED_SCORE}%</b>（agent 把每条都当作已完成陈述）。
          </p>
          <p>证据信任分 = 各声明判定权重的平均值（clamp 到 0–100%）：</p>
          <ul className="weight-list">
            <li>
              <span className="chip verified">有证据</span> 权重 {VERDICT_WEIGHT.verified} ×{' '}
              {counts.verified}
            </li>
            <li>
              <span className="chip weak">薄弱</span> 权重 {VERDICT_WEIGHT.weak} × {counts.weak}
            </li>
            <li>
              <span className="chip unsupported">无证据</span> 权重 {VERDICT_WEIGHT.unsupported} ×{' '}
              {counts.unsupported}
            </li>
            <li>
              <span className="chip contradicted">被反证</span> 权重 {VERDICT_WEIGHT.contradicted}{' '}
              × {counts.contradicted}
            </li>
          </ul>
          <p className="formula-result">
            = <b className={score >= 70 ? 'ok' : score >= 40 ? 'warn' : 'bad'}>{score}%</b>
            <span className="formula-gap"> （比自述低 {SELF_REPORTED_SCORE - score}%）</span>
          </p>
        </div>
      </div>
    </div>
  );
}
