import type { HostVerbosity } from '../types';
import { KIND_LABEL, ROLE_META, type BuiltProgram } from '../logic/engine';

interface Props {
  built: BuiltProgram;
  verbosity: HostVerbosity;
  onStart: () => void;
}

export default function RundownView({ built, verbosity, onStart }: Props) {
  return (
    <div>
      <section className="hero">
        <div className="kicker">今日节目单 · {built.date}</div>
        <h2>{built.theme}</h2>
        <p>
          你没读的东西太多了。今晚我从你的积压里挑了 {built.cleared} 条、排成一条有起承转合的线、
          写好串场——放完就收播。<b style={{ color: 'var(--amber)' }}>不是又一个刷不完的信息流。</b>
        </p>

        <div className="hero-stats">
          <div className="hero-stat">
            <div className="n">
              {built.totalMinutes}
              <small>分钟</small>
            </div>
            <div className="l">整档时长 · 会结束</div>
          </div>
          <div className="hero-stat">
            <div className="n">
              {built.cleared}
              <small>条</small>
            </div>
            <div className="l">今晚要清掉的积压</div>
          </div>
          <div className="hero-stat">
            <div className="n">
              {built.backlogBefore} <span className="arrow">→ {built.backlogAfter}</span>
            </div>
            <div className="l">积压：收播后剩这么多</div>
          </div>
          <div className="hero-stat">
            <div className="n">
              {built.streakDays}
              <small>天</small>
            </div>
            <div className="l">连续收播</div>
          </div>
        </div>

        <div className="contrast-strip">
          <span className="chip no">✕ 无限滚动</span>
          <span className="chip no">✕ 自动续播</span>
          <span className="chip no">✕ AI 生成正文</span>
          <span className="chip yes">✓ 会结束</span>
          <span className="chip yes">✓ 编排可见</span>
          <span className="chip yes">✓ 全是你自己存的</span>
        </div>
      </section>

      <div className="section-title">
        <h3>节目编排（AI 主持排的）</h3>
        <span className="meta">开场 → 深读 → 反调 → 收尾</span>
      </div>

      <div className="rundown">
        {built.segments.map((s) => {
          const meta = ROLE_META[s.role];
          return (
            <div
              className="track"
              key={s.item.id}
              style={{ ['--role-accent' as string]: meta.accent }}
            >
              <div className="rcard">
                <div className="order">{s.index + 1}</div>
                <div>
                  <span className="role-badge">{meta.label}</span>
                  <h4>{s.item.title}</h4>
                  <div className="srcline">
                    <span>{s.item.source}</span>
                    <span>· {KIND_LABEL[s.item.kind]}</span>
                    <span className="aged">· 存了 {s.item.savedDaysAgo} 天没看</span>
                  </div>
                  <div className="host-note">
                    <b>主持 · 为什么现在放这条：</b>
                    {s.segment.hostIntro[verbosity]}
                  </div>
                </div>
                <div className="rt">{s.item.minutes} 分钟</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="controls" style={{ marginTop: 22 }}>
        <button className="btn btn-primary btn-big" onClick={onStart}>
          ▶ 开始收播 · {built.totalMinutes} 分钟后结束
        </button>
      </div>
    </div>
  );
}
