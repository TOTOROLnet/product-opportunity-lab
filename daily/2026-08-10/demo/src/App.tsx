import { useMemo, useState } from 'react';
import type { LabConfig } from './types';
import { TASKS } from './data/tasks';
import { MODELS } from './data/models';
import { HARDWARE } from './data/hardware';
import { buildMethodMatrix, buildPlan, computeVram, decide } from './logic/engine';
import ConfigPanel from './components/ConfigPanel';
import DecisionTab from './components/DecisionTab';
import VramTab from './components/VramTab';
import MethodTab from './components/MethodTab';

const DEFAULT_CONFIG: LabConfig = {
  taskId: 'refusal',
  modelId: 'mid-8b',
  hardwareId: 'rtx3050-4',
  data: { sizeBucket: 'medium', hasPreferencePairs: true, hasLabels: true, quality: 'ok' },
};

type TabId = 'decision' | 'vram' | 'method';

export default function App() {
  const [config, setConfig] = useState<LabConfig>(DEFAULT_CONFIG);
  const [tab, setTab] = useState<TabId>('decision');

  const task = TASKS.find((t) => t.id === config.taskId)!;
  const model = MODELS.find((m) => m.id === config.modelId)!;
  const hw = HARDWARE.find((h) => h.id === config.hardwareId)!;

  const decision = useMemo(() => decide(task, config.data, hw), [task, config.data, hw]);
  const budget = useMemo(() => computeVram(model, hw), [model, hw]);
  const matrix = useMemo(
    () => buildMethodMatrix(decision, config.data, hw),
    [decision, config.data, hw],
  );
  const plan = useMemo(
    () => buildPlan(decision, config.data, hw, budget),
    [decision, config.data, hw, budget],
  );

  return (
    <div className="app">
      <header className="hero">
        <span className="kicker">预调 · Pretune</span>
        <h1>
          在你敲 <span className="accent">train</span> 之前的飞行前副驾
        </h1>
        <p>
          本地后训练下沉到消费级硬件后，卡人的不再是"跑不跑得起来"，而是
          <b style={{ color: 'var(--text)' }}>「该不该调 · 塞不塞得下 · 该用哪种方法」</b>
          。预调是一层厂商中立、透明可审计的决策与显存可行性副驾——把黑箱工具替你悄悄做的决定，摊开给你看。
        </p>
        <div className="tags">
          <span className="pill">厂商中立（建议可落到 Soup / Unsloth / Axolotl）</span>
          <span className="pill">透明可审计</span>
          <span className="pill">训练之前，不跑训练</span>
          <span className="pill">纯前端 · 全 mock</span>
        </div>
      </header>

      <div className="disclaimer">
        <b>体验说明：</b>这是纯前端演示。决策为确定性规则、显存为
        <b> 透明公式估算（非任何厂商实测）</b>，全部数据为 mock；不接 LLM / 数据库 / 密钥 / 登录 / 支付 / 外部 API，也不真正读取 GPU 或运行训练。
      </div>

      <div className="layout">
        <ConfigPanel config={config} onChange={setConfig} />

        <div>
          <div className="tabs">
            <button className={`tab ${tab === 'decision' ? 'on' : ''}`} onClick={() => setTab('decision')}>
              <span className="num">1</span> 该不该调
            </button>
            <button className={`tab ${tab === 'vram' ? 'on' : ''}`} onClick={() => setTab('vram')}>
              <span className="num">2</span> 塞不塞得下
            </button>
            <button className={`tab ${tab === 'method' ? 'on' : ''}`} onClick={() => setTab('method')}>
              <span className="num">3</span> 怎么调
            </button>
          </div>

          <div className="card">
            {tab === 'decision' && <DecisionTab decision={decision} />}
            {tab === 'vram' && <VramTab budget={budget} />}
            {tab === 'method' && (
              <MethodTab matrix={matrix} plan={plan} method={decision.method} />
            )}
          </div>

          <p style={{ color: 'var(--text-faint)', fontSize: 12.5, marginTop: 14 }}>
            提示：改左侧任一配置（如把显存从 12GB 调到 4GB，或把「有成对偏好」关掉），三屏结论会实时联动——这正是"副驾"而非"静态说明书"的价值。
          </p>
        </div>
      </div>

      <footer className="footer">
        <div>
          <b>为什么不是照抄 Soup CLI：</b>Soup 是执行层（一条命令跑完训练）且黑箱自动决策；预调是
          训练<b> 之前 </b>的决策/预算层，透明、厂商中立、不跑训练。二者是互补的上下游，不是同一层的替代。
        </div>
        <div style={{ marginTop: 8 }}>
          灵感信号来自 product-hunt-radar 2026-08-10：Soup CLI（逐层流式 + NF4 把 8B 微调压进 4GB）与「后训练下沉到消费级硬件」趋势。报告中 3.32GB / 119.6 tok/s 等为官方自测、未独立核实，本 Demo 不复用其数字。
        </div>
      </footer>
    </div>
  );
}
