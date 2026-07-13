import type { MemoryItem } from '../types';
import { SCOPE_LABEL } from '../logic/mneme';

interface Props {
  toolName: string;
  injected: MemoryItem[];
  mode: 'naked' | 'governed';
  blockedCount: number;
  heldCount: number;
}

export function InjectedPreview({ toolName, injected, mode, blockedCount, heldCount }: Props) {
  return (
    <aside className="preview">
      <div className="preview-head">
        <span className="preview-title">注入进「{toolName}」上下文的最终内容</span>
        <span className={`preview-count ${mode === 'governed' ? 'ok' : 'warn'}`}>{injected.length} 条</span>
      </div>
      {injected.length === 0 ? (
        <div className="preview-empty">（暂无——尚有待裁决项，处理后才会注入）</div>
      ) : (
        <ul className="preview-list">
          {injected.map((m) => (
            <li key={m.id}>
              <span className={`scope scope-${m.scope}`}>{SCOPE_LABEL[m.scope]}</span>
              <span className="preview-text">{m.content}</span>
            </li>
          ))}
        </ul>
      )}
      {mode === 'governed' && (
        <div className="preview-foot">
          已拦截越界 <b>{blockedCount}</b> · 待裁决 <b>{heldCount}</b>
          <div className="preview-note">
            {blockedCount + heldCount === 0
              ? '这份上下文干净、最小、可信——正是记衡相对存储层记忆的增量。'
              : '越界项永不注入；待裁决项处理后才会进入上下文。'}
          </div>
        </div>
      )}
      {mode === 'naked' && (
        <div className="preview-foot preview-foot-warn">
          裸调阅：recall 命中的全部被塞进上下文，密钥/过期/矛盾/幻觉一并进入——工具与用户都毫不知情。
        </div>
      )}
    </aside>
  );
}
