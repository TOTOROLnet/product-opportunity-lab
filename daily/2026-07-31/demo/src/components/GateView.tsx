import { useState } from 'react';
import type { Memory, Scenario } from '../types';
import { computeTrust, type GateResult } from '../logic/trust';
import { TrustRing, badgesFor } from './shared';

interface Props {
  scenario: Scenario;
  memories: Memory[];
  gate: GateResult;
  managerApproved: boolean;
  onManagerApprove: () => void;
  onOpenMemory: (id: string) => void;
}

function EvidenceCard({
  m,
  memories,
  onOpen,
}: {
  m: Memory;
  memories: Memory[];
  onOpen: (id: string) => void;
}) {
  const b = computeTrust(m, memories);
  const badges = badgesFor(m, b);
  return (
    <div className={`mem${m.retired ? ' retired' : ''}`} onClick={() => onOpen(m.id)}>
      <div className="mem-top">
        <div className="mem-stmt">
          <span className="mem-id">{m.id}</span>
          {m.statement}
        </div>
        <TrustRing score={b.score} />
      </div>
      <div className="badges">
        {badges.map((bd, i) => (
          <span key={i} className={`badge ${bd.cls}`}>
            {bd.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function GateView({
  scenario,
  memories,
  gate,
  managerApproved,
  onManagerApprove,
  onOpenMemory,
}: Props) {
  const [mode, setMode] = useState<'before' | 'after'>('after');

  const byId = (id: string) => memories.find((m) => m.id === id)!;
  const naive = gate.naiveRecalledIds.map(byId).filter(Boolean);
  const augmented = gate.augmentedIds.map(byId).filter(Boolean);

  return (
    <div>
      <div className="panel">
        <h2>① 动手前 · 信任闸</h2>
        <p className="desc">
          Agent 准备执行一个真实动作。忆证 在执行前，对它依据的每条记忆验明「来源 × 确认次数 ×
          时效 × 矛盾」，并检查是否违反治理政策——低于信任阈值或违反政策就拦下来，而不是静默照做。
        </p>

        <div className="action-card">
          <div className="k">Pending Action · agent 待执行动作</div>
          <div className="title">{scenario.actionTitle}</div>
          <div className="detail">{scenario.actionDetail}</div>
        </div>

        <div className={`verdict v-${gate.verdict}`}>
          <div className="dot" />
          <div className="vtext">
            <h3>
              {gate.verdict} — {gate.headline}
            </h3>
            <ul className="reasons">
              {gate.reasons.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
            <p>
              建议通知渠道（由联系偏好记忆的信任推导）：<b>{gate.contactChannel}</b>
            </p>
          </div>
        </div>

        {gate.policyViolated && !managerApproved && (
          <button className="btn primary" onClick={onManagerApprove}>
            以经理身份补齐审批 → 放行
          </button>
        )}
        {managerApproved && gate.policyViolated && (
          <div className="banner">已补齐经理审批：人已进入回路，动作可继续。这正是忆证 的目的——把该由人做的决定挡回给人。</div>
        )}
      </div>

      <div className="panel">
        <h2>动手前 · 摊开的记忆证据</h2>
        <p className="desc">点任意一张卡片可跳到「溯源」看它的来源时间线与信任拆解。</p>

        <div className="grp-title">
          agent 朴素检索召回
          <span className="pill">语义相关度排序</span>
        </div>
        {naive.map((m) => (
          <EvidenceCard key={m.id} m={m} memories={memories} onOpen={onOpenMemory} />
        ))}

        {augmented.length > 0 && (
          <>
            <div className="grp-title">
              忆证 追加的矛盾 / 治理记忆
              <span className="pill aug">朴素检索漏掉的，被 conflictsWith 拉回</span>
            </div>
            {augmented.map((m) => (
              <EvidenceCard key={m.id} m={m} memories={memories} onOpen={onOpenMemory} />
            ))}
          </>
        )}
      </div>

      <div className="panel">
        <h2>价值对比 · 有忆证 vs 无忆证</h2>
        <div className="ba-toggle">
          <button className={mode === 'before' ? 'on-before' : ''} onClick={() => setMode('before')}>
            无忆证
          </button>
          <button className={mode === 'after' ? 'on-after' : ''} onClick={() => setMode('after')}>
            有忆证
          </button>
        </div>

        {mode === 'before' ? (
          <div className="ba-panel before">
            <h4>无忆证：agent 静默照做</h4>
            <div className="ba-step">
              <span className="ic">1.</span>
              <span>朴素检索召回 m1「VIP 一律退款至 $1000」，语义高度相关，得分最高。</span>
            </div>
            <div className="ba-step">
              <span className="ic">2.</span>
              <span>agent 不知道这条已 253 天没确认、只被随口说过 1 次，也没看到上周新政策 m4。</span>
            </div>
            <div className="ba-step">
              <span className="ic">3.</span>
              <span>直接批准 $500 退款，并按旧记忆 m2「偏好邮件」发邮件（其实住客上月已改用 WhatsApp）。</span>
            </div>
            <div className="ba-outcome bad">
              结果：违反上周生效的审批政策，$500 需事后追回；通知发错渠道，住客更不满 → 赔钱 + 掉信任。
            </div>
          </div>
        ) : (
          <div className="ba-panel after">
            <h4>有忆证：动手前先验记忆</h4>
            <div className="ba-step">
              <span className="ic">1.</span>
              <span>给依据记忆 m1 打分：过期 + 单次确认 + 被更权威记忆推翻 → trust≈0，不可作为放行理由。</span>
            </div>
            <div className="ba-step">
              <span className="ic">2.</span>
              <span>顺着矛盾关系拉回朴素检索漏掉的 m4（新政策）与 m5（改用 WhatsApp）。</span>
            </div>
            <div className="ba-step">
              <span className="ic">3.</span>
              <span>发现动作违反 m4 → 拦下转经理审批；通知渠道改用信任更高的 WhatsApp。</span>
            </div>
            <div className="ba-outcome good">
              结果：错误退款被挡在发生之前，人被拉进回路做该由人做的决定；通知发对渠道。省钱 + 保信任。
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
