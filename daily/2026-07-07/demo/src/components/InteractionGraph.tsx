import { useMemo } from 'react';
import type { DiagnosisResult, Participant, RunEvent } from '../types';

interface Props {
  participants: Participant[];
  activeEvents: RunEvent[];
  result: DiagnosisResult;
}

const W = 560;
const H = 300;
const R = 108;

function nodePos(i: number, total: number): { x: number; y: number } {
  if (total === 1) return { x: W / 2, y: H / 2 };
  const angle = (i / total) * Math.PI * 2 - Math.PI / 2;
  return { x: W / 2 + R * Math.cos(angle), y: H / 2 + R * Math.sin(angle) };
}

const ROLE_LABEL: Record<Participant['role'], string> = {
  planner: 'PLANNER',
  coder: 'CODER',
  reviewer: 'REVIEWER',
  observer: 'OBSERVER',
  tool: 'TOOL',
};

export function InteractionGraph({ participants, activeEvents, result }: Props) {
  const pos = useMemo(() => {
    const m = new Map<string, { x: number; y: number }>();
    participants.forEach((p, i) => m.set(p.id, nodePos(i, participants.length)));
    return m;
  }, [participants]);

  // 参与致命病灶的 agent → 红色
  const badAgents = useMemo(() => {
    const s = new Set<string>();
    for (const d of result.detections) {
      if (d.severity === 'critical') for (const a of d.agents) s.add(a);
    }
    return s;
  }, [result]);

  // 去重后的交互边（有 to 的事件）
  const edges = useMemo(() => {
    const seen = new Map<string, { from: string; to: string }>();
    for (const e of activeEvents) {
      if (e.to && e.from !== e.to) {
        seen.set(`${e.from}>${e.to}`, { from: e.from, to: e.to });
      }
    }
    return Array.from(seen.values());
  }, [activeEvents]);

  const lastEvent = activeEvents[activeEvents.length - 1];
  const lastEdgeKey = lastEvent?.to ? `${lastEvent.from}>${lastEvent.to}` : '';

  // 最近活动的节点（脉冲）
  const activeNode = lastEvent?.from;

  return (
    <div className="graph-wrap">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Agent 交互图">
        <defs>
          <marker
            id="arrow"
            markerWidth="8"
            markerHeight="8"
            refX="7"
            refY="4"
            orient="auto"
          >
            <path d="M0,0 L8,4 L0,8 Z" fill="#4a5a80" />
          </marker>
        </defs>

        {edges.map((e) => {
          const a = pos.get(e.from);
          const b = pos.get(e.to);
          if (!a || !b) return null;
          const key = `${e.from}>${e.to}`;
          const bad = badAgents.has(e.from) && badAgents.has(e.to);
          const recent = key === lastEdgeKey;
          const cls = bad ? 'edge bad' : recent ? 'edge recent' : 'edge';
          // 稍微收缩端点，避免盖住节点圆
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const len = Math.hypot(dx, dy) || 1;
          const ax = a.x + (dx / len) * 26;
          const ay = a.y + (dy / len) * 26;
          const bx = b.x - (dx / len) * 30;
          const by = b.y - (dy / len) * 30;
          return (
            <line
              key={key}
              className={cls}
              x1={ax}
              y1={ay}
              x2={bx}
              y2={by}
              markerEnd={bad || recent ? undefined : 'url(#arrow)'}
            />
          );
        })}

        {participants.map((p) => {
          const c = pos.get(p.id);
          if (!c) return null;
          const bad = badAgents.has(p.id);
          const isActive = p.id === activeNode;
          const fill = `hsl(${p.hue} 55% 22%)`;
          const stroke = bad ? 'var(--crit)' : `hsl(${p.hue} 70% 62%)`;
          return (
            <g key={p.id}>
              {isActive && (
                <circle cx={c.x} cy={c.y} r={30} fill="none" stroke={stroke} opacity={0.35}>
                  <animate
                    attributeName="r"
                    values="22;34;22"
                    dur="1.4s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="0.5;0;0.5"
                    dur="1.4s"
                    repeatCount="indefinite"
                  />
                </circle>
              )}
              <circle
                cx={c.x}
                cy={c.y}
                r={22}
                fill={fill}
                stroke={stroke}
                strokeWidth={bad ? 3 : 2}
              />
              <text className="node-label" x={c.x} y={c.y + 4} textAnchor="middle">
                {p.name}
              </text>
              <text className="node-role" x={c.x} y={c.y + 40} textAnchor="middle">
                {ROLE_LABEL[p.role]}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
