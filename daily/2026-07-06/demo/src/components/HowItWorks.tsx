import { useState } from 'react';

export function HowItWorks() {
  const [open, setOpen] = useState(false);
  return (
    <section className="how">
      <button className="how-toggle" onClick={() => setOpen((v) => !v)}>
        {open ? '收起' : '这是什么 / 增量在哪'} · How it works
        <span className="how-caret">{open ? '▾' : '▸'}</span>
      </button>
      {open && (
        <div className="how-body">
          <div className="how-flow">
            <div className="how-step">
              <span className="how-num">1</span>
              <div>
                <strong>接入证据（不自己产）</strong>
                <p>吃 TryCase / CI / e2e 之类工具产出的 run 证据：截图、HTTP trace、日志、测试 artifact。</p>
              </div>
            </div>
            <div className="how-step">
              <span className="how-num">2</span>
              <div>
                <strong>钉住基线</strong>
                <p>把一份被判过 PASS 的 run 存成可版本化「基线」，每条验收标准绑定它需要的证据。</p>
              </div>
            </div>
            <div className="how-step">
              <span className="how-num">3</span>
              <div>
                <strong>跨 run 复判</strong>
                <p>agent 重跑/换版本 → 对比新证据，逐条复判验收标准，带阈值/容差去噪。</p>
              </div>
            </div>
            <div className="how-step">
              <span className="how-num">4</span>
              <div>
                <strong>只顶变化 + 回归自动 trip</strong>
                <p>输出 HELD / REGRESSED / IMPROVED，把 PASS→FAIL 的回归和证据 delta 推到人面前。</p>
              </div>
            </div>
          </div>

          <div className="how-ba">
            <div className="ba ba-before">
              <div className="ba-h">Before（现状）</div>
              <ul>
                <li>证据 bundle 一次性、跑完即弃，没人当基线。</li>
                <li>judge 每次从头重读整份证据，成本高、易疲劳。</li>
                <li>源码 diff 很小很绿 → 静默回归漏到线上。</li>
              </ul>
            </div>
            <div className="ba ba-after">
              <div className="ba-h">After（Datum）</div>
              <ul>
                <li>证据 = 可版本化基线，验收随每次重跑自动复判。</li>
                <li>人只审「变化的 delta」，不重看整份证据。</li>
                <li>PASS→FAIL 自动 trip，回归当场拦住。</li>
              </ul>
            </div>
          </div>

          <p className="how-foot">
            Datum 不产环境、不接真实系统，只做证据的<strong>记忆层 + 跨 run 裁决层</strong>。
            区别于 TryCase（证据来源）、CircleChat（一次性验收工作台）与通用回归测试（按测试用例、非按 agent 验收标准）。
          </p>
        </div>
      )}
    </section>
  );
}
