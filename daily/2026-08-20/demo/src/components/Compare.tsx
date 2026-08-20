import type { FlipResult, Summary } from '../types';
import { Stat, SEVERITY_LABEL, maintText } from './ui';

function pkgMeta(c: FlipResult['agentPick']): string {
  const parts: string[] = [];
  parts.push(c.isNativeApproach ? '0KB' : `${c.bundleKb}KB`);
  parts.push(c.license === 'none' ? '原生' : c.license);
  if (!c.isNativeApproach) parts.push(maintText(c.lastPublishMonths, false));
  return parts.join(' · ');
}

export function Compare({
  flips,
  summary,
  hasTaste,
  onGoCalibrate,
}: {
  flips: FlipResult[];
  summary: Summary;
  hasTaste: boolean;
  onGoCalibrate: () => void;
}) {
  return (
    <div>
      <div className="card">
        <h2>对味重选 · 把你的口味回放到这次 PR</h2>
        <p className="hint">
          用你在「口味校准」里定的偏好，重新审视 agent 的每个选型：哪些会翻盘、避免了哪些后悔、省下多少体积与传递依赖。
          全部按同一套可解释的规则，下面有完整公式。
        </p>
        {!hasTaste && (
          <div
            className="learned-box"
            style={{ background: '#f3ede3', borderColor: '#e6ddcf', color: '#6b655c' }}
          >
            当前没有设定任何口味——我们尊重 agent 的原始选择，不替你改判。去{' '}
            <button className="linkish" onClick={onGoCalibrate}>
              口味校准
            </button>{' '}
            设定偏好后回来看对比。
          </div>
        )}
      </div>

      <div className="card">
        <div className="summary">
          <Stat num={summary.flips} lbl="会改判" tone="accent" />
          <Stat num={summary.regrets} lbl="避免的后悔" tone="red" />
          <Stat num={`${summary.bundleSavedKb}KB`} lbl="省下体积" tone="olive" />
          <Stat num={summary.transitiveSaved} lbl="少拖传递依赖" tone="olive" />
          <Stat num={summary.depsRemoved} lbl="整包移除(换原生)" tone="olive" />
          <Stat num={summary.licenseIssuesCleared} lbl="清掉许可硬伤" tone="red" />
        </div>
      </div>

      <div className="card">
        <h2>逐个决定的对照</h2>
        {flips.map((f) => {
          if (!f.flipped) {
            return (
              <div className="flip-card keep" key={f.decision.id}>
                <div className="flip-head">
                  <span className="fg">{f.decision.subGoal}</span>
                  <span className={`badge ${SEVERITY_LABEL.keep.cls}`}>{SEVERITY_LABEL.keep.text}</span>
                </div>
                <div className="keep-line">
                  保留 agent 的选择 <b>{f.agentPick.name}</b>（{pkgMeta(f.agentPick)}）——在你的口味下无需改判。
                </div>
              </div>
            );
          }
          const sev = SEVERITY_LABEL[f.severity];
          return (
            <div className={`flip-card ${f.severity}`} key={f.decision.id}>
              <div className="flip-head">
                <span className="fg">{f.decision.subGoal}</span>
                <span className={`badge ${sev.cls}`}>{sev.text}</span>
              </div>
              <div className="swap">
                <span className="chip-pkg from">
                  {f.agentPick.name}
                  <span className="meta">{pkgMeta(f.agentPick)}</span>
                </span>
                <span className="arrow">→</span>
                <span className="chip-pkg to">
                  {f.tastePick.name}
                  <span className="meta">{pkgMeta(f.tastePick)}</span>
                </span>
              </div>
              <ul className="reasons">
                {f.reasons.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      <div className="card">
        <h2>它凭什么这么判？（完整公式，可核对）</h2>
        <p className="hint">
          我们不藏逻辑。每个候选的「对味分」都是你设的权重乘以各维度好度的加总，改判只在「严格更优」时发生。
        </p>
        <div className="formula">
          <div>
            <span className="k">对味分</span>(候选) = Σ <code>口味权重</code> × 该维度好度(0..1)
          </div>
          <div>&nbsp;&nbsp;轻量好度&nbsp;&nbsp;&nbsp;= clamp(1 − 体积KB / 300)</div>
          <div>&nbsp;&nbsp;维护好度&nbsp;&nbsp;&nbsp;= clamp(1 − 距上次发版月数 / 36)</div>
          <div>&nbsp;&nbsp;少传递好度 = clamp(1 − 传递依赖数 / 30)</div>
          <div>&nbsp;&nbsp;原生好度&nbsp;&nbsp;&nbsp;= 是原生方案 ? 1 : 0</div>
          <div>&nbsp;&nbsp;类型好度&nbsp;&nbsp;&nbsp;= 一等 TS 类型 ? 1 : 0</div>
          <div>&nbsp;&nbsp;禁 copyleft = <span className="k">硬规则</span>：命中即淘汰（不是扣分）</div>
          <div style={{ marginTop: 8 }}>
            <span className="k">改判规则</span>：仅当某候选「对味分」<b>严格高于</b> agent 选择时才改判；并列 →
            尊重 agent 原选择（决不无谓地替你翻案）。
          </div>
        </div>
      </div>

      <div className="not-clone">
        <b>为什么这不是 X 的克隆：</b>
        Gauge 是厂商侧的「怎么被 agent 选中」增长分析；Snyk / Socket 是对<b>产物</b>扫 CVE / 许可；Dependabot
        是版本升级。<b>对味</b>站在<b>买方</b>一侧：把 agent 沉默的选型<b>决策过程</b>变可读，并从你的判断里学出<b
        >可复用的口味</b>，回放去改判——治理的是 agent 的「选择」，而不是扫描既有产物、也不是替厂商做 GTM。
      </div>
    </div>
  );
}
