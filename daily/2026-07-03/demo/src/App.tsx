import { useMemo, useState } from 'react';
import { scenario } from './data/scenario';
import { computeRisk } from './logic/scoring';
import type { Policy } from './types';
import RiskBanner from './components/RiskBanner';
import CapabilityGraph from './components/CapabilityGraph';
import Inspector from './components/Inspector';
import RiskPaths from './components/RiskPaths';
import PolicySimulator from './components/PolicySimulator';

type Tab = 'graph' | 'paths' | 'policy';

const TABS: { id: Tab; label: string }[] = [
  { id: 'graph', label: '能力图' },
  { id: 'paths', label: '风险链路' },
  { id: 'policy', label: '策略模拟器' },
];

export default function App() {
  const [policies, setPolicies] = useState<Record<string, Policy>>({
    ...scenario.defaultPolicies,
  });
  const [firewalls, setFirewalls] = useState<Record<string, boolean>>({
    ...scenario.defaultFirewalls,
  });
  const [tab, setTab] = useState<Tab>('graph');
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);

  const baseline = useMemo(
    () => computeRisk(scenario, scenario.defaultPolicies, scenario.defaultFirewalls),
    [],
  );
  const result = useMemo(
    () => computeRisk(scenario, policies, firewalls),
    [policies, firewalls],
  );

  const nodeObj = scenario.nodes.find((n) => n.id === selectedNode) ?? null;
  // 若选中的链路已被策略切断，则不在图上聚焦它。
  const focusPathId =
    selectedPath && result.paths.find((p) => p.id === selectedPath)?.active
      ? selectedPath
      : null;

  function setPolicy(toolId: string, policy: Policy) {
    setPolicies((prev) => ({ ...prev, [toolId]: policy }));
  }
  function toggleFirewall(ruleId: string) {
    setFirewalls((prev) => ({ ...prev, [ruleId]: !prev[ruleId] }));
  }
  function reset() {
    setPolicies({ ...scenario.defaultPolicies });
    setFirewalls({ ...scenario.defaultFirewalls });
  }

  return (
    <div className="app">
      <header className="masthead">
        <div className="brand">
          <div className="logo">⚡</div>
          <div>
            <h1>Fusebox</h1>
            <p className="tagline">
              Agent 能力「配电箱」：把授予的一堆工具/MCP 权限画成能力图，自动发现
              <b> 单看安全、组合起来高危 </b>的涌现链路，并在<b>部署前</b>模拟收敛。
            </p>
          </div>
        </div>
        <div className="agent-chip">
          正在分析：<b>{scenario.agentName}</b>
          <br />
          {scenario.agentDesc}
        </div>
      </header>

      <RiskBanner result={result} baseline={baseline} />

      <nav className="tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`tab ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {tab === 'graph' && (
        <div className="split">
          <div className="card">
            <h3>
              能力图 · {scenario.agentName}
              {focusPathId ? '（已聚焦选中链路）' : '（红/黄线 = 组合出的高危链路）'}
            </h3>
            <CapabilityGraph
              nodes={scenario.nodes}
              edges={scenario.edges}
              activePaths={result.activePaths}
              focusPathId={focusPathId}
              selectedNode={selectedNode}
              onSelectNode={setSelectedNode}
            />
          </div>
          <Inspector node={nodeObj} policies={policies} />
        </div>
      )}

      {tab === 'paths' && (
        <RiskPaths
          result={result}
          selectedPath={selectedPath}
          onSelectPath={setSelectedPath}
          onFocusInGraph={() => setTab('graph')}
        />
      )}

      {tab === 'policy' && (
        <PolicySimulator
          scenario={scenario}
          policies={policies}
          firewalls={firewalls}
          result={result}
          baseline={baseline}
          onSetPolicy={setPolicy}
          onToggleFirewall={toggleFirewall}
          onReset={reset}
        />
      )}

      <footer className="footer">
        <b>这是什么：</b>Fusebox 把"审批"从<b>逐动作、运行时</b>提前到"能力面、部署前"——
        风险来自权限的<b>组合</b>（读敏感数据 + 能外发 = 数据外泄；无护栏写库 = 破坏性且不可逆），
        逐工具的三态开关永远暴露不出这一层。
        <br />
        <b>增量价值（vs 报告中的产品）：</b>不同于 Basedash 逐动作展示 payload 审批、Retrace 事后重放轨迹，
        Fusebox 面向<b>权限集合的组合</b>做爆炸半径 / 可逆性量化，并支持部署前的策略 before/after 模拟。
        <br />
        <b>演示声明：</b>全部为纯前端 mock 拓扑 + 显式评分规则，不接任何真实后端 / 数据库 / 支付 / MCP / API /
        凭证；评分仅用于展示"组合风险"这一思路，不代表任何真实产品的安全结论。
      </footer>
    </div>
  );
}
