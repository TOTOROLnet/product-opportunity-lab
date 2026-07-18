import type { ModelState } from '../types';
import { SKILLS, SKILL_BY_ID } from '../data/skills';
import { isMastered } from '../logic/engine';

// 掌握度 → 颜色（红→琥珀→绿）。
export function masteryColor(m: number): string {
  const hue = 8 + m * 130; // 8(红) → 138(绿)
  return `hsl(${hue}, 68%, 52%)`;
}

export function pct(x: number): string {
  return `${Math.round(x * 100)}%`;
}

export function MasteryBar({ mastery }: { mastery: number }) {
  return (
    <div className="bar" title={`掌握度 ${pct(mastery)}`}>
      <span style={{ width: pct(mastery), background: masteryColor(mastery) }} />
    </div>
  );
}

// ---- 技能图谱布局（SVG，坐标固定，无需测量 DOM）----
const VB_W = 720;
const VB_H = 332;
const NODE_W = 104;
const NODE_H = 44;

// 分层坐标：中心点 (x, y)
const POS: Record<string, { x: number; y: number }> = {
  select: { x: 360, y: 42 },
  where: { x: 165, y: 130 },
  orderby: { x: 360, y: 130 },
  aggregate: { x: 555, y: 130 },
  join: { x: 130, y: 220 },
  groupby: { x: 330, y: 220 },
  subquery: { x: 545, y: 220 },
  window: { x: 300, y: 298 },
};

interface GraphProps {
  model: ModelState;
  highlightId?: string | null;
  selectedId?: string | null;
  onSelect?: (skillId: string) => void;
}

export function SkillGraph({ model, highlightId, selectedId, onSelect }: GraphProps) {
  const edges: { from: string; to: string }[] = [];
  for (const s of SKILLS) {
    for (const p of s.prereqs) edges.push({ from: p, to: s.id });
  }

  return (
    <div className="graphwrap">
      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        width="100%"
        style={{ minWidth: 560, display: 'block' }}
        role="img"
        aria-label="SQL 技能图谱：节点颜色代表 AI 估计的掌握度"
      >
        <defs>
          <marker
            id="arrow"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M0,0 L10,5 L0,10 z" fill="rgba(255,255,255,0.28)" />
          </marker>
        </defs>

        {edges.map((e, i) => {
          const a = POS[e.from];
          const b = POS[e.to];
          return (
            <line
              key={i}
              x1={a.x}
              y1={a.y + NODE_H / 2}
              x2={b.x}
              y2={b.y - NODE_H / 2 - 3}
              stroke="rgba(255,255,255,0.16)"
              strokeWidth={1.5}
              markerEnd="url(#arrow)"
            />
          );
        })}

        {SKILLS.map((s) => {
          const st = model[s.id];
          const p = POS[s.id];
          const fill = masteryColor(st.mastery);
          const isSel = selectedId === s.id;
          const isHi = highlightId === s.id;
          const mastered = isMastered(st);
          return (
            <g
              key={s.id}
              className="gnode"
              transform={`translate(${p.x - NODE_W / 2}, ${p.y - NODE_H / 2})`}
              onClick={onSelect ? () => onSelect(s.id) : undefined}
            >
              {isHi && (
                <rect
                  x={-4}
                  y={-4}
                  width={NODE_W + 8}
                  height={NODE_H + 8}
                  rx={13}
                  fill="none"
                  stroke="#22d3ee"
                  strokeWidth={2.5}
                  opacity={0.9}
                />
              )}
              <rect
                width={NODE_W}
                height={NODE_H}
                rx={10}
                fill="rgba(20,24,50,0.92)"
                stroke={isSel ? '#7c6bff' : 'rgba(255,255,255,0.18)'}
                strokeWidth={isSel ? 2.4 : 1.2}
              />
              {/* 掌握度条 */}
              <rect x={10} y={30} width={NODE_W - 20} height={6} rx={3} fill="rgba(255,255,255,0.1)" />
              <rect
                x={10}
                y={30}
                width={(NODE_W - 20) * st.mastery}
                height={6}
                rx={3}
                fill={fill}
              />
              <text x={11} y={17} fill="#eef0fb" fontSize={12.5} fontWeight={700}>
                {s.short}
              </text>
              <text x={NODE_W - 11} y={17} fill={fill} fontSize={11.5} fontWeight={700} textAnchor="end">
                {pct(st.mastery)}
              </text>
              {mastered && (
                <text x={NODE_W - 11} y={44} fill="#34d399" fontSize={9.5} textAnchor="end">
                  已掌握
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <div className="legend">
        <span>
          <span className="sw" style={{ background: masteryColor(0.15) }} />低掌握
        </span>
        <span>
          <span className="sw" style={{ background: masteryColor(0.55) }} />中
        </span>
        <span>
          <span className="sw" style={{ background: masteryColor(0.9) }} />高掌握
        </span>
        <span>箭头 = 前置依赖（先会下游才好学上游）</span>
      </div>
    </div>
  );
}

export function skillName(id: string): string {
  return SKILL_BY_ID[id]?.name ?? id;
}
