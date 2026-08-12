import { useState } from 'react';
import type { AgentRun } from '../types';
import { orderedChapters, summarize } from '../logic/engine';

export default function CompareTab({ run }: { run: AgentRun }) {
  const [showRaw, setShowRaw] = useState(false);
  const s = summarize(run);
  const chapters = orderedChapters(run);

  const maxMin = Math.max(s.rawReadMin, s.catchupMin) || 1;

  return (
    <div>
      <div className="lead">
        同一趟运行，两种"接手方式"的读懂成本对比。左边是你平时面对的原始素材（
        {s.steps} 步工具日志 + {s.files} 个文件的 diff），右边是随读的叙事。用时为
        <b>透明启发式估算</b>，非玄学分数——公式见下。
      </div>

      <div className="timebars">
        <div className="timebar raw">
          <div className="big">≈ {s.rawReadMin} 分</div>
          <div className="cap">逐行爬原始日志 + diff，自己重建来龙去脉</div>
          <div className="bar">
            <span style={{ width: `${(s.rawReadMin / maxMin) * 100}%` }} />
          </div>
          <div className="formula mono">
            {s.steps}步×15s + {s.files}文件×40s + {s.lines}净增删×2s ={' '}
            {s.rawReadSec}s
          </div>
        </div>
        <div className="timebar sd">
          <div className="big">≈ {s.catchupMin} 分</div>
          <div className="cap">读随读的叙事时间线 + 只盯这些</div>
          <div className="bar">
            <span style={{ width: `${(s.catchupMin / maxMin) * 100}%` }} />
          </div>
          <div className="formula mono">
            {s.chapters}章×20s + 3个只盯这些×20s = {s.catchupSec}s
          </div>
        </div>
      </div>

      <div className="saved">
        接手同一趟运行，随读把读懂成本从 ≈{s.rawReadMin} 分压到 ≈{s.catchupMin} 分，
        <b> 省下约 {s.savedMin} 分钟</b>——而且更不容易漏掉埋在日志中间的 {s.assumptions} 个假设、
        {s.looseEnds} 个悬案与 {s.selfEdits} 处自我修订。
      </div>

      <div className="split">
        <div className="pane raw">
          <div className="ph">
            <span>原始素材（{s.steps} 步日志）</span>
            <small>你平时打开的样子 · 需自己重建叙事</small>
          </div>
          <div className="rawlog mono">
            {run.rawLog.map((l) => (
              <div className="ln" key={l.step}>
                <span className="st">{l.step}</span>
                <span className="tl">{l.tool}</span>
                <span className="tx">{l.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="pane sd">
          <div className="ph">
            <span>随读的叙事（{s.chapters} 章）</span>
            <small>已重建来龙去脉 · 顶出该你决定的处</small>
          </div>
          <div className="sdlist">
            {chapters.map((c) => (
              <div className="sdrow" key={c.id}>
                <div className="sdphase">{c.phase}</div>
                <div className="sdtitle">{c.title}</div>
                <div className="sdline">{c.oneLiner}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="foldnote">
        <button
          className="markbtn"
          onClick={() => setShowRaw((v) => !v)}
          style={{ marginBottom: 8 }}
        >
          {showRaw ? '收起说明' : '随读会不会藏信息？'}
        </button>
        {showRaw && (
          <div style={{ maxWidth: 720, margin: '0 auto' }}>
            不会。左侧原始 {s.steps} 步日志一直在这里可查；叙事里的每一句都能一键展开到它所依据的原始步骤 /
            diff（见「补看」页的假设「它凭哪一步这么假设？」）。随读做的是<b>减法与叙事</b>，
            不是丢信息——可追溯性正是它区别于"扁平会话摘要"的地方。
          </div>
        )}
      </div>
    </div>
  );
}
