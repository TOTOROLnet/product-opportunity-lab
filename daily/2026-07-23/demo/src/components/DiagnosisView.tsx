import type { DiagnosisResult, SignatureId } from '../types';
import { PERSONA } from '../data/corpus';
import { Gauge, Metric, Pill, SeverityTag } from './ui';
import { pct } from './ui';

export function DiagnosisView({
  base,
  live,
  mastered,
  onOpenMove,
}: {
  base: DiagnosisResult; // 生手基线（固定）
  live: DiagnosisResult; // 当前（随已掌握招式变化）
  mastered: Set<SignatureId>;
  onOpenMove: (id: SignatureId) => void;
}) {
  return (
    <div className="view">
      <section className="panel intro">
        <div className="intro-left">
          <div className="intro-title">
            我们回看了 <b>{PERSONA.name}</b>（{PERSONA.role}）{PERSONA.windowText} 的用法
          </div>
          <p className="intro-blurb">{PERSONA.blurb}</p>
          <p className="mock-note">
            ⓘ 这是对<b>你自己真实用法</b>的体检，不是又一套课程。演示数据为 <b>mock 模拟</b>（无登录、
            不读取你的真实 AI 历史），诊断由确定性引擎在本地计算。
          </p>
        </div>
        <div className="intro-right">
          <Gauge score={live.proficiency} delta={live.proficiency - base.proficiency} />
        </div>
      </section>

      <section className="metrics-row">
        <Metric label="一次过率" value={pct(live.firstPassRate)} sub={`生手基线 ${pct(base.firstPassRate)}`} />
        <Metric label="平均返工轮数" value={`${live.avgRounds}`} sub={`生手基线 ${base.avgRounds}`} tone="warn" />
        <Metric label="放弃率" value={pct(live.gaveupRate)} sub={`生手基线 ${pct(base.gaveupRate)}`} tone="bad" />
        <Metric label="将就率" value={pct(live.settledRate)} sub={`生手基线 ${pct(base.settledRate)}`} />
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>你反复犯的「失手签名」</h2>
          <span className="panel-sub">按「浪费的返工 + 结果损失」影响力排序 · 越靠上越该先练</span>
        </div>
        <div className="sig-list">
          {live.perSignature.map((d, i) => {
            const done = mastered.has(d.signature.id);
            return (
              <div key={d.signature.id} className={`sig-card ${done ? 'sig-done' : ''}`}>
                <div className="sig-rank">#{i + 1}</div>
                <div className="sig-emoji">{d.signature.emoji}</div>
                <div className="sig-main">
                  <div className="sig-name-row">
                    <span className="sig-name">{d.signature.name}</span>
                    <SeverityTag severity={d.signature.severity} />
                    {done && <Pill tone="good">已掌握 · 残余 30%</Pill>}
                  </div>
                  <div className="sig-plain">{d.signature.plain}</div>
                  <div className="sig-stats">
                    <span>
                      出现 <b>{d.frequency}</b> 次
                    </span>
                    <span>
                      共多花 <b>{d.totalExtraRounds}</b> 轮返工
                    </span>
                    <span>
                      影响力 <b>{d.impact}</b>
                    </span>
                    <span className="sig-egs">例：{d.exampleIds.join(' · ')}</span>
                  </div>
                </div>
                <button className="btn btn-ghost" onClick={() => onOpenMove(d.signature.id)}>
                  {done ? '复习这招' : '看这招怎么破 →'}
                </button>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
