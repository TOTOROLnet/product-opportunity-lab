import type { EngineResult, Mutation } from '../types';
import { MUTATIONS } from '../data/mutations';

const KIND_LABEL: Record<Mutation['kind'], string> = {
  promo: '促销',
  price: '改价',
  shipping: '运费',
  inventory: '库存',
  category: '品类',
};

export default function ChangePlanView({
  full,
  onGoClash,
}: {
  full: EngineResult;
  onGoClash: () => void;
}) {
  return (
    <section className="panel">
      <h2>① 变更计划 —— Agent 提交的批量写操作（逐条视图）</h2>
      <p className="sub">
        这正是 Athena / Openbase / PureBox 今天在做的护栏形态：每条改动先出预览、逐条确认。问题是 ——
        逐条预览只验证「单条本身合法」。
      </p>

      <div className="banner warn">
        <span className="big">12 / 12 通过</span>
        <span>
          逐条预览：全部 12 条各自合法（改价高于成本、促销参数合规、库存 / 品类操作有效）。
          <b> 但「逐条全绿」不等于「整批安全」</b> —— 逐条预览看不见多条叠加后的联动风险。
        </span>
      </div>

      <div className="mgrid">
        {MUTATIONS.map((m) => (
          <div className="mcard" key={m.id}>
            <div className="top">
              <span className="mid">{m.id}</span>
              <span className={`mid-badge k-${m.kind}`}>{KIND_LABEL[m.kind]}</span>
            </div>
            <div className="label">{m.label}</div>
            <div className="note">{m.note}</div>
            <div className="preview">
              <span className="pass">✓ 逐条预览通过</span>
              <span style={{ color: 'var(--muted)' }}>· 单条合法</span>
            </div>
          </div>
        ))}
      </div>

      <div className="toolbar" style={{ marginTop: 16 }}>
        <button className="btn primary" onClick={onGoClash}>
          对整批做 dry-run → 查看联动风险 →
        </button>
        <span style={{ color: 'var(--muted)', fontSize: 13, alignSelf: 'center' }}>
          合流检出的联动风险：<b style={{ color: 'var(--hi)' }}>{full.clashes.length} 处</b>
          （逐条模式一处也看不见）
        </span>
      </div>
    </section>
  );
}
