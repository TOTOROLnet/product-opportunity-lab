import type { IntentCard } from '../types';

// 预置的「新任务意图卡」——供一键切换，体验不同检索结果。
// 用户也可以在检索台里增删环境指纹 chips，实时改变匹配。
export const INTENT_CARDS: IntentCard[] = [
  {
    id: 'intent-deploy-next-cf',
    title: '部署 Next.js 到 Cloudflare 边缘',
    intent: '把当前 Next.js 项目部署到 Cloudflare 边缘，要求边缘冷启动可接受',
    keywords: ['部署', 'deploy', 'nextjs', 'next', 'cloudflare', 'edge', '边缘'],
    fingerprint: [
      { key: '框架', value: 'Next.js' },
      { key: '平台', value: 'Cloudflare' },
      { key: '语言', value: 'TypeScript' },
      { key: '目标', value: '部署' },
    ],
  },
  {
    id: 'intent-fix-flaky-pw',
    title: '修一条 flaky 的 Playwright 用例',
    intent: '一条 Playwright 端到端用例偶发失败，要找出根因并稳定它',
    keywords: ['修测试', 'flaky', '偶发', 'playwright', 'e2e', '端到端'],
    fingerprint: [
      { key: '工具', value: 'Playwright' },
      { key: '语言', value: 'TypeScript' },
      { key: '目标', value: '修测试' },
    ],
  },
  {
    id: 'intent-stripe-webhook',
    title: '本地接上并验证 Stripe webhook',
    intent: '在本地沙箱接上 Stripe webhook 并验签，不接真实资金',
    keywords: ['接第三方', 'stripe', 'webhook', '沙箱', 'sandbox', '验签'],
    fingerprint: [
      { key: '工具', value: 'Stripe' },
      { key: '语言', value: 'Node' },
      { key: '目标', value: '接第三方' },
    ],
  },
  {
    id: 'intent-postgres',
    title: '给 serverless 服务接上 Postgres',
    intent: '在 serverless 环境接 Postgres，避免连接数被打爆',
    keywords: ['接数据库', 'postgres', 'pg', '连接池', 'serverless'],
    fingerprint: [
      { key: '工具', value: 'Postgres' },
      { key: '语言', value: 'Node' },
      { key: '目标', value: '接数据库' },
    ],
  },
  {
    id: 'intent-esm',
    title: '把一个 CJS 包迁移到 ESM',
    intent: '把一个 CommonJS 包迁移到 ESM，处理 __dirname 与扩展名',
    keywords: ['迁移', 'esm', 'commonjs', 'cjs', 'module'],
    fingerprint: [
      { key: '语言', value: 'TypeScript' },
      { key: '目标', value: '迁移' },
    ],
  },
];
