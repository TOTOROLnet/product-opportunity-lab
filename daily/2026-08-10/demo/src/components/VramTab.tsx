import { useEffect, useRef, useState } from 'react';
import type { VramBudget } from '../types';
import { VerdictBadge } from './shared';

function Bar({
  name,
  valGB,
  maxGB,
  vramGB,
  color,
}: {
  name: string;
  valGB: number;
  maxGB: number;
  vramGB: number;
  color: 'blue' | 'purple' | 'green';
}) {
  const pct = Math.min(100, (valGB / maxGB) * 100);
  const vramPct = Math.min(100, (vramGB / maxGB) * 100);
  return (
    <div className="bar-row">
      <div className="bar-label">
        <span className="name">{name}</span>
        <span className="val">
          峰值 ≈ {valGB} GB · <VerdictBadge v={valGB <= vramGB * 0.85 ? 'fits' : valGB <= vramGB ? 'tight' : 'oom'} />
        </span>
      </div>
      <div className="track">
        <div className={`fill ${color}`} style={{ width: `${pct}%` }} />
        <div className="vram-line" style={{ left: `${vramPct}%` }}>
          <span>你的显存 {vramGB}GB</span>
        </div>
      </div>
    </div>
  );
}

export default function VramTab({ budget }: { budget: VramBudget }) {
  const maxGB = Math.max(budget.residentFp16PeakGB, budget.vramGB) * 1.08;

  // 逐层流式动画
  const [active, setActive] = useState(-1);
  const [done, setDone] = useState<number>(0);
  const timer = useRef<number | null>(null);

  const play = () => {
    if (timer.current) window.clearInterval(timer.current);
    setDone(0);
    setActive(0);
    let i = 0;
    timer.current = window.setInterval(() => {
      i += 1;
      if (i >= budget.layers) {
        setActive(-1);
        setDone(budget.layers);
        if (timer.current) window.clearInterval(timer.current);
        return;
      }
      setActive(i);
      setDone(i);
    }, 60);
  };

  useEffect(() => {
    play();
    return () => {
      if (timer.current) window.clearInterval(timer.current);
    };
    // 配置变化时重放
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [budget.layers, budget.paramsB, budget.vramGB]);

  return (
    <div>
      <p className="h-note">
        <b>这张卡塞不塞得下？</b> 逐层流式的核心洞察是：训练峰值显存可以由 <b>"一层缓冲"</b> 界定，而非整模型。
        下面对比三种策略，红线是你选的显存上限。
      </p>

      <div className="bars">
        <Bar
          name="常驻 · fp16（不量化，全模型驻显存）"
          valGB={budget.residentFp16PeakGB}
          maxGB={maxGB}
          vramGB={budget.vramGB}
          color="blue"
        />
        <Bar
          name="常驻 · NF4 4-bit（QLoRA 式，全模型驻显存）"
          valGB={budget.residentNf4PeakGB}
          maxGB={maxGB}
          vramGB={budget.vramGB}
          color="purple"
        />
        <Bar
          name="逐层流式 + NF4（峰值由一层缓冲界定）"
          valGB={budget.streamNf4PeakGB}
          maxGB={maxGB}
          vramGB={budget.vramGB}
          color="green"
        />
      </div>

      <div className="grid-2" style={{ marginTop: 18 }}>
        <div className="mini">
          <h4>逐层流式在做什么（{budget.layers} 层动画）</h4>
          <div className="layers">
            {Array.from({ length: budget.layers }).map((_, i) => (
              <div
                key={i}
                className={
                  'layer-cell' + (i === active ? ' active' : i < done ? ' done' : '')
                }
              />
            ))}
          </div>
          <p style={{ color: 'var(--text-dim)', fontSize: 12.5, margin: '8px 0 0' }}>
            冻结基座放在内存/NVMe，训练时按需把<b style={{ color: 'var(--text)' }}>单个 decoder 层</b>拷进一小块
            VRAM 缓冲（当前层 + 预取，共 {budget.streamBufferLayers} 层）。峰值显存 ≈ 一层缓冲 + 激活 + 开销，
            与整模型大小 <b style={{ color: 'var(--text)' }}>解耦</b>。
          </p>
          <button className="btn ghost" style={{ marginTop: 10 }} onClick={play}>
            ▷ 重放逐层流式
          </button>
        </div>

        <div className="mini">
          <h4>结论 · 时间 ↔ 显存的取舍</h4>
          <ul>
            <li>
              常驻(NF4) 峰值 ≈ <b style={{ color: 'var(--text)' }}>{budget.residentNf4PeakGB}GB</b>：{' '}
              <VerdictBadge v={budget.verdictResidentNf4} />
            </li>
            <li>
              逐层流式 峰值 ≈ <b style={{ color: 'var(--text)' }}>{budget.streamNf4PeakGB}GB</b>：{' '}
              <VerdictBadge v={budget.verdictStreamNf4} />
            </li>
            <li>
              交叉点：显存 ≥ <b style={{ color: 'var(--text)' }}>~{budget.crossoverVramGB}GB</b> 时，常驻更快、不必流式；
              低于它，才用逐层流式<b style={{ color: 'var(--text)' }}>以时间换显存</b>（层读取约有 1.5× 开销）。
            </li>
          </ul>
        </div>
      </div>

      <details className="disclosure">
        <summary>显存是怎么算的？（透明公式 —— 教学级估算，非厂商实测）</summary>
        <div className="formula">
{`模型：${budget.paramsB}B 参数 · ${budget.layers} 层 · hidden ${budget.hidden}

字节/参数：fp16 = 2，NF4 4-bit = 0.5
激活(activations) ≈ (hidden/4096) × (seq/1024) × batch × 1.1GB = ${budget.activationsGB}GB
固定开销(框架+上下文) = ${budget.overheadGB}GB
LoRA 适配器+优化器状态 = ${budget.loraStateGB}GB

常驻 fp16 权重  = ${budget.paramsB} × 2   = ${budget.weightsResidentFp16GB}GB
常驻 NF4 权重   = ${budget.paramsB} × 0.5 = ${budget.weightsResidentNf4GB}GB
单层 NF4 权重   = ${budget.weightsResidentNf4GB} / ${budget.layers} = ${budget.perLayerNf4GB}GB
流式层缓冲      = 单层 × ${budget.streamBufferLayers} = ${budget.weightsStreamGB}GB

峰值 = 权重(按策略) + 激活 + 开销 + LoRA
  常驻fp16 = ${budget.residentFp16PeakGB}GB
  常驻NF4  = ${budget.residentNf4PeakGB}GB
  逐层流式 = ${budget.streamNf4PeakGB}GB   ← 峰值与整模型大小解耦

判定：peak ≤ 显存×0.85 → 塞得下；≤ 显存 → 勉强；> 显存 → OOM
※ 这是可解释的估算，用于"动手前"判断可行性；不等于任何厂商的实测数字。`}
        </div>
      </details>
    </div>
  );
}
