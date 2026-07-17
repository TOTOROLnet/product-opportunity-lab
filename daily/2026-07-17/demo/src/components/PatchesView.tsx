import { useState } from 'react';
import type { ClaimComputed } from '../types';
import { FreshnessGauge, KindTag } from './shared';

interface Props {
  pendingStale: ClaimComputed[];
  pendingManual: ClaimComputed[];
  dismissed: ClaimComputed[];
  score: number;
  freshLB: number;
  totalLB: number;
  onAccept: (id: string) => void;
  onDismiss: (id: string) => void;
  onRestore: (id: string) => void;
  onAcceptAllAuto: () => void;
  onResolveManual: (id: string, text: string) => void;
}

function DiffCard({
  c,
  onAccept,
  onDismiss,
}: {
  c: ClaimComputed;
  onAccept: () => void;
  onDismiss: () => void;
}) {
  return (
    <div className="patch-card">
      <div className="patch-head">
        <KindTag kind={c.source.kind} />
        <span className="patch-src">{c.source.name}</span>
        <span className="patch-badge">可自动修复</span>
      </div>
      <div className="diff">
        <div className="diff-line diff-old">
          <span className="diff-mark">−</span>
          <span>{c.assertedText}</span>
        </div>
        <div className="diff-line diff-new">
          <span className="diff-mark">+</span>
          <span>{c.currentText}</span>
        </div>
      </div>
      <div className="patch-why">
        为什么：来源「{c.source.name}」从 <b>{c.assertedValue}</b> 变为 <b>{c.currentValue}</b>。
      </div>
      <div className="patch-actions">
        <button className="btn btn-primary" onClick={onAccept}>
          采纳
        </button>
        <button className="btn btn-ghost" onClick={onDismiss}>
          驳回（保留旧文案）
        </button>
      </div>
    </div>
  );
}

function ManualCard({
  c,
  onResolve,
  onDismiss,
}: {
  c: ClaimComputed;
  onResolve: (text: string) => void;
  onDismiss: () => void;
}) {
  const options = c.claim.manualOptions ?? [];
  const [choice, setChoice] = useState(0);
  return (
    <div className="patch-card patch-manual">
      <div className="patch-head">
        <KindTag kind={c.source.kind} />
        <span className="patch-src">{c.source.name}</span>
        <span className="patch-badge badge-manual-lg">需人判断</span>
      </div>
      <div className="patch-why">
        来源从「<b>{c.assertedValue}</b>」改为「<b>{c.currentValue}</b>」，含义模糊，
        常青不替你决定。请你拍板改写方式：
      </div>
      <div className="manual-options">
        {options.map((opt, i) => (
          <label key={i} className={`opt${choice === i ? ' opt-sel' : ''}`}>
            <input
              type="radio"
              name={`m-${c.claim.id}`}
              checked={choice === i}
              onChange={() => setChoice(i)}
            />
            <span>{opt}</span>
          </label>
        ))}
      </div>
      <div className="patch-actions">
        <button className="btn btn-primary" onClick={() => onResolve(options[choice])}>
          确认改写
        </button>
        <button className="btn btn-ghost" onClick={onDismiss}>
          暂不处理
        </button>
      </div>
    </div>
  );
}

export default function PatchesView({
  pendingStale,
  pendingManual,
  dismissed,
  score,
  freshLB,
  totalLB,
  onAccept,
  onDismiss,
  onRestore,
  onAcceptAllAuto,
  onResolveManual,
}: Props) {
  const afterAuto = totalLB === 0 ? 100 : Math.round(((freshLB + pendingStale.length) / totalLB) * 100);
  const nothingPending = pendingStale.length === 0 && pendingManual.length === 0;

  return (
    <div className="patchesview">
      <div className="patch-summary">
        <FreshnessGauge score={score} />
        <div className="ps-text">
          <div className="ps-title">
            {nothingPending ? '文档已恢复常青' : '常青已定位到失真的句子'}
          </div>
          <div className="ps-sub">
            当前 {freshLB}/{totalLB} 条承重论断为鲜；待处理：
            <b className="ps-auto">{pendingStale.length}</b> 条可自动修复、
            <b className="ps-manual">{pendingManual.length}</b> 条需人判断。
          </div>
          {pendingStale.length > 0 && (
            <div className="ps-projection">
              一键采纳可自动修复项 → 鲜度将回升到 <b>{afterAuto}%</b>
            </div>
          )}
          {pendingStale.length > 0 && (
            <button className="btn btn-primary btn-lg" onClick={onAcceptAllAuto}>
              扫描并采纳全部可自动修复项（{pendingStale.length}）
            </button>
          )}
        </div>
      </div>

      {nothingPending && (
        <div className="all-clear">
          ✓ 全部承重论断已与来源对齐。文档鲜度 {score}%。
          {dismissed.length === 0 && '常青会持续盯住来源，下次漂移第一时间提醒。'}
        </div>
      )}

      {pendingStale.map((c) => (
        <DiffCard
          key={c.claim.id}
          c={c}
          onAccept={() => onAccept(c.claim.id)}
          onDismiss={() => onDismiss(c.claim.id)}
        />
      ))}

      {pendingManual.map((c) => (
        <ManualCard
          key={c.claim.id}
          c={c}
          onResolve={(text) => onResolveManual(c.claim.id, text)}
          onDismiss={() => onDismiss(c.claim.id)}
        />
      ))}

      {dismissed.length > 0 && (
        <div className="dismissed">
          <div className="dismissed-head">已驳回 / 暂不处理（{dismissed.length}）——保留旧文案，仍计为未修复</div>
          {dismissed.map((c) => (
            <div key={c.claim.id} className="dismissed-item">
              <span>「{c.assertedText}」</span>
              <button className="link" onClick={() => onRestore(c.claim.id)}>
                恢复处理
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
