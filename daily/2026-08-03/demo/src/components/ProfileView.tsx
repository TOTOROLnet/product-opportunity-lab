import type { Autonomy, Profile, Stakes, Topic, TopicRule } from '../types';
import {
  AUTONOMY_SHORT,
  SITUATIONS,
  STAKES_LABEL,
  TOPIC_ICON,
  TOPIC_LABEL,
  TOPIC_ORDER,
} from '../data/situations';
import { cellAutonomy, profileArchetype, redlineTopics } from '../logic/engine';
import { AUTONOMY_COLOR, cx, Legend } from './shared';

const STAKES_COLS: Stakes[] = ['low', 'mid', 'high'];
// 点击格子时的循环：放手→拟稿→先问→禁碰→放手。
const CYCLE: Record<Autonomy, Autonomy> = { handle: 'draft', draft: 'ask', ask: 'never', never: 'handle' };

interface Props {
  profile: Profile;
  voice: Record<string, boolean>;
  onEditRule: (topic: Topic, rule: TopicRule) => void;
  onGoReplay: () => void;
}

export default function ProfileView({ profile, voice, onEditRule, onGoReplay }: Props) {
  const arch = profileArchetype(profile);
  const redlines = redlineTopics(profile);

  const answered = SITUATIONS.filter((s) => voice[s.id] !== undefined);
  const likeCount = answered.filter((s) => voice[s.id] === true).length;
  const notLike = SITUATIONS.filter((s) => voice[s.id] === false);

  function cycleCell(topic: Topic, stakes: Stakes) {
    const cur = cellAutonomy(profile.topics[topic], stakes);
    const next = CYCLE[cur];
    onEditRule(topic, { level: next, atStakes: stakes, redline: next === 'never' });
  }

  return (
    <div className="view">
      <div className="view-head">
        <div>
          <h2>分寸画像 · 你把边界画成了这样</h2>
          <p className="muted">
            把零散拍板合成一张可读、可调的契约：<b>话题 × 风险</b> 的授权刻度 + 语气卡 + 红线。<b>点任意格子</b>即可就地调整（放手→拟稿→先问→禁碰）。
          </p>
        </div>
        <button className="cta" onClick={onGoReplay}>
          用它回放一周 →
        </button>
      </div>

      <div className="archetype card" style={{ borderColor: '#7c9cff55' }}>
        <div className="archetype-title">你的分寸性格：<b>{arch.title}</b></div>
        <div className="archetype-note">{arch.note}</div>
      </div>

      <div className="card matrix-card">
        <div className="matrix-head">
          <h4>授权刻度矩阵（越绿越放手，越红越收紧）</h4>
          <Legend />
        </div>
        <table className="matrix">
          <thead>
            <tr>
              <th className="mtopic">话题＼风险</th>
              {STAKES_COLS.map((st) => (
                <th key={st}>{STAKES_LABEL[st]}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TOPIC_ORDER.map((t) => {
              const rule = profile.topics[t];
              return (
                <tr key={t} className={cx(rule.redline && 'row-redline')}>
                  <td className="mtopic">
                    {TOPIC_ICON[t]} {TOPIC_LABEL[t]}
                    {rule.redline && <span className="red-tag">红线</span>}
                  </td>
                  {STAKES_COLS.map((st) => {
                    const a = cellAutonomy(rule, st);
                    return (
                      <td key={st}>
                        <button
                          className="cell"
                          style={{ background: AUTONOMY_COLOR[a] + '26', color: AUTONOMY_COLOR[a], borderColor: AUTONOMY_COLOR[a] + '66' }}
                          onClick={() => cycleCell(t, st)}
                          title="点击调整授权档"
                        >
                          {AUTONOMY_SHORT[a]}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="muted small">
          规则：风险每升一档，授权最多降一档（不会出现"越危险越放手"）；标红线的话题一律禁碰。
        </p>
      </div>

      <div className="two-col">
        <div className="card">
          <h4>语气卡 · 它说话像不像你</h4>
          {answered.length === 0 ? (
            <p className="muted">还没在彩排里判过"像我 / 不像我"。回到彩排台标几条，这里会长出你的口吻偏好。</p>
          ) : (
            <>
              <div className="voice-score">
                契合 <b>{likeCount}</b> / {answered.length} 条
                <div className="progress-bar thin">
                  <div className="progress-fill" style={{ width: (likeCount / answered.length) * 100 + '%', background: '#38d39f' }} />
                </div>
              </div>
              {notLike.length > 0 ? (
                <ul className="tone-list">
                  {notLike.map((s) => (
                    <li key={s.id}>
                      <span className="snap-topic">{TOPIC_ICON[s.topic]} {TOPIC_LABEL[s.topic]}</span>
                      <span className="tone-fix">✎ {s.toneFixHint}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="muted small">你标过的都"像我"——口吻这块暂时不用调。</p>
              )}
            </>
          )}
        </div>

        <div className="card">
          <h4>红线清单 · 它绝不能碰</h4>
          {redlines.length === 0 ? (
            <p className="muted">你还没设任何红线。在彩排或矩阵里把某类事设成"禁碰"，它会出现在这里，并在回放里被直接拦下。</p>
          ) : (
            <ul className="redline-list">
              {redlines.map((t) => (
                <li key={t}>
                  <span className="red-dot" /> {TOPIC_ICON[t]} {TOPIC_LABEL[t]} —— 任何风险档一律不代你处理
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
