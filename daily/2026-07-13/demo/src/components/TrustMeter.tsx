import type { RecallSummary } from '../types';

interface Props {
  summary: RecallSummary;
  mode: 'naked' | 'governed';
}

const TONE_CLASS: Record<RecallSummary['bannerTone'], string> = {
  safe: 'banner banner-safe',
  review: 'banner banner-review',
  risk: 'banner banner-risk',
};

export function TrustMeter({ summary, mode }: Props) {
  return (
    <div className="trustmeter">
      <div className={TONE_CLASS[summary.bannerTone]}>
        <span className="banner-tag">{mode === 'naked' ? '裸调阅' : '记衡治理'}</span>
        <span className="banner-text">{summary.bannerText}</span>
      </div>
      <div className="chips">
        <div className="chip chip-inject">
          <b>{summary.injected}</b>
          <span>放行注入</span>
        </div>
        <div className="chip chip-block">
          <b>{mode === 'naked' ? 0 : summary.blocked}</b>
          <span>越界拦截</span>
        </div>
        <div className="chip chip-hold">
          <b>{mode === 'naked' ? 0 : summary.held}</b>
          <span>待裁决</span>
        </div>
        <div className="chip chip-total">
          <b>{summary.total}</b>
          <span>recall 命中</span>
        </div>
      </div>
    </div>
  );
}
