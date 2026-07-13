import { useState } from 'react';
import type { MemoryItem, Verdict } from '../types';
import { SCOPE_LABEL, VERDICT_LABEL, originLabel, type Decision } from '../logic/mneme';

interface Props {
  memory: MemoryItem;
  mode: 'naked' | 'governed';
  verdict: Verdict; // naked：基础风险标记；governed：最终裁决
  reason: string;
  resolved: boolean; // governed 下：该项是否已被裁决
  hasDecision: boolean; // governed 下：用户是否已做出决定
  partnerContent?: string; // 矛盾对里另一条的内容
  onAction: (id: string, action: Decision) => void;
  onKeepConflict: (id: string) => void;
  onUndo: (id: string) => void;
}

const VERDICT_CLASS: Record<Verdict, string> = {
  inject: 'v-inject',
  'blocked-scope': 'v-block',
  'held-poison': 'v-poison',
  'held-stale': 'v-stale',
  'held-conflict': 'v-conflict',
};

export function MemoryCard({
  memory,
  mode,
  verdict,
  reason,
  resolved,
  hasDecision,
  partnerContent,
  onAction,
  onKeepConflict,
  onUndo,
}: Props) {
  const [open, setOpen] = useState(false);
  const m = memory;

  // 是否为注入（用于左侧色条）
  const injectedNow = mode === 'naked' ? true : verdict === 'inject';
  const isRisk = verdict !== 'inject';

  return (
    <div className={`card ${VERDICT_CLASS[verdict]} ${resolved && mode === 'governed' ? 'card-resolved' : ''}`}>
      <div className="card-top">
        <div className="card-scope">
          <span className={`scope scope-${m.scope}`}>{SCOPE_LABEL[m.scope]}</span>
          <span className={`origin origin-${m.origin}`}>{originLabel(m)}</span>
        </div>
        <span className={`verdict ${VERDICT_CLASS[verdict]}`}>
          {mode === 'naked'
            ? isRisk
              ? `⚠ ${VERDICT_LABEL[verdict].replace('扣留·', '风险·').replace('放行注入', '')}被注入`.trim()
              : '✓ 注入'
            : VERDICT_LABEL[verdict]}
        </span>
      </div>

      <div className="card-content">{m.content}</div>

      <div className="card-reason">{reason}</div>

      <div className="card-foot">
        <button className="link" onClick={() => setOpen((v) => !v)}>
          {open ? '收起出处' : '出处 / 详情'}
        </button>
        {mode === 'naked' && (
          <span className={`inject-tag ${injectedNow ? (isRisk ? 'tag-bad' : 'tag-ok') : ''}`}>
            {isRisk ? '未经治理，照单注入' : '安全注入'}
          </span>
        )}
      </div>

      {open && (
        <div className="provenance">
          <div>
            <span>来源工具</span>
            <b>{m.source.tool}</b>
          </div>
          {m.source.agent && (
            <div>
              <span>写入 agent</span>
              <b>{m.source.agent}</b>
            </div>
          )}
          <div>
            <span>写入时间</span>
            <b>{m.source.writtenAt}</b>
          </div>
          <div>
            <span>来源方式</span>
            <b>{originLabel(m)}</b>
          </div>
          {m.note && (
            <div className="prov-note">
              <span>备注</span>
              <b>{m.note}</b>
            </div>
          )}
        </div>
      )}

      {mode === 'governed' && verdict === 'blocked-scope' && (
        <div className="actions actions-locked">🔒 越界·硬性拦截（最小权限，Demo 中不可一键放行）</div>
      )}

      {mode === 'governed' && verdict === 'held-poison' && !hasDecision && (
        <div className="actions">
          <button className="btn btn-ok" onClick={() => onAction(m.id, 'confirmed')}>
            确认为可信事实
          </button>
          <button className="btn btn-bad" onClick={() => onAction(m.id, 'retired')}>
            退休（判为幻觉）
          </button>
        </div>
      )}

      {mode === 'governed' && verdict === 'held-stale' && !hasDecision && (
        <div className="actions">
          <button className="btn btn-ok" onClick={() => onAction(m.id, 'kept')}>
            仍然保留
          </button>
          <button className="btn btn-bad" onClick={() => onAction(m.id, 'retired')}>
            退休此旧事实
          </button>
        </div>
      )}

      {mode === 'governed' && verdict === 'held-conflict' && !hasDecision && (
        <div className="actions">
          <div className="conflict-hint">与之冲突：{partnerContent ?? '—'}</div>
          <div className="actions-row">
            <button className="btn btn-ok" onClick={() => onKeepConflict(m.id)}>
              保留这条·退休另一条
            </button>
            <button className="btn btn-bad" onClick={() => onAction(m.id, 'retired')}>
              退休这条
            </button>
          </div>
        </div>
      )}

      {mode === 'governed' && resolved && hasDecision && (
        <div className="actions actions-done">
          <span>已处理</span>
          <button className="link" onClick={() => onUndo(m.id)}>
            撤销
          </button>
        </div>
      )}
    </div>
  );
}
