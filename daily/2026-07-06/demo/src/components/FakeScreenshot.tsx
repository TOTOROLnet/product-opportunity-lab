import type { ScreenshotEvidence } from '../types';

/** 纯 SVG/CSS 画出的伪浏览器截图，不引用任何外部图片。 */
export function FakeScreenshot({ shot }: { shot: ScreenshotEvidence }) {
  return (
    <div className="shot">
      <div className="shot-chrome">
        <span className="dot dot-r" />
        <span className="dot dot-y" />
        <span className="dot dot-g" />
        <span className="shot-url">{shot.urlBar}</span>
      </div>
      <div className={`shot-body shot-${shot.variant}`}>
        <ShotContent shot={shot} />
      </div>
      <div className="shot-caption">{shot.caption}</div>
    </div>
  );
}

function ShotContent({ shot }: { shot: ScreenshotEvidence }) {
  switch (shot.variant) {
    case 'success':
      return (
        <div className="shot-center">
          <div className="shot-badge shot-badge-ok">✓</div>
          <div className="shot-line w60" />
          <div className="shot-line w40" />
          <div className="shot-pill">订单已生成</div>
        </div>
      );
    case 'error':
      return (
        <div className="shot-center">
          <div className="shot-badge shot-badge-err">!</div>
          <div className="shot-line w50" />
          <div className="shot-line w30" />
          <div className="shot-pill shot-pill-err">500 Server Error</div>
        </div>
      );
    case 'notfound':
      return (
        <div className="shot-center">
          <div className="shot-404">404</div>
          <div className="shot-line w40" />
          <div className="shot-pill shot-pill-err">页面/路由不存在</div>
        </div>
      );
    case 'form':
      return (
        <div className="shot-stack">
          <div className="shot-line w70" />
          <div className="shot-box" />
          <div className="shot-line w50" />
          <div className="shot-cta">立即购买</div>
        </div>
      );
    case 'dashboard':
      return (
        <div className="shot-stack">
          <div className="shot-topbar" />
          <div className="shot-grid">
            <div className="shot-card" />
            <div className="shot-card" />
            <div className="shot-card" />
          </div>
          <div className="shot-line w80" />
          <div className="shot-line w60" />
        </div>
      );
    default:
      return null;
  }
}
