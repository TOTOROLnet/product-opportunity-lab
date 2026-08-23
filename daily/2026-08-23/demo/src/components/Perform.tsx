import type { Manifest } from '../engine';

interface Props {
  manifest: Manifest;
  onGoCompose: () => void;
}

export function Perform({ manifest, onGoCompose }: Props) {
  if (manifest.ops.length === 0) {
    return (
      <div className="panel">
        <div className="section-title">
          <span className="dot" /> 演奏预览
        </div>
        <p style={{ color: 'var(--muted)' }}>
          当前没有启用任何语义操作。请先到{' '}
          <button className="copy-btn" onClick={onGoCompose}>
            编排台
          </button>{' '}
          启用操作。
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="callout info" style={{ marginBottom: 16 }}>
        <h4>演奏预览：每个语义操作展开成的确切编辑</h4>
        这是 agent 将要执行的、逐条可复核的语义编辑（不是逐行文本 diff）。
        <span className="tag anchor">锚点</span> = 人显式指定的定义；
        <span className="tag prop">传播</span> = 顺着调用边 / 依赖自动带出的点；
        <span className="tag compat">兼容</span> = 自动判定源码兼容、无需改动。
        每个操作的「待猜点数」都是 <b style={{ color: 'var(--good)' }}>0</b>。
      </div>

      {manifest.ops.map((op) => (
        <div key={op.id} className="perform-op">
          <div className="bar">
            <div className="op-order">{op.order}</div>
            <div className="op-title">{op.title}</div>
            <div className="op-count">
              <b>{op.edits.length}</b> 处编辑
              {op.compatChecked > 0 ? ` · ${op.compatChecked} 处兼容` : ''}
              {op.newModules.length > 0 ? ` · 新建 ${op.newModules.length} 模块` : ''}
            </div>
          </div>
          <div className="body">
            <div className="edit-list">
              {op.edits.map((e, i) => (
                <div className="edit-row" key={i}>
                  <span className="file">{e.file}</span>
                  <span className="target">{e.target}</span>
                  <span className="action">
                    {e.action}{' '}
                    <span className={`tag ${e.propagated ? 'prop' : 'anchor'}`}>
                      {e.propagated ? '传播' : '锚点'}
                    </span>
                  </span>
                </div>
              ))}
              {op.compatChecked > 0 && (
                <div className="edit-row">
                  <span className="file">（{op.compatChecked} 处调用点）</span>
                  <span className="target">既有 postJson(url, body) 调用</span>
                  <span className="action">
                    逐一判定源码兼容、无需改动 <span className="tag compat">兼容 · 0 改</span>
                  </span>
                </div>
              )}
            </div>
            <div className="zero-guess">
              ✓ 本操作 agent 需要猜测处 = 0（目标、范围、顺序均已在谱里解析为稳定符号）
            </div>
          </div>
        </div>
      ))}

      <div className="callout gold">
        <b>为什么这比「把散文丢给 agent」强：</b>
        同样一句「把 charge 改个名、postJson 支持 options、抽重试、金额用 Cents」，agent 得先猜新名字、
        猜 opts 必填还是选填、猜「重试逻辑」的边界、猜「金额」含不含退款——猜错就少改 / 改错 / 过度改，再来回纠偏。
        编谱把这 4 处猜测在<b>输入端</b>消除，agent 只负责照谱精确执行。
      </div>
    </div>
  );
}
