import { useState } from 'react';
import type { Fingerprint } from '../types';
import { FLEET_RUNS } from '../data/runs';
import { scoreRun } from '../lib/retrieve';
import { savingsForRun, fleetMonthlyForRun } from '../lib/savings';

interface Props {
  runId: string | null;
  keywords: string[];
  fingerprint: Fingerprint[];
  fleetSize: number;
  onBack: () => void;
}

export function RecipeView({ runId, keywords, fingerprint, fleetSize, onBack }: Props) {
  const [showPruned, setShowPruned] = useState(true);
  const run = FLEET_RUNS.find((r) => r.id === runId);

  if (!run) {
    return (
      <div className="panel">
        <div className="empty">
          <b>还没有选中任何运行。</b>
          <br />
          回到「检索台」，点一条匹配结果查看它的蒸馏配方。
        </div>
        <button className="backbtn" onClick={onBack} style={{ marginTop: 12 }}>
          ← 回检索台
        </button>
      </div>
    );
  }

  const match = scoreRun(keywords, fingerprint, run);
  const s = savingsForRun(run);
  const fleetMonthly = fleetMonthlyForRun(run, fleetSize);
  const prunedCount = run.rawSteps.filter((st) => st.kind !== 'action').length;

  return (
    <div className="panel">
      <div className="rv-head">
        <button className="backbtn" onClick={onBack}>
          ← 回检索台
        </button>
        <h2>{run.intent}</h2>
        {run.verified ? <span className="badge ok">已验证</span> : <span className="badge no">未验证</span>}
      </div>
      <p className="rv-meta">
        来源：{run.agent} · {run.when} · 验证方式：{run.verifiedBy} · 结果：{run.outcome}
      </p>

      <div className="stats">
        <div className="stat amber">
          <div className="n">{s.stepsSaved}</div>
          <div className="t">复用一次省下的步数（{s.rawSteps} → {s.recipeSteps}）</div>
        </div>
        <div className="stat">
          <div className="n">{s.minutesSaved}′</div>
          <div className="t">约省时间（每步 ~1.6 分钟，mock）</div>
        </div>
        <div className="stat">
          <div className="n">${s.dollarsSaved}</div>
          <div className="t">约省 token+机时（每步 ~$0.12，mock）</div>
        </div>
        <div className="stat green">
          <div className="n">${fleetMonthly}</div>
          <div className="t">
            舰队每月潜在省（{fleetSize} 台 × 每台每月 {run.recurPerAgentMonth} 次复发，上限估算）
          </div>
        </div>
      </div>

      <div className="cmp">
        {/* before */}
        <div className="col">
          <h3>原始运行（当时真实跑出来的痕迹）</h3>
          <p className="caption">
            共 {run.rawSteps.length} 步，其中 {prunedCount} 步是弯路 / 重试 —— 蒸馏时被剪掉。
          </p>
          <button className="prunetoggle" onClick={() => setShowPruned((v) => !v)}>
            {showPruned ? '隐藏被剪掉的弯路 ▲' : `展开被剪掉的 ${prunedCount} 步弯路 ▼`}
          </button>
          <div style={{ marginTop: 10 }}>
            {run.rawSteps.map((st, i) => {
              const pruned = st.kind !== 'action';
              if (pruned && !showPruned) return null;
              const label = st.kind === 'action' ? '✓' : st.kind === 'retry' ? '↻' : '✕';
              return (
                <div className={`rawstep ${pruned ? 'pruned' : ''}`} key={i}>
                  <span className={`dot ${st.kind}`}>{label}</span>
                  <div>
                    <div className="txt">{st.text}</div>
                    {st.note && <div className="stepnote">{st.note}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* after */}
        <div className="col after">
          <h3>蒸馏配方（已验证 · 最短路径）</h3>
          <p className="caption">去噪、去弯路后的 {run.recipe.length} 步，每步带验证信号。</p>
          <div style={{ marginTop: 10 }}>
            {run.recipe.map((st, i) => (
              <div className="recstep" key={i}>
                <span className="dot rec">{i + 1}</span>
                <div>
                  <div className="txt">{st.text}</div>
                  {st.verifiedBy && <div className="verifiedby">验证：{st.verifiedBy}</div>}
                  {st.adapt && <div className="adaptnote">适配：{st.adapt}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 适配警告：基于当前意图卡的环境指纹与本运行的差异 */}
      {match.adaptations.length > 0 ? (
        <div className="adaptbanner">
          <b>⚠ 这条配方可复用，但你的环境与它不同 —— 有 {match.adaptations.length} 处要改：</b>
          <ul>
            {match.adaptations.map((a, i) => (
              <li key={i}>
                <b>{a.key}</b>：你是 <b>{a.yours}</b>，这条配方用的是 <b>{a.recipeUses}</b> —— 复用时对应步骤需要替换。
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="okbanner">
          ✓ 你当前意图卡的环境指纹与这条运行一致，配方可较放心地直接复用（仍建议按每步验证信号自检）。
        </div>
      )}
    </div>
  );
}
