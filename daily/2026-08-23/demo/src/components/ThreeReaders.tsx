import { useMemo, useState } from 'react';
import { toAgentManifest, type ComposeState, type Manifest, type Edit } from '../engine';

interface Props {
  state: ComposeState;
  manifest: Manifest;
}

type Reader = 'human' | 'agent' | 'struct';

const READERS: { id: Reader; label: string; who: string }[] = [
  { id: 'human', label: '白话摘要', who: '给人复核' },
  { id: 'agent', label: 'agent manifest', who: '给 agent 执行' },
  { id: 'struct', label: '结构变更预览', who: '看落到哪' },
];

export function ThreeReaders({ state, manifest }: Props) {
  const [reader, setReader] = useState<Reader>('human');
  const [copied, setCopied] = useState(false);

  const json = useMemo(() => JSON.stringify(toAgentManifest(state), null, 2), [state]);

  // 按文件聚合所有编辑，供"结构变更预览"。
  const byFile = useMemo(() => {
    const map = new Map<string, { edits: Edit[]; isNew: boolean }>();
    for (const op of manifest.ops) {
      for (const e of op.edits) {
        const isNew = manifest.newModules.includes(e.file);
        if (!map.has(e.file)) map.set(e.file, { edits: [], isNew });
        map.get(e.file)!.edits.push(e);
      }
    }
    return Array.from(map.entries());
  }, [manifest]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(json);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  if (manifest.ops.length === 0) {
    return (
      <div className="panel">
        <div className="section-title">
          <span className="dot" /> 一谱三读
        </div>
        <p style={{ color: 'var(--muted)' }}>请先在「编排台」启用至少一个语义操作。</p>
      </div>
    );
  }

  return (
    <div>
      <div className="panel">
        <div className="section-title">
          <span className="dot" /> 一份谱，三种读者 —— 同一份真相的三种投影
        </div>
        <p className="hint" style={{ marginBottom: 12 }}>
          呼应 Zero「文本只是语义图的投影」的思想：编谱里，<b style={{ color: 'var(--gold)' }}>那份改动谱</b>
          是唯一真相，人、agent、审阅各取所需的投影——而不是让每个读者各自去解读同一句散文。
        </p>

        <div className="reader-switch">
          {READERS.map((r) => (
            <button
              key={r.id}
              className={reader === r.id ? 'sel' : ''}
              onClick={() => setReader(r.id)}
            >
              {r.label}
              <span className="who">{r.who}</span>
            </button>
          ))}
        </div>

        {reader === 'human' && (
          <div>
            {manifest.ops.map((op) => (
              <div className="summary-line" key={op.id}>
                <span className="n">第 {op.order} 步</span>
                <div>
                  <div>
                    <b>{op.title}</b>
                  </div>
                  <div className="detail">
                    {op.edits.length} 处确切编辑
                    {op.compatChecked > 0 ? ` · ${op.compatChecked} 处调用点自动判定兼容、0 改动` : ''}
                    {op.newModules.length > 0 ? ` · 新建 ${op.newModules.join('、')}` : ''}
                    。已拍板：
                    {op.decided.map((d, i) => (
                      <span key={i}>
                        {i > 0 ? '；' : ''}
                        {d.label} → <b style={{ color: 'var(--good)' }}>{d.value}</b>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
            <div className="summary-line" style={{ borderBottom: 'none' }}>
              <span className="n">合计</span>
              <div className="detail">
                {manifest.enabledCount} 个操作 · {manifest.totalEdits} 处编辑 ·{' '}
                {manifest.filesTouched.length} 个文件（含 {manifest.newModules.length} 新模块）· agent
                待猜点数 <b style={{ color: 'var(--good)' }}>0</b>（散文 = 4）。
              </div>
            </div>
          </div>
        )}

        {reader === 'agent' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8, gap: 10 }}>
              <span className="hint" style={{ margin: 0 }}>
                机读交付清单（<code style={{ fontFamily: 'var(--mono)' }}>bianpu.change-score/v1</code>
                ）—— 任意 coding agent 照此执行，无需推断散文意图。
              </span>
              <button className="copy-btn" style={{ marginLeft: 'auto' }} onClick={copy}>
                {copied ? '已复制 ✓' : '复制 JSON'}
              </button>
            </div>
            <pre className="code">{json}</pre>
          </div>
        )}

        {reader === 'struct' && (
          <div>
            {byFile.map(([file, info]) => (
              <div className="struct-file" key={file}>
                <div className="fname">
                  <span>{file}</span>
                  <span className={`badge ${info.isNew ? 'new' : ''}`}>
                    {info.isNew ? '＋ 新建模块' : `${info.edits.length} 处结构变更`}
                  </span>
                </div>
                <ul>
                  {info.edits.map((e, i) => (
                    <li key={i}>
                      <b>{e.target}</b> — {e.action}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <p className="hint">
              这是<b>结构级</b>变更预览（符号 / 签名 / 类型 / import），不是逐行 diff——
              让人一眼看清「这次改动到底动了哪些结构」，而非在文本噪声里找语义。
            </p>
          </div>
        )}
      </div>

      <div className="grid cols-2" style={{ marginTop: 16 }}>
        <div className="callout info">
          <h4>散文 vs 谱</h4>
          <ul>
            <li>
              <b>散文：</b>「把 charge 改个名、postJson 支持 options、抽重试、金额用 Cents」——4 处要 agent 猜。
            </li>
            <li>
              <b>谱：</b>{manifest.enabledCount} 个语义操作、{manifest.totalEdits} 处解析到稳定符号的编辑、
              执行顺序确定、0 处猜测；且这份谱可移植给任意 agent / CI 执行。
            </li>
          </ul>
        </div>
        <div className="callout gold">
          <h4>为什么不是照抄</h4>
          <ul>
            <li>
              <b>非 Zero 克隆：</b>不引入新语言、不搞图优先迁移；回填到<b>现有语言与现有 agent 工作流</b>，
              治「人→agent 的写」，Zero 治「编译器→agent 的读」。
            </li>
            <li>
              <b>非 IDE 单点重构：</b>把多个语义操作<b>组合成一份可复核、可交接的谱</b>，
              并导出可给外部 agent 执行的可移植 manifest。
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
