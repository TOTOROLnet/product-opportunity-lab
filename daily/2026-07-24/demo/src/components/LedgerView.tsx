import { CONTRACTS, DRIFTS } from '../data/pipeline';
import { Pill } from './ui';

export default function LedgerView({ selected }: { selected: string[] }) {
  const findings = CONTRACTS.find((c) => c.file === 'findings.json')!;
  const covered = findings.fields.length;

  return (
    <div className="view">
      <div className="panel intro">
        <div className="intro-left">
          <div className="intro-title">📒 契约台账</div>
          <p className="intro-blurb">
            榫卯为每个共享工件维护一份<b>可版本化的接口契约</b>。契约不是一次写死的：每处被采纳的迁移
            都会把契约「补厚」一格（如把 <code>sentiment</code> 取值域升级、把 <code>notes</code>{' '}
            纳入可选字段），越用越贴合真实数据——这正是「上下文/契约作为产品机制」的落点。
          </p>
        </div>
      </div>

      <div className="ledger-art">
        <div className="ledger-head">
          <span className="ledger-file">findings.json</span>
          <Pill tone="info">契约 v{findings.version}</Pill>
          <span className="panel-sub" style={{ marginLeft: 'auto' }}>
            生产者：研究员 · 消费者：分析师
          </span>
        </div>
        <table className="ctable">
          <thead>
            <tr>
              <th>字段</th>
              <th>类型</th>
              <th>单位 / 取值域</th>
              <th>是否被下游依赖</th>
            </tr>
          </thead>
          <tbody>
            {findings.fields.map((f) => (
              <tr key={f.name}>
                <td className="mono">{f.name}</td>
                <td>{f.type}</td>
                <td>{f.unit ?? (f.values ? `{${f.values.join(', ')}}` : f.range ?? '—')}</td>
                <td>
                  {f.consumedBy && f.consumedBy.length > 0 ? (
                    <Pill tone="warn">是 · 改动即影响下游</Pill>
                  ) : (
                    <Pill>否</Pill>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="coverage">
          <span className="panel-sub">契约覆盖字段</span>
          <div className="cov-track">
            <div className="cov-fill" style={{ width: '100%' }} />
          </div>
          <b>
            {covered}/{covered}
          </b>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h2>漂移历史时间线</h2>
          <span className="panel-sub">每次改动是否破坏契约、影响哪些下游、对应迁移；勾选项为「本轮发生的改动」</span>
        </div>
        <div className="timeline">
          {DRIFTS.map((d) => {
            const happened = selected.includes(d.id);
            return (
              <div className="tl-item" key={d.id} style={{ opacity: happened ? 1 : 0.55 }}>
                <span className={`tl-dot ${d.breaking ? 'brk' : 'safe'}`} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    {d.label}
                    {d.breaking ? <Pill tone="bad">破坏契约</Pill> : <Pill tone="good">安全演进</Pill>}
                    {happened && <Pill tone="info">本轮发生</Pill>}
                  </div>
                  <div className="panel-sub" style={{ marginTop: 2 }}>
                    {d.breaking ? `影响：${d.corrupts.join('、')} · 迁移：${d.migration}` : d.migration}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h2>下游工件契约（供参考）</h2>
        </div>
        <div className="arts">
          {CONTRACTS.filter((c) => c.file !== 'findings.json').map((c) => (
            <div className="art" key={c.file}>
              <div className="art-file">{c.file}</div>
              <div className="art-meta">
                产出：{c.producer === 'analyst' ? '分析师' : '报告员'} ·{' '}
                {c.consumers.length ? `被下游读取` : '终端工件'}
              </div>
              <div className="art-fields">
                {c.fields.map((f) => (
                  <div className="field" key={f.name}>
                    <span className="field-name">{f.name}</span>
                    <span className="field-type">
                      {f.type}
                      {f.unit ? ` · ${f.unit}` : ''}
                      {f.values ? ` · {${f.values.join(', ')}}` : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
