import { useState } from 'react';
import type { IntentResult } from '../logic/engine';
import { TOPK } from '../logic/engine';
import { VerdictBadge, EnvTag, ScoreBar } from './shared';

function CrashPreview({ r }: { r: IntentResult }) {
  if (r.verdict !== 'dangerous' || !r.picked) return null;
  return (
    <div className="crash">
      <div className="card bad">
        <h4>❌ 朴素 lazy-discovery：Agent 会调</h4>
        <div className="tool">{r.picked.server} / {r.picked.name}</div>
        <p>{r.picked.effect ?? '错误工具，有真实副作用。'}</p>
      </div>
      <div className="card good">
        <h4>✅ 本该调的是</h4>
        <div className="tool">{r.correct.server} / {r.correct.name}</div>
        <p>{r.correct.effect ?? '与意图匹配的正确工具。'}</p>
      </div>
    </div>
  );
}

function Candidates({ r }: { r: IntentResult }) {
  const max = r.candidates.length ? r.candidates[0].score : 1;
  return (
    <div>
      <p className="section-title" style={{ marginTop: 18 }}>
        检索器召回（前 {TOPK}，模拟 lazy discovery 只把这几个送到 Agent 面前）
      </p>
      {r.topK.map((c) => {
        const isPicked = r.picked?.id === c.tool.id;
        const isCorrect = r.correct.id === c.tool.id;
        return (
          <div key={c.tool.id} className={`cand${isPicked ? ' picked' : ''}${isCorrect ? ' correct' : ''}`}>
            <span className="toolid">{c.tool.server} / {c.tool.name}</span>
            <span className="meta">
              {isPicked && <span className="tag pick">Agent 选中</span>}
              {isCorrect && <span className="tag right">正确</span>}
              {c.tool.harmful && <span className="tag harm">高危</span>}
              <EnvTag env={c.tool.env} />
              <ScoreBar score={c.score} max={max} />
            </span>
            <span className="desc">{c.tool.description}</span>
          </div>
        );
      })}
      {!r.correctInTopK && (
        <p className="buried">
          🕳️ 正确工具 <b>{r.correct.server} / {r.correct.name}</b>
          {r.correctRank ? ` 只排到第 ${r.correctRank} 位，被挤出检索窗口。` : ' 完全没被召回。'}
        </p>
      )}
    </div>
  );
}

export default function Bench({ results }: { results: IntentResult[] }) {
  const [selId, setSelId] = useState(results[0]?.intent.id ?? '');
  const sel = results.find((r) => r.intent.id === selId) ?? results[0];

  return (
    <div className="bench">
      <div className="intent-list">
        {results.map((r) => (
          <button
            key={r.intent.id}
            className={`intent-item${r.intent.id === selId ? ' sel' : ''}`}
            onClick={() => setSelId(r.intent.id)}
          >
            <div className="fam">{r.intent.family}</div>
            <div className="txt">{r.intent.text}</div>
            <div className="badge-row"><VerdictBadge v={r.verdict} /></div>
          </button>
        ))}
      </div>

      <div className="panel">
        <div className="detail-head">
          <span className="qtext">「{sel.intent.text}」</span>
          <VerdictBadge v={sel.verdict} />
        </div>
        <p className="detail-note">意图本意：{sel.intent.note}</p>
        <div className="reason">{sel.reason}</div>
        <CrashPreview r={sel} />
        <Candidates r={sel} />
      </div>
    </div>
  );
}
