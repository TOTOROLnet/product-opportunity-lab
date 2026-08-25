import type { FingerprintKey } from '../types';

export function ScoreRing({ score }: { score: number }) {
  const r = 22;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score)) / 100;
  const dash = c * pct;
  const color = score >= 60 ? 'var(--amber)' : score >= 30 ? 'var(--peri)' : 'var(--muted-2)';
  return (
    <svg className="ring" viewBox="0 0 54 54" aria-label={`匹配 ${score} 分`}>
      <circle cx="27" cy="27" r={r} fill="none" stroke="var(--border)" strokeWidth="5" />
      <circle
        cx="27"
        cy="27"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${c}`}
        transform="rotate(-90 27 27)"
      />
      <text x="27" y="30" textAnchor="middle" fontSize="15" fontWeight="800" fill="var(--text)">
        {score}
      </text>
    </svg>
  );
}

export const FP_KEYS: FingerprintKey[] = ['框架', '平台', '语言', '目标', '工具'];

// 供「加指纹」下拉的常见取值建议（可自由输入其他值）。
export const FP_SUGGEST: Record<FingerprintKey, string[]> = {
  框架: ['Next.js', 'React', 'Astro', 'Vue'],
  平台: ['Cloudflare', 'Vercel', 'AWS', 'Fly.io'],
  语言: ['TypeScript', 'JavaScript', 'Node', 'Python'],
  目标: ['部署', '修测试', '接第三方', '接数据库', '迁移', '接运行时', '配样式'],
  工具: ['Playwright', 'Cypress', 'Stripe', 'Postgres', 'Tailwind'],
};
