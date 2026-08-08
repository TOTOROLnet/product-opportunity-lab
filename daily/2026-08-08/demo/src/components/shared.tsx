import type { ClaimKind, ClaimStatus, Severity } from '../types';

export const STATUS_LABEL: Record<ClaimStatus, string> = {
  aligned: '对齐',
  stale: '漂移',
  conflict: '冲突',
  unverifiable: '无法验证',
};

const STATUS_CLASS: Record<ClaimStatus, string> = {
  aligned: 'st-aligned',
  stale: 'st-drifted',
  conflict: 'st-invalid',
  unverifiable: 'st-unverif',
};

const STATUS_ICON: Record<ClaimStatus, string> = {
  aligned: '✓',
  stale: '⚠',
  conflict: '✗',
  unverifiable: '?',
};

export const KIND_LABEL: Record<ClaimKind, string> = {
  install: '安装',
  test: '测试',
  build: '构建',
  dev: '本地开发',
  runtime: '运行时',
  pkgmgr: '包管理器',
  env: '环境变量',
  lint: 'Lint',
  db: '数据库',
};

const SEV_LABEL: Record<Severity, string> = {
  high: '高',
  medium: '中',
  low: '低',
  none: '—',
};

const SEV_CLASS: Record<Severity, string> = {
  high: 'sev-high',
  medium: 'sev-medium',
  low: 'sev-low',
  none: 'sev-none',
};

export function StatusPill({ status }: { status: ClaimStatus }) {
  return (
    <span className={`pill ${STATUS_CLASS[status]}`}>
      {STATUS_ICON[status]} {STATUS_LABEL[status]}
    </span>
  );
}

export function SeverityTag({ severity }: { severity: Severity }) {
  if (severity === 'none') return null;
  return <span className={`tag ${SEV_CLASS[severity]}`}>严重度 {SEV_LABEL[severity]}</span>;
}

export function healthTone(health: number): 'good' | 'warn' | 'bad' {
  if (health >= 85) return 'good';
  if (health >= 60) return 'warn';
  return 'bad';
}

export function HealthScore({
  health,
  problemCount,
}: {
  health: number;
  problemCount: number;
}) {
  const tone = healthTone(health);
  return (
    <div className={`health health-${tone}`}>
      <div className="health-num">
        {health}
        <span className="health-max">/100</span>
      </div>
      <div className="health-side">
        <div className="health-label">契约健康分</div>
        <div className="health-bar">
          <i style={{ width: `${health}%` }} />
        </div>
        <div className="health-note">
          {problemCount === 0 ? '全部声明已对齐真值' : `${problemCount} 条声明仍需对表`}
        </div>
      </div>
    </div>
  );
}

export function Stat({
  value,
  label,
  tone,
}: {
  value: number | string;
  label: string;
  tone: 'good' | 'warn' | 'bad' | 'neutral';
}) {
  return (
    <div className={`stat stat-${tone}`}>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}
