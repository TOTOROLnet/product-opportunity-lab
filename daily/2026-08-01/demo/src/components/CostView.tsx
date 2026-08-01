import type { Tier, WorkloadResult } from '../types';
import { fmtMultiplier } from '../logic/engine';
import { StackBar, Stat, TIER_META } from './shared';

const TIERS: Tier[] = ['native', 'mount', 'blocked'];

function costByTier(
  families: WorkloadResult['families'],
  key: 'baselineCost' | 'wasmCost',
) {
  return TIERS.map((tier) => ({
    tier,
    value: families
      .filter((f) => f.tier === tier)
      .reduce((s, f) => s + f[key], 0),
  }));
}

/** 生成一条代表性调用时间线：按调用占比分配 N 个格子，并均匀交错，让稀疏的 mount 尖峰错落分布。 */
function buildTimeline(result: WorkloadResult, N = 48) {
  const total = result.totalCalls || 1;
  // largest-remainder 分配格子数
  const raw = result.families.map((f) => ({
    tier: f.tier,
    coldMs: f.coldMs,
    exact: (f.calls / total) * N,
  }));
  const alloc = raw.map((r) => ({ ...r, n: Math.floor(r.exact) }));
  let used = alloc.reduce((s, a) => s + a.n, 0);
  const byRem = [...alloc].sort(
    (a, b) => b.exact - Math.floor(b.exact) - (a.exact - Math.floor(a.exact)),
  );
  for (let i = 0; used < N && i < byRem.length; i++, used++) byRem[i].n += 1;

  // 按「已发/目标」比例最小者出队，得到均匀交错序列
  const state = alloc
    .filter((a) => a.n > 0)
    .map((a) => ({ tier: a.tier, coldMs: a.coldMs, target: a.n, done: 0 }));
  const seq: { tier: Tier; coldMs: number }[] = [];
  const totalSlots = state.reduce((s, a) => s + a.target, 0);
  for (let i = 0; i < totalSlots; i++) {
    let pick = state[0];
    for (const s of state) {
      if (s.done >= s.target) continue;
      if (pick.done >= pick.target || s.done / s.target < pick.done / pick.target) pick = s;
    }
    pick.done += 1;
    seq.push({ tier: pick.tier, coldMs: pick.coldMs });
  }
  return seq;
}

export function CostView({ result }: { result: WorkloadResult }) {
  const max = Math.max(result.baselineTotal, result.wasmTotal);
  const savedPct = 1 - result.wasmTotal / result.baselineTotal;
  const worse = result.wasmTotal > result.baselineTotal;
  const timeline = buildTimeline(result);
  const barH = 90;

  return (
    <div className="view">
      <h3 className="section-title">成本 · before / after（按兼容分层堆叠）</h3>
      <div className="cost-compare">
        <div className="cost-line">
          <div className="cost-tag">旧 microVM 基线</div>
          <StackBar segments={costByTier(result.families, 'baselineCost')} max={max} />
          <div className="cost-total">{result.baselineTotal.toFixed(0)}</div>
        </div>
        <div className="cost-line">
          <div className="cost-tag">WASM 进程内运行时</div>
          <StackBar segments={costByTier(result.families, 'wasmCost')} max={max} />
          <div className="cost-total">{result.wasmTotal.toFixed(1)}</div>
        </div>
      </div>

      <div className="stat-row">
        <Stat
          label={worse ? '不降反升' : '成本下降'}
          value={worse ? `+${((result.wasmTotal / result.baselineTotal - 1) * 100).toFixed(0)}%` : `${(savedPct * 100).toFixed(1)}%`}
          sub={worse ? '迁过去反而更贵' : '相对旧 microVM 基线'}
          tone={worse ? 'bad' : 'good'}
        />
        <Stat label="真实倍数" value={fmtMultiplier(result.honestMultiplier)} sub="vs 头条 254×" />
        <Stat
          label="fallback 成本"
          value={`${(100 * (1 - costByTier(result.families, 'wasmCost')[0].value / result.wasmTotal)).toFixed(0)}%`}
          sub="WASM 账单里非 native 的份额"
          tone="warn"
        />
      </div>

      <div className="legend">
        {TIERS.map((t) => (
          <span key={t} className="legend-item">
            <i className={`dot ${TIER_META[t].cls}`} /> {TIER_META[t].label}
          </span>
        ))}
      </div>

      <h3 className="section-title">冷启动 P99 · 「按需 mount」把尾延迟又拉回沙箱</h3>
      <div className="stat-row">
        <Stat label="旧 microVM 冷启动" value={`${result.baselineColdP99} ms`} sub="每次都要 boot 一台 VM" />
        <Stat
          label="WASM 冷启动 P99"
          value={`${result.wasmColdP99} ms`}
          sub={result.wasmColdP99 > 100 ? '被 mount 尖峰拉回 ~850ms' : 'native 全程 ~9ms'}
          tone={result.wasmColdP99 > 100 ? 'warn' : 'good'}
        />
      </div>

      <h3 className="section-title">fallback 尖峰时间线 · 每格一次调用（高度 = 冷启动 ms）</h3>
      <svg className="timeline" viewBox={`0 0 ${timeline.length * 12} ${barH + 24}`} preserveAspectRatio="none">
        {timeline.map((c, i) => {
          const h = Math.max(2, (c.coldMs / 850) * barH);
          const color =
            c.tier === 'native' ? '#38d39f' : c.tier === 'mount' ? '#ffb454' : '#ff6b6b';
          return (
            <rect
              key={i}
              x={i * 12 + 2}
              y={barH - h + 6}
              width={8}
              height={h}
              rx={2}
              fill={color}
            >
              <title>{`${TIER_META[c.tier].label} · 冷启动 ${c.coldMs}ms`}</title>
            </rect>
          );
        })}
      </svg>
      <p className="note">
        绿色（native）几乎贴地（~9ms），高耸的橙色尖峰就是每次「按需 mount 真沙箱」的 ~850ms 冷启动。
        它们稀疏但致命：决定了你的 P99 尾延迟与真实成本，也是头条基准从不告诉你的部分。
      </p>
    </div>
  );
}
