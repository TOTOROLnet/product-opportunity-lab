import { useMemo, useState } from 'react';
import type { Fingerprint, FingerprintKey, IntentCard, Match } from '../types';
import { INTENT_CARDS } from '../data/intents';
import { FLEET_RUNS } from '../data/runs';
import { retrieve } from '../lib/retrieve';
import { savingsForRun } from '../lib/savings';
import { ScoreRing, FP_KEYS, FP_SUGGEST } from './common';

interface Props {
  intentId: string;
  setIntentId: (id: string) => void;
  fingerprint: Fingerprint[];
  setFingerprint: (fp: Fingerprint[]) => void;
  keywords: string[];
  onOpenRecipe: (runId: string) => void;
}

export function RetrievePanel(props: Props) {
  const { intentId, setIntentId, fingerprint, setFingerprint, keywords, onOpenRecipe } = props;
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [newKey, setNewKey] = useState<FingerprintKey>('工具');
  const [newVal, setNewVal] = useState('');

  const card = INTENT_CARDS.find((c) => c.id === intentId) as IntentCard;

  const matches = useMemo<Match[]>(
    () => retrieve(FLEET_RUNS, keywords, fingerprint, { verifiedOnly }),
    [keywords, fingerprint, verifiedOnly],
  );

  function removeFp(idx: number) {
    setFingerprint(fingerprint.filter((_, i) => i !== idx));
  }
  function addFp() {
    const v = newVal.trim();
    if (!v) return;
    if (fingerprint.some((f) => f.key === newKey && f.value.toLowerCase() === v.toLowerCase())) return;
    setFingerprint([...fingerprint, { key: newKey, value: v }]);
    setNewVal('');
  }

  return (
    <div className="grid2">
      {/* 左：新任务意图卡 */}
      <div className="panel">
        <h2>新任务 · 意图卡</h2>
        <p className="sub">开工前把这张卡交给「现成」——它据此在舰队历史运行里找可复用的做法。</p>

        <div className="selectrow">
          <div className="intentcard">
            <div className="lbl">选一个预置任务</div>
            <div className="selectrow" style={{ marginBottom: 12 }}>
              <select value={intentId} onChange={(e) => setIntentId(e.target.value)}>
                {INTENT_CARDS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="lbl">意图（模拟语义检索的输入）</div>
            <div className="intent-text">{card.intent}</div>

            <div className="lbl">环境指纹（可增删，实时影响匹配）</div>
            <div className="chips">
              {fingerprint.map((f, i) => (
                <span className="chip env removable" key={`${f.key}-${f.value}`}>
                  <span className="k">{f.key}:</span>
                  {f.value}
                  <button title="移除" onClick={() => removeFp(i)}>
                    ×
                  </button>
                </span>
              ))}
              {fingerprint.length === 0 && <span className="chip">（无指纹：仅按意图关键词匹配）</span>}
            </div>

            <div className="addchip">
              <select value={newKey} onChange={(e) => setNewKey(e.target.value as FingerprintKey)}>
                {FP_KEYS.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
              <input
                list="fp-suggest"
                placeholder="取值，如 Cloudflare"
                value={newVal}
                onChange={(e) => setNewVal(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addFp()}
              />
              <datalist id="fp-suggest">
                {FP_SUGGEST[newKey].map((v) => (
                  <option key={v} value={v} />
                ))}
              </datalist>
              <button onClick={addFp}>加</button>
            </div>

            <label className="toggle">
              <input
                type="checkbox"
                checked={verifiedOnly}
                onChange={(e) => setVerifiedOnly(e.target.checked)}
              />
              只看「已验证」的运行
            </label>
          </div>
        </div>
      </div>

      {/* 右：检索结果 */}
      <div className="panel">
        <div className="matchhead">
          <h2>
            找到 <span className="count">{matches.length}</span> 条现成可参考的运行
          </h2>
        </div>
        <p className="sub">
          按「意图重合 55% + 环境指纹重合 45%」的确定性打分排序（模拟真实系统的 embedding 语义检索）。点任意一条看蒸馏配方。
        </p>

        {matches.length === 0 && (
          <div className="empty">
            <b>舰队里还没有足够相近的现成做法。</b>
            <br />
            这时新 agent 就该从零摸索——而它这次跑出来的运行，会成为下一次别人能「找现成」的来源。
          </div>
        )}

        {matches.map((m, idx) => {
          const s = savingsForRun(m.run);
          return (
            <div
              className={`match ${idx === 0 ? 'top' : ''}`}
              key={m.run.id}
              onClick={() => onOpenRecipe(m.run.id)}
              role="button"
            >
              <ScoreRing score={m.score} />
              <div className="mid">
                <div className="mintent">{m.run.intent}</div>
                <div className="meta">
                  来自 {m.run.agent} · {m.run.when}
                </div>
                <div className="reasons">
                  {m.reasons.slice(0, 6).map((r, i) => (
                    <span className={`rtag ${r.kind}`} key={i}>
                      {r.kind === 'intent' ? '意图 ' : ''}
                      {r.label}
                    </span>
                  ))}
                </div>
                <div className="saveinline">
                  复用一次约省 <b>{s.stepsSaved}</b> 步 · <b>{s.minutesSaved}</b> 分钟 · <b>${s.dollarsSaved}</b>
                  （剪掉当时的弯路/重试）
                </div>
              </div>
              <div className="right">
                {m.run.verified ? (
                  <span className="badge ok">已验证</span>
                ) : (
                  <span className="badge no">未验证</span>
                )}
                {m.adaptations.length > 0 && (
                  <>
                    <br />
                    <span className="badge adapt" style={{ marginTop: 6 }}>
                      {m.adaptations.length} 处需适配
                    </span>
                  </>
                )}
                <div className="cta">看配方 →</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
