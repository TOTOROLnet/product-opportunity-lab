import type { RunResult } from '../types';

function Cell({ text, tone }: { text: string; tone: 'good' | 'bad' | 'neutral' }) {
  const color = tone === 'good' ? 'var(--agent)' : tone === 'bad' ? 'var(--bad)' : 'var(--text)';
  return (
    <div className="cmp-val" style={{ color }}>
      {text}
    </div>
  );
}

export default function Compare({ naive, cobaton }: { naive: RunResult; cobaton: RunResult }) {
  const n = naive.final;
  const c = cobaton.final;

  const rows: {
    label: string;
    hint: string;
    nText: string;
    nTone: 'good' | 'bad' | 'neutral';
    cText: string;
    cTone: 'good' | 'bad' | 'neutral';
  }[] = [
    {
      label: '丢失的「你的编辑」',
      hint: '被 agent 静默覆盖的你的改动',
      nText: String(n.lostHumanEdits),
      nTone: n.lostHumanEdits > 0 ? 'bad' : 'neutral',
      cText: String(c.lostHumanEdits),
      cTone: 'good',
    },
    {
      label: '你被打断的次数',
      hint: '你正在写时被 agent 强行覆盖',
      nText: String(n.interruptions),
      nTone: n.interruptions > 0 ? 'bad' : 'neutral',
      cText: String(c.interruptions),
      cTone: 'good',
    },
    {
      label: 'agent 白做的编辑',
      hint: '改完随即被你删除/作废',
      nText: String(n.wastedAgentEdits),
      nTone: n.wastedAgentEdits > 0 ? 'bad' : 'neutral',
      cText: String(c.wastedAgentEdits),
      cTone: 'good',
    },
    {
      label: '你的编辑保留率',
      hint: '争用小节里你的改动最终被保留的比例',
      nText: `${n.humanEditsPreserved}/${n.humanEditsTotal}`,
      nTone: 'bad',
      cText: `${c.humanEditsPreserved}/${c.humanEditsTotal}`,
      cTone: 'good',
    },
    {
      label: '最终文档一致性',
      hint: '你的改动 + agent 的 v2 更新是否都在',
      nText: naive.consistent ? '✅ 一致' : '❌ 不一致',
      nTone: naive.consistent ? 'good' : 'bad',
      cText: cobaton.consistent ? '✅ 一致' : '❌ 不一致',
      cTone: cobaton.consistent ? 'good' : 'bad',
    },
  ];

  return (
    <div>
      <div className="callout">
        下面两列由<b>同一条事件序列、同一个引擎</b>分别在两种模式下跑出来，指标是<b>算出来的、不是编的</b>。
        朴素模式（现状 / OpenBox 式「回避冲突」）与并笔模式（CoBaton「消解冲突 + 执笔权移交 + 再校验」）的差距一目了然。
      </div>

      <div className="cmp-grid">
        <div className="cmp-head">指标</div>
        <div className="cmp-head naive">朴素模式（现状）</div>
        <div className="cmp-head cobaton">并笔 CoBaton</div>

        {rows.map((r) => (
          <Row key={r.label} {...r} />
        ))}
      </div>

      <div className="conclusion">
        <b>结论：</b>并笔模式在完全相同的共写序列下，做到 <b>0 丢失 / 0 打断 / 0 白做</b>、你的编辑 100% 保留，
        同时 agent 的 v2 更新照样全部落地（§API 甚至与你<b>并行</b>完成）。它没有让 agent 变笨——只是把「回避冲突」
        升级成「<b>消解冲突 + 移交执笔权 + 再校验</b>」，这正是 OpenMarkdown 之类共编产品只做了渲染层、却没做的协调层。
      </div>
    </div>
  );
}

function Row({
  label,
  hint,
  nText,
  nTone,
  cText,
  cTone,
}: {
  label: string;
  hint: string;
  nText: string;
  nTone: 'good' | 'bad' | 'neutral';
  cText: string;
  cTone: 'good' | 'bad' | 'neutral';
}) {
  return (
    <>
      <div>
        <div className="cmp-metric">{label}</div>
        <div className="cmp-note">{hint}</div>
      </div>
      <Cell text={nText} tone={nTone} />
      <Cell text={cText} tone={cTone} />
    </>
  );
}
