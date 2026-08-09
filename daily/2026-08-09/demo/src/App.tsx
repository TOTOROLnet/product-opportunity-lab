import { useMemo, useState } from 'react';
import { TOOLS } from './data/tools';
import { INTENTS } from './data/intents';
import { FIXES } from './data/rectify';
import {
  analyzeAll, summarize, applyFixes, nameCollisions, overlapClusters,
  type IntentResult, type Summary, type NameCollision, type Cluster,
} from './logic/engine';
import Bench from './components/Bench';
import Radar from './components/Radar';
import Rectify from './components/Rectify';

export interface Bundle {
  results: IntentResult[];
  summary: Summary;
  collisions: NameCollision[];
  clusters: Cluster[];
}

function buildBundle(tools: typeof TOOLS): Bundle {
  const results = analyzeAll(INTENTS, tools);
  return {
    results,
    summary: summarize(results),
    collisions: nameCollisions(tools),
    clusters: overlapClusters(tools),
  };
}

type Tab = 'bench' | 'radar' | 'rectify';

export default function App() {
  const [rectified, setRectified] = useState(false);
  const [tab, setTab] = useState<Tab>('bench');

  const before = useMemo(() => buildBundle(TOOLS), []);
  const after = useMemo(() => buildBundle(applyFixes(TOOLS, FIXES)), []);
  const cur = rectified ? after : before;
  const s = cur.summary;

  return (
    <div className="wrap">
      <div className="masthead">
        <div className="brand">
          <h1>正名<span className="en">Zhèngmíng · Tool-Surface Disambiguator</span></h1>
          <p>
            坐在 MCP 网关 / lazy-discovery meta-tool 层<b>之上</b>、厂商中立、只读的一层：给一片聚合后的工具面 +
            一组真实意图，模拟 Agent 会检索/选中哪个工具，把「多义 / 危险近邻 / 盲区」变成可见、可一键正名的一等公民。
            <br />
            <span className="hint">名不正则言不顺——先把工具的名与述正了，Agent 才对得上号。</span>
          </p>
        </div>
        <div className="toggle-card">
          <div className="toggle-row" onClick={() => setRectified((v) => !v)}>
            <span className={`switch${rectified ? ' on' : ''}`} />
            <span className="toggle-label">{rectified ? '已应用正名' : '应用正名'}</span>
          </div>
          <div className="toggle-sub">
            {rectified ? '当前展示：消歧后的工具面' : '当前展示：朴素 lazy-discovery（未消歧）'}
          </div>
        </div>
      </div>

      <div className="strip">
        <div className="stat rate"><span className="n">{Math.round(s.matchRate * 100)}%</span><span className="l">对号率</span></div>
        <div className="stat u"><span className="n">{s.unique}</span><span className="l">唯一正确</span></div>
        <div className="stat a"><span className="n">{s.ambiguous}</span><span className="l">多义</span></div>
        <div className="stat d"><span className="n">{s.dangerous}</span><span className="l">危险近邻</span></div>
        <div className="stat b"><span className="n">{s.blindspot}</span><span className="l">盲区</span></div>
        <div className="stat"><span className="n">{TOOLS.length}</span><span className="l">聚合工具</span></div>
        <div className="stat"><span className="n">{INTENTS.length}</span><span className="l">意图</span></div>
      </div>

      <div className="tabs">
        <button className={`tab${tab === 'bench' ? ' active' : ''}`} onClick={() => setTab('bench')}>对号台</button>
        <button className={`tab${tab === 'radar' ? ' active' : ''}`} onClick={() => setTab('radar')}>影子雷达</button>
        <button className={`tab${tab === 'rectify' ? ' active' : ''}`} onClick={() => setTab('rectify')}>正名修复</button>
      </div>

      {tab === 'bench' && <Bench results={cur.results} />}
      {tab === 'radar' && <Radar cur={cur} before={before} after={after} rectified={rectified} />}
      {tab === 'rectify' && <Rectify before={before} after={after} />}

      <div className="disclaimer">
        说明：本 Demo 用<b>确定性关键词/标签打分</b>模拟 lazy-discovery 检索器，工具面与意图集<b>全为 mock</b>，
        用于演示「网关之上的意图↔工具消歧」这一创新切入点。真实产品需贴合各网关的 embedding/排序策略、
        并从真实调用轨迹里挖意图——不夸大与真实检索的一致性。<b>不聚合、不代理、不省 token、不管密钥</b>，
        与 Toolport（MCP 网关）机制本质不同，非照抄。
      </div>

      <div className="foot">
        正名 Zhèngmíng · product-opportunity-lab / 2026-08-09 · 纯前端静态 Demo（Vite + React + TS）·
        无后端 / LLM / 数据库 / 登录 / 支付 / 外部 API · rev.1
      </div>
    </div>
  );
}
