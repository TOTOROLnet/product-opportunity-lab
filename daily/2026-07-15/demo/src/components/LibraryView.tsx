import { LIBRARY } from '../data/library';
import type { Doc } from '../types';
import { Tag } from './shared';

interface Props {
  onStart: (doc: Doc) => void;
}

export function LibraryView({ onStart }: Props) {
  return (
    <div className="view">
      <section className="hero">
        <h1 className="hero__title">耳记 · Earmark</h1>
        <p className="hero__tagline">
          把任意长文档变成"边听边被追问"的音频课。<b>听不是终点，而是主动回忆的载体。</b>
        </p>
        <p className="hero__sub">
          别人做"更好听的播客"，耳记做"听完真的记住"：AI 把材料切成概念单元、在概念边界自动暂停发问，
          实时给你一张<b>保留度地图</b>，并把没记牢的概念排进 <b>60 秒重听队列</b>。
        </p>
        <div className="hero__contrast">
          <div className="contrast-card contrast-card--before">
            <div className="contrast-card__k">被动听（播客 / TTS / NotebookLM）</div>
            <div className="contrast-card__v">线性、无反馈 → 听完≈没听，说不清薄弱点</div>
          </div>
          <div className="contrast-card__arrow">→</div>
          <div className="contrast-card contrast-card--after">
            <div className="contrast-card__k">主动回忆听（耳记）</div>
            <div className="contrast-card__v">被打断→回忆→即时反馈→可测量的留存 + 重听队列</div>
          </div>
        </div>
      </section>

      <h2 className="section-title">选一份材料，开始主动回忆式收听</h2>
      <div className="doc-grid">
        {LIBRARY.map((doc) => {
          const qCount = doc.units.reduce((s, u) => s + u.questions.length, 0);
          return (
            <button key={doc.id} className="doc-card" onClick={() => onStart(doc)}>
              <div className="doc-card__type">
                <Tag>{doc.sourceType}</Tag>
              </div>
              <div className="doc-card__title">{doc.title}</div>
              <div className="doc-card__blurb">{doc.blurb}</div>
              <div className="doc-card__meta">
                <span>🎧 约 {doc.estMinutes} 分钟</span>
                <span>🧩 {doc.units.length} 个概念单元</span>
                <span>❓ {qCount} 处回忆追问</span>
              </div>
              <div className="doc-card__units">
                {doc.units.map((u) => (
                  <span key={u.id} className="unit-chip">
                    {u.title}
                  </span>
                ))}
              </div>
              <div className="doc-card__cta">开始收听 →</div>
            </button>
          );
        })}
      </div>

      <p className="foot-note">
        说明：这是纯前端 mock demo。概念单元与追问为预置示例（真实产品由 LLM 从任意文档自动生成）；
        语音使用浏览器原生 <code>speechSynthesis</code>（非外部 API、不上传数据），
        环境不支持时自动降级为进度条 + 文字高亮，不影响体验闭环。
      </p>
    </div>
  );
}
