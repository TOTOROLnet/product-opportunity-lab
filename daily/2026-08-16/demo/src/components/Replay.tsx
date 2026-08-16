import { useState } from 'react';
import type { Verdict } from '../types';
import { DEC_LABEL } from '../labels';
import { ActionMeta, DecisionPill } from './shared';

interface Props {
  verdicts: Verdict[];
  onGoBlast: () => void;
}

export default function Replay({ verdicts, onGoBlast }: Props) {
  const [onlyLeaked, setOnlyLeaked] = useState(false);
  const counts = {
    allow: verdicts.filter((v) => v.decision === 'allow').length,
    review: verdicts.filter((v) => v.decision === 'review').length,
    deny: verdicts.filter((v) => v.decision === 'deny').length,
  };
  const leaked = verdicts.filter((v) => v.leaked).length;
  const shown = onlyLeaked ? verdicts.filter((v) => v.leaked) : verdicts;

  return (
    <section className="replay">
      <div className="route-bar">
        <div className="route allow">
          <b>{counts.allow}</b>
          <span>✅ 自动放行</span>
        </div>
        <div className="route review">
          <b>{counts.review}</b>
          <span>🙋 叫人复核</span>
        </div>
        <div className="route deny">
          <b>{counts.deny}</b>
          <span>⛔ 一票否决</span>
        </div>
        <label className={onlyLeaked ? 'leak-filter on' : 'leak-filter'}>
          <input type="checkbox" checked={onlyLeaked} onChange={(e) => setOnlyLeaked(e.target.checked)} />
          只看危险漏网（{leaked}）
        </label>
      </div>

      {shown.length === 0 && (
        <div className="empty">🎉 没有危险漏网动作——这套策略把不可逆 / 敏感动作都拦住了。</div>
      )}

      <ul className="verdict-list">
        {shown.map((v) => (
          <li key={v.action.id} className={`verdict ${v.leaked ? 'leaked' : ''}`}>
            <div className="v-left">
              <div className="v-title">
                <span className="v-emoji">{v.action.emoji}</span>
                <code>{v.action.title}</code>
                {v.leaked && <span className="leak-badge">危险漏网</span>}
                {!v.matchedByRule && <span className="gap-badge">默认路径</span>}
              </div>
              <div className="v-intent">
                <span className="agent">{v.action.agent}</span> · {v.action.intent}
              </div>
              <ActionMeta action={v.action} />
              <div className="reasons">
                {v.reasons.map((r, i) => (
                  <span key={i} className="reason-chip">
                    {r}
                  </span>
                ))}
              </div>
            </div>
            <div className="v-right">
              <DecisionPill decision={v.decision} />
              {v.decision === 'allow' && <span className="radius-mini">爆炸半径 {v.radius}</span>}
            </div>
          </li>
        ))}
      </ul>

      <div className="reason-legend">
        判决 = <b>{DEC_LABEL.allow}</b> / <b>{DEC_LABEL.review}</b> / <b>{DEC_LABEL.deny}</b>，
        由确定性引擎依据策略 + 动作属性推出，每条都可解释。
      </div>

      <button className="cta" onClick={onGoBlast}>
        查看爆炸半径 & 策略盲区 →
      </button>
    </section>
  );
}
