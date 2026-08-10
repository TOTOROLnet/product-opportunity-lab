import type { Verdict } from '../types';

export function VerdictBadge({ v }: { v: Verdict }) {
  const label = v === 'fits' ? '塞得下' : v === 'tight' ? '勉强（无余量）' : '塞不下 · OOM';
  return <span className={`badge ${v}`}>{label}</span>;
}

const PATH_COLORS: Record<string, { bg: string; fg: string; label: string }> = {
  PROMPT_RAG: { bg: 'rgba(242,182,76,0.16)', fg: '#f2b64c', label: '先别微调' },
  SFT_LORA: { bg: 'rgba(91,140,255,0.16)', fg: '#5b8cff', label: '监督微调' },
  PREF_ALIGN: { bg: 'rgba(139,92,246,0.18)', fg: '#a988ff', label: '偏好对齐' },
  DISTILL: { bg: 'rgba(53,197,138,0.16)', fg: '#35c58a', label: '知识蒸馏' },
};

export function PathBadge({ path }: { path: string }) {
  const c = PATH_COLORS[path] ?? PATH_COLORS.SFT_LORA;
  return (
    <span className="path-badge" style={{ background: c.bg, color: c.fg }}>
      ● {c.label}
    </span>
  );
}
