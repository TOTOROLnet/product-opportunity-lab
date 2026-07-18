import { useMemo } from 'react';
import type { ReplayStep } from '../types';
import { simulateComparison } from '../logic/engine';

function Track({ steps }: { steps: ReplayStep[] }) {
  return (
    <div className="track">
      {steps.map((s) => {
        let cls = 'chip';
        if (s.note) cls += ' slip';
        else if (s.redundant) cls += ' redundant';
        else cls += ' weak';
        return (
          <span key={s.index} className={cls} title={s.note ?? (s.redundant ? '复习已掌握技能（无效操练）' : '投向真正薄弱的技能')}>
            {s.index}. {s.skillShort}
            {s.note ? ' ✋' : s.redundant ? ' ↩' : ''}
          </span>
        );
      })}
    </div>
  );
}

export default function CompareView() {
  const cmp = useMemo(() => simulateComparison(), []);

  return (
    <div className="panel">
      <h2>对比 · 黑盒自适应 vs 明镜玻璃盒</h2>
      <p className="hint">
        场景（课程中段）：你其实早已掌握 SELECT / WHERE / ORDER，正在攻 JOIN / 分组 / 子查询 / 窗口函数。
        第 1 题一道 WHERE 复习题你<b>手滑答错了</b>（其实会）。下面两列是<b>同一个确定性引擎</b>跑出的
        12 步——唯一区别是：右边你能当场标记「手滑」，左边不能。
      </p>

      <div className="cmp">
        <div className="cmpcol black">
          <div className="qmeta">
            <span className="pill bad">黑盒自适应</span>
            <span className="pill">看不见 · 不能改</span>
          </div>
          <Track steps={cmp.blackBox} />
          <div className="statline">
            <span className="bignum" style={{ color: 'var(--bad)' }}>
              {cmp.blackBoxRedundant}
            </span>
            <span>/ 12 题在复习你<b>早已掌握</b>的内容（↩ 无效操练）</span>
          </div>
          <p className="hint" style={{ marginTop: 8, marginBottom: 0 }}>
            误判无法申诉：{cmp.slipSkillShort} 显得"不稳"，引擎一次次把它和邻近基础拉回复习"以防万一"，
            还因前置被拉低而卡住下游。
          </p>
        </div>

        <div className="cmpcol glass">
          <div className="qmeta">
            <span className="pill good">明镜玻璃盒</span>
            <span className="pill accent">可见 · 可校正</span>
          </div>
          <Track steps={cmp.glassBox} />
          <div className="statline">
            <span className="bignum" style={{ color: 'var(--good)' }}>
              {cmp.glassBoxRedundant}
            </span>
            <span>/ 12 题在复习已掌握内容，其余全投向<b>真正的薄弱点</b></span>
          </div>
          <p className="hint" style={{ marginTop: 8, marginBottom: 0 }}>
            你在第 1 题标记「手滑」→ 引擎回调 {cmp.slipSkillShort}、移出复习队列 → 每一题都花在刀刃上。
          </p>
        </div>
      </div>

      <div className="savedbanner">
        同样 12 道题，玻璃盒把 <b>{cmp.saved} 道</b>从「复习你早会的内容」转投到真正的薄弱点——
        这个数字是<b>引擎算出来的</b>，不是写死的（改改上面的题库/真实水平会随之变化）。
        <br />
        <span style={{ color: 'var(--muted)' }}>
          增量价值 = 透明（你看得见它凭什么这么判）+ 可校正（一次误判不再连累整段学习路径）。
        </span>
      </div>

      <div className="footnote">
        指标定义：<code>无效操练题数</code> = 被喂到「你真实水平 ≥ 80%（早已掌握）」技能上的题数。
        两列共用 <code>src/logic/engine.ts</code> 的同一引擎与题库，唯一变量是「是否允许当场校正手滑」。
      </div>
    </div>
  );
}
