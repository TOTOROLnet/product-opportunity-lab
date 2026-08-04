// 参数化 SVG 骨架（正面视角）。深度→下蹲高低；内扣→膝盖内收；phase 0..1 = 站→蹲。
// 这是「模拟体验」：真实产品由端侧姿态估计给出关节点，Demo 用参数化姿态可视化替代。

interface SkeletonProps {
  depth: number; // 0..100
  valgus: number; // 0..40
  phase: number; // 0..1
  color: string;
  seen: boolean;
  visLabel?: string;
}

export default function Skeleton({ depth, valgus, phase, color, seen, visLabel }: SkeletonProps) {
  const ankleL = { x: 78, y: 250 };
  const ankleR = { x: 122, y: 250 };

  const sink = phase * (depth / 100) * 70;
  const hipY = 150 + sink;
  const hipL = { x: 90, y: hipY };
  const hipR = { x: 110, y: hipY };
  const hipMid = { x: 100, y: hipY };

  const shoulderY = hipY - 60;
  const shL = { x: 82, y: shoulderY };
  const shR = { x: 118, y: shoulderY };
  const shMid = { x: 100, y: shoulderY };

  const headC = { x: 100, y: shoulderY - 26 };

  const kneeY = 205 - phase * 8;
  const valShift = phase * (valgus / 40) * 34;
  const kneeL = { x: 76 + valShift, y: kneeY };
  const kneeR = { x: 124 - valShift, y: kneeY };

  const handL = { x: 66, y: shoulderY + 30 + phase * 10 };
  const handR = { x: 134, y: shoulderY + 30 + phase * 10 };

  const line = (a: { x: number; y: number }, b: { x: number; y: number }, key: string, w = 7) => (
    <line key={key} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={color} strokeWidth={w} strokeLinecap="round" />
  );

  return (
    <svg viewBox="0 0 200 280" className="skeleton" role="img" aria-label="动作骨架">
      {/* 地面 */}
      <line x1="30" y1="252" x2="170" y2="252" stroke="var(--line)" strokeWidth="2" />
      <g opacity={seen ? 1 : 0.28} strokeDasharray={seen ? undefined : '5 6'}>
        {/* 躯干 / 髋 / 肩 */}
        {line(shMid, hipMid, 'spine', 8)}
        {line(shL, shR, 'shoulders')}
        {line(hipL, hipR, 'hips')}
        {/* 大腿 / 小腿 */}
        {line(hipL, kneeL, 'thighL')}
        {line(hipR, kneeR, 'thighR')}
        {line(kneeL, ankleL, 'shinL')}
        {line(kneeR, ankleR, 'shinR')}
        {/* 手臂 */}
        {line(shL, handL, 'armL', 6)}
        {line(shR, handR, 'armR', 6)}
        {/* 关节点 */}
        {[hipL, hipR, kneeL, kneeR, ankleL, ankleR, shL, shR].map((p, i) => (
          <circle key={'j' + i} cx={p.x} cy={p.y} r={4.2} fill={color} />
        ))}
        {/* 头 */}
        <circle cx={headC.x} cy={headC.y} r={12} fill="none" stroke={color} strokeWidth={7} />
      </g>

      {!seen && (
        <g>
          <circle cx="100" cy="130" r="30" fill="none" stroke="var(--amber)" strokeWidth="3" strokeDasharray="4 6" />
          <text x="100" y="142" textAnchor="middle" fontSize="34" fontWeight="800" fill="var(--amber)">
            ?
          </text>
          {visLabel && (
            <text x="100" y="182" textAnchor="middle" fontSize="13" fill="var(--amber)">
              {visLabel}
            </text>
          )}
        </g>
      )}
    </svg>
  );
}
