import type { Experiment } from '../types';
import { designProtocol } from '../logic/engine';

interface Props {
  experiments: Experiment[];
  selectedId: string;
  onSelect: (id: string) => void;
  onGoReadout: (id: string) => void;
}

export default function DesignView({ experiments, selectedId, onSelect, onGoReadout }: Props) {
  const selected = experiments.find((e) => e.id === selectedId) ?? experiments[0];
  const p = designProtocol(selected);

  return (
    <div className="view">
      <div className="section-head">
        <h2>从「主动建议」到「n-of-1 实验」</h2>
        <p className="section-sub">
          下面是来自各类健康助手的 3 条<b>主动建议</b>（mock）。选一条，验己会把它翻译成一份
          方法学上站得住的个人对照实验协议——只盯一个主指标、预登记成败线、按你自己的噪声定所需天数。
        </p>
      </div>

      <div className="cards">
        {experiments.map((e) => (
          <button
            key={e.id}
            className={`sug-card ${e.id === selectedId ? 'sel' : ''}`}
            onClick={() => onSelect(e.id)}
          >
            <div className="sug-source">{e.source}</div>
            <div className="sug-text">“{e.suggestion}”</div>
            <div className="sug-meta">
              主指标：{e.metricName}（{e.metricUnit}） · {e.design}
            </div>
          </button>
        ))}
      </div>

      <div className="protocol">
        <div className="protocol-head">
          <h3>验己为你设计的实验协议</h3>
          <button className="btn" onClick={() => onGoReadout(selected.id)}>
            数据到位了 → 去看读数 ②
          </button>
        </div>

        <div className="proto-grid">
          <div className="proto-item wide">
            <div className="proto-k">假设（预登记）</div>
            <div className="proto-v">{p.hypothesis}</div>
          </div>
          <div className="proto-item wide">
            <div className="proto-k">主指标（只盯一个）</div>
            <div className="proto-v">{p.primaryMetric}</div>
          </div>
          <div className="proto-item">
            <div className="proto-k">实验设计</div>
            <div className="proto-v">{p.designLabel}</div>
          </div>
          <div className="proto-item">
            <div className="proto-k">基线期 / 干预期</div>
            <div className="proto-v">
              {p.baselineDays} 天 / {p.interventionDays} 天
            </div>
          </div>
          <div className="proto-item">
            <div className="proto-k">建议观察天数</div>
            <div className="proto-v">
              ≈ {p.recommendedDays} 天
              <span className="proto-note">（由指标噪声推算）</span>
            </div>
          </div>
          <div className="proto-item wide">
            <div className="proto-k">成败线（预先定死，防事后自欺）</div>
            <div className="proto-v hot">{p.successLine}</div>
          </div>
          <div className="proto-item">
            <div className="proto-k">要控制不变</div>
            <div className="proto-v">
              <ul className="mini-list">
                {p.hold.map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ul>
            </div>
          </div>
          <div className="proto-item">
            <div className="proto-k">要记录的混杂因素</div>
            <div className="proto-v">
              <div className="tags">
                {p.confounders.map((c) => (
                  <span key={c} className="tag">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <p className="proto-foot">
          为什么这不是「又一条建议」：验己不告诉你该不该少吃夜宵，它把这句建议变成一个
          <b>可证伪、可复现</b>的个人实验，让数据而不是感觉替你下结论。
        </p>
      </div>
    </div>
  );
}
