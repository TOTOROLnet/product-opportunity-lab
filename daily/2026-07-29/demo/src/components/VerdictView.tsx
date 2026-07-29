import { useMemo } from 'react';
import type { Metrics, PatchId } from '../types';
import { GOLDEN_SET, DEFAULT_THRESHOLD, PATCHES } from '../data/goldenSet';
import { evaluate, pct, recommendedThreshold } from '../logic/engine';

interface Props {
  onApply: () => void;
}

export default function VerdictView({ onApply }: Props) {
  const naive = useMemo(
    () => evaluate(GOLDEN_SET, DEFAULT_THRESHOLD, new Set<PatchId>()),
    [],
  );
  const allPatches = useMemo(() => new Set<PatchId>(['dekeyword', 'injection']), []);
  const recT = useMemo(() => recommendedThreshold(GOLDEN_SET, allPatches), [allPatches]);
  const calibrated = useMemo(() => evaluate(GOLDEN_SET, recT, allPatches), [recT, allPatches]);

  return (
    <div className="view">
      <p className="lead">
        同一份黄金集、同一个判官，两种上线方式的成绩单。左边是团队最常见的做法：拿出厂默认阈值直接接到
        运行时开火。右边是准星校准后的结果。差别就是"归零"的价值。
      </p>

      <div className="verdict-grid">
        <ScoreCard
          kind="bad"
          title="朴素上线"
          subtitle={`默认阈值 ${DEFAULT_THRESHOLD} · 不校准 · 判官原样接 kill switch`}
          m={naive}
        />
        <ScoreCard
          kind="good"
          title="准星校准后"
          subtitle={`阈值校准到 ${recT} · 打 ${PATCHES.length} 个失败模式补丁`}
          m={calibrated}
        />
      </div>

      <section className="delta-strip">
        <Delta label="漏放危险动作" from={naive.fn} to={calibrated.fn} unit="个" betterLower />
        <Delta
          label="误杀正常业务"
          from={naive.fp}
          to={calibrated.fp}
          unit="个"
          betterLower
          fromPct={pct(naive.falseKillRate)}
          toPct={pct(calibrated.falseKillRate)}
        />
        <Delta label="总代价" from={naive.cost} to={calibrated.cost} unit="" betterLower />
      </section>

      <section className="panel honest">
        <h3 className="panel-title">诚实结论（准星敢说的话）</h3>
        <ul>
          <li>
            默认阈值 {DEFAULT_THRESHOLD} 直接上线：会<b className="hot">漏放 {naive.fn} 个危险动作</b>
            （含 2 个 prompt 注入攻击），同时还<b className="hot">误杀 {pct(naive.falseKillRate)} 的正常业务</b>。
            这把判官<b>现在还不能开火</b>。
          </li>
          <li>
            打两个失败模式补丁（去关键词偏置 + 加注入识别）后，注入案例判官分被拉到 90+，
            正常大额退款不再被误判 —— 危险与正常终于能被<b>分开</b>。
          </li>
          <li>
            但仍有一条硬案例（"匿名请求免押金 + 远程开门锁"）话术正常、判官分偏低：
            要一个不漏都拦下，<b>代价是仍误杀 {calibrated.fp} 个正常业务（{pct(calibrated.falseKillRate)}）</b>。
            准星的建议是把这类硬骨头<b>路由到人工审批（HITL）</b>，而不是靠硬调阈值两头受损。
          </li>
        </ul>
        <button className="primary" onClick={onApply}>
          在校准台一键套用这套推荐设置
        </button>
      </section>

      <p className="disclaimer">
        免责声明：本页所有数字由确定性统计引擎在浏览器端实时算出，基于 mock 争议案例与预置判官分，
        <b>非真实 LLM 判官推断</b>，不构成任何安全、法务或合规建议。准星只做判官的校准与验收，
        不下达真实的 block / kill / approve 动作。
      </p>
    </div>
  );
}

function ScoreCard({
  kind,
  title,
  subtitle,
  m,
}: {
  kind: 'good' | 'bad';
  title: string;
  subtitle: string;
  m: Metrics;
}) {
  return (
    <div className={`scorecard ${kind}`}>
      <div className="sc-head">
        <span className="sc-title">{title}</span>
        <span className={`sc-flag ${kind}`}>{kind === 'good' ? '可讨论上线' : '不建议开火'}</span>
      </div>
      <p className="sc-sub">{subtitle}</p>
      <div className="sc-rows">
        <div className={`sc-row ${m.fn ? 'bad' : 'ok'}`}>
          <span>漏放危险动作</span>
          <b>
            {m.fn} / {m.totalBlock}（{pct(m.falsePassRate)}）
          </b>
        </div>
        <div className={`sc-row ${m.fp ? 'warn' : 'ok'}`}>
          <span>误杀正常业务</span>
          <b>
            {m.fp} / {m.totalAllow}（{pct(m.falseKillRate)}）
          </b>
        </div>
        <div className="sc-row">
          <span>命中拦截</span>
          <b>
            {m.tp} / {m.totalBlock}
          </b>
        </div>
        <div className={`sc-row ${m.cost > 100 ? 'bad' : m.cost > 20 ? 'warn' : 'ok'}`}>
          <span>总代价</span>
          <b>{m.cost}</b>
        </div>
      </div>
    </div>
  );
}

function Delta({
  label,
  from,
  to,
  unit,
  betterLower,
  fromPct,
  toPct,
}: {
  label: string;
  from: number;
  to: number;
  unit: string;
  betterLower: boolean;
  fromPct?: string;
  toPct?: string;
}) {
  const improved = betterLower ? to < from : to > from;
  return (
    <div className="delta-card">
      <span className="delta-label">{label}</span>
      <span className="delta-nums">
        <span className="from">
          {from}
          {unit} {fromPct && <em>{fromPct}</em>}
        </span>
        <span className="arrow">→</span>
        <span className={`to ${improved ? 'improved' : ''}`}>
          {to}
          {unit} {toPct && <em>{toPct}</em>}
        </span>
      </span>
    </div>
  );
}
