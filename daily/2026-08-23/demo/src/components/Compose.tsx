import type { ComposeState, Manifest, CentsScope, OptsMode } from '../engine';
import { AMBIGUITIES, PROSE_REQUEST, FILES, type OpId } from '../data/codebase';

interface Props {
  state: ComposeState;
  setState: (s: ComposeState) => void;
  manifest: Manifest;
}

const OP_META: { id: OpId; title: string }[] = [
  { id: 'rename', title: '重命名符号：charge → createCharge' },
  { id: 'changeSig', title: 'postJson 增加 options 参数' },
  { id: 'extract', title: '抽取能力：重试逻辑 → src/resilience/' },
  { id: 'retype', title: '改类型：金额 number → Cents' },
];

// 把散文切成 [普通文本 | 歧义短语] 的序列，用于高亮。
const PROSE_TOKENS: { text: string; ambId?: string }[] = [
  { text: '把 charge ' },
  { text: '改个更清楚的名字', ambId: 'name' },
  { text: '，postJson ' },
  { text: '顺便支持一下 options', ambId: 'opts' },
  { text: '，' },
  { text: '把重试逻辑抽成独立模块', ambId: 'extractScope' },
  { text: '，' },
  { text: '金额都用 Cents 类型', ambId: 'centsScope' },
  { text: '。' },
];

export function Compose({ state, setState, manifest }: Props) {
  const opById = new Map(manifest.ops.map((o) => [o.id, o]));
  const ambById = new Map(AMBIGUITIES.map((a) => [a.id, a]));
  const enabledOpIds = new Set(manifest.ops.map((o) => o.id));

  function toggle(id: OpId) {
    setState({ ...state, [id]: !state[id] });
  }

  return (
    <div className="grid compose">
      {/* 左：散文指令 + 仓库 */}
      <div>
        <div className="panel">
          <div className="section-title">
            <span className="dot" /> 过去：一句散文，直接甩给 agent
          </div>
          <div className="prose-box">
            <div className="label">口头重构指令</div>
            <div className="prose-text">
              {PROSE_TOKENS.map((t, i) => {
                if (!t.ambId) return <span key={i}>{t.text}</span>;
                const amb = ambById.get(t.ambId);
                const resolved = amb ? enabledOpIds.has(amb.opId) : false;
                return (
                  <span
                    key={i}
                    className={`amb ${resolved ? 'resolved' : ''}`}
                    title={amb ? amb.question : ''}
                  >
                    {t.text}
                  </span>
                );
              })}
            </div>
          </div>
          <p className="hint">
            红色虚线处 = 散文里<b style={{ color: 'var(--danger)' }}> 人没拍板、agent 只能猜 </b>
            的决策（悬停看它要猜什么）。启用右侧对应操作并拍板后，会转为
            <b style={{ color: 'var(--good)' }}> 绿色（已消除歧义）</b>。
          </p>
        </div>

        <div className="panel">
          <div className="section-title">
            <span className="dot" /> mock 仓库 · acme-checkout（金色 = 本谱触达）
          </div>
          <div className="repo-tree">
            {FILES.map((f) => {
              const touched = manifest.filesTouched.includes(f.path);
              return (
                <div key={f.id}>
                  <span className={touched ? 'touched fpath' : 'fpath'}>
                    {touched ? '● ' : '  '}
                    {f.path}
                  </span>{' '}
                  <span className="frole">— {f.role}</span>
                </div>
              );
            })}
            {manifest.newModules.map((m) => (
              <div key={m}>
                <span className="touched fpath">＋ {m}</span>{' '}
                <span className="frole">— 新建：抽取出的 resilience 能力</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 右：编排面板 */}
      <div className="panel">
        <div className="section-title">
          <span className="dot" /> 现在：把散文编排成「改动谱」
        </div>

        {OP_META.map((meta) => {
          const on = state[meta.id];
          const op = opById.get(meta.id);
          return (
            <div key={meta.id} className={`op-card ${on ? 'on' : 'off'}`}>
              <div className="op-head">
                <div className="op-order">{on && op ? op.order : '–'}</div>
                <div className="op-title">{meta.title}</div>
                <div className="op-count">
                  {on && op ? (
                    <>
                      <b>{op.edits.length}</b> 处
                      {op.compatChecked > 0 ? ` · ${op.compatChecked} 兼容` : ''}
                      {op.newModules.length > 0 ? ' · +1 模块' : ''}
                    </>
                  ) : (
                    '已停用'
                  )}
                </div>
                <label className="switch" aria-label={`启用 ${meta.title}`}>
                  <input type="checkbox" checked={on} onChange={() => toggle(meta.id)} />
                  <span className="track" />
                  <span className="knob" />
                </label>
              </div>

              {on && op && (
                <>
                  <div className="op-wedge">{op.wedge}</div>
                  <div className="op-decided">
                    {op.decided.map((d, i) => (
                      <div className="decided-row" key={i}>
                        <span className="from">{d.label}</span>
                        <span className="to">{d.value}</span>
                      </div>
                    ))}
                  </div>

                  {/* 交互拍板：opts 必填/选填 */}
                  {meta.id === 'changeSig' && (
                    <div className="knob-row">
                      <div className="knob-label">
                        opts 必填还是选填？
                        <span className="q">散文「支持一下 options」没说——这一刀改变下游改动量。</span>
                      </div>
                      <div className="seg">
                        {(['optional', 'required'] as OptsMode[]).map((mode) => (
                          <button
                            key={mode}
                            className={state.optsMode === mode ? 'sel' : ''}
                            onClick={() => setState({ ...state, optsMode: mode })}
                          >
                            {mode === 'optional' ? '选填（0 下游）' : '必填（9 下游）'}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 交互拍板：Cents 范围 */}
                  {meta.id === 'retype' && (
                    <div className="knob-row">
                      <div className="knob-label">
                        「金额都用 Cents」的「都」到哪？
                        <span className="q">范围越大改得越多——范围由人定，不留给 agent 猜。</span>
                      </div>
                      <div className="seg">
                        {(
                          [
                            ['charge', '仅 charge'],
                            ['charge+refund', '含退款'],
                            ['all', '全部'],
                          ] as [CentsScope, string][]
                        ).map(([sc, label]) => (
                          <button
                            key={sc}
                            className={state.centsScope === sc ? 'sel' : ''}
                            onClick={() => setState({ ...state, centsScope: sc })}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}

        <div className="callout gold" style={{ marginTop: 14 }}>
          每启用一个操作、每拍一次板，上方指标条与右侧「谱」实时重算。
          编排完成后到「演奏预览」看每步展开成的确切编辑，到「一谱三读」导出给 agent 的机读清单。
        </div>
      </div>
    </div>
  );
}

export const _prose = PROSE_REQUEST;
