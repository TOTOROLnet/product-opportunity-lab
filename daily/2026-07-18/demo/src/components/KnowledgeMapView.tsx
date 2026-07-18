import { useState } from 'react';
import type { ModelState, EvidenceEntry } from '../types';
import { SKILL_BY_ID } from '../data/skills';
import { isMastered } from '../logic/engine';
import { SkillGraph, MasteryBar, pct } from './shared';

interface Props {
  model: ModelState;
  turn: number;
  onSetManualMastery: (skillId: string, value: number) => void;
  onSetInterest: (skillId: string, dir: 1 | -1) => void;
}

function evClass(e: EvidenceEntry): string {
  if (e.kind === 'correction') return 'evitem correction';
  if (e.kind === 'answer') return e.delta >= 0 ? 'evitem answer-up' : 'evitem answer-down';
  return 'evitem';
}

export default function KnowledgeMapView({
  model,
  turn,
  onSetManualMastery,
  onSetInterest,
}: Props) {
  const [selectedId, setSelectedId] = useState<string>('where');
  const st = model[selectedId];
  const skill = SKILL_BY_ID[selectedId];
  const stale = st.lastPracticedTurn >= 0 && turn - st.lastPracticedTurn >= 4;

  return (
    <div className="grid study">
      <div className="panel">
        <h2>认知地图 · AI 对你的完整判断（玻璃盒）</h2>
        <p className="hint">
          这一屏就是别的自适应产品锁在服务端的黑盒。点任意节点看它凭什么这么判、并当场校正它。
        </p>
        <SkillGraph
          model={model}
          selectedId={selectedId}
          onSelect={(id) => setSelectedId(id)}
        />
      </div>

      <div className="panel detail">
        <div className="qmeta">
          <span className="pill accent">{skill.name}</span>
          {isMastered(st) && <span className="pill good">已掌握</span>}
          {stale && <span className="pill bad">可能生疏（久未练）</span>}
        </div>
        <p className="hint" style={{ marginTop: 4 }}>
          {skill.desc}
        </p>

        <div className="kv">
          <span>AI 估计掌握度</span>
          <span style={{ fontWeight: 700 }}>{pct(st.mastery)}</span>
        </div>
        <div style={{ margin: '6px 0 10px' }}>
          <MasteryBar mastery={st.mastery} />
        </div>
        <div className="kv">
          <span>置信度（观测越多越高）</span>
          <span style={{ fontWeight: 700 }}>{pct(st.confidence)}</span>
        </div>
        <div className="kv">
          <span>你的学习意图（兴趣权重）</span>
          <span style={{ fontWeight: 700 }}>×{st.interest.toFixed(1)}</span>
        </div>
        <div className="kv">
          <span>上次练习</span>
          <span>{st.lastPracticedTurn < 0 ? '尚未练习' : `第 ${st.lastPracticedTurn} 题`}</span>
        </div>

        {/* 校正区 */}
        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
            校正模型（你说了算）
          </div>
          <label style={{ fontSize: 12, color: 'var(--muted)' }}>
            直接告诉 AI 我在「{skill.short}」上的真实水平：<b style={{ color: 'var(--text)' }}>{pct(st.mastery)}</b>
          </label>
          <input
            className="slider"
            type="range"
            min={0}
            max={100}
            value={Math.round(st.mastery * 100)}
            onChange={(e) => onSetManualMastery(selectedId, Number(e.target.value) / 100)}
          />
          <div className="btnrow" style={{ marginTop: 6 }}>
            <button className="btn small" onClick={() => onSetInterest(selectedId, 1)}>
              想先攻它 ↑
            </button>
            <button className="btn small" onClick={() => onSetInterest(selectedId, -1)}>
              暂时搁置 ↓
            </button>
          </div>
        </div>

        {/* 证据日志 */}
        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
            证据日志 · AI 凭什么这么判
          </div>
          <div className="evlog">
            {[...st.evidence].reverse().map((e, i) => (
              <div key={i} className={evClass(e)}>
                <div className="t">第 {e.turn} 步 · {e.kind}</div>
                {e.text}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
