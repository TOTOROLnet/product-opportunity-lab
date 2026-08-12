import { useMemo, useRef, useState } from 'react';
import type { AgentRun, AttentionItem, Chapter } from '../types';
import {
  assumptionById,
  decisionChapterIds,
  looseEndById,
  orderedChapters,
  rawLogStep,
  selfEditById,
  topAttention,
} from '../logic/engine';
import { DiffView, kindMeta, PhaseTag } from './shared';

export default function CatchupTab({ run }: { run: AgentRun }) {
  const [onlyDecisions, setOnlyDecisions] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [evidenceOpen, setEvidenceOpen] = useState<Record<string, boolean>>({});
  const [flash, setFlash] = useState<string | null>(null);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const chapters = useMemo(() => orderedChapters(run), [run]);
  const decisionIds = useMemo(() => decisionChapterIds(run), [run]);
  const top = useMemo(() => topAttention(run), [run]);

  const shown = onlyDecisions
    ? chapters.filter((c) => decisionIds.has(c.id))
    : chapters;

  function toggleChapter(id: string) {
    setExpanded((e) => ({ ...e, [id]: !e[id] }));
  }

  function focusFromRail(item: AttentionItem) {
    const cid = item.chapterId;
    setExpanded((e) => ({ ...e, [cid]: true }));
    if (item.kind === 'assumption') {
      setEvidenceOpen((s) => ({ ...s, [item.refId]: true }));
    }
    setFlash(cid);
    window.setTimeout(() => {
      cardRefs.current[cid]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 30);
    window.setTimeout(() => setFlash((f) => (f === cid ? null : f)), 1600);
  }

  return (
    <div className="catchup">
      <div>
        <div className="toolbar">
          <div className="hint">
            按叙事顺序读下去，或点右侧「只盯这些」直达要拿主意的岔口。
          </div>
          <label className="toggle">
            <input
              type="checkbox"
              checked={onlyDecisions}
              onChange={(e) => setOnlyDecisions(e.target.checked)}
            />
            <span className="track" />
            只看需要我决定的
          </label>
        </div>

        {onlyDecisions && (
          <div className="decfilter-note">
            已折叠"只是过程"的章节（如纯读代码的「确认目标」），只保留带假设 /
            悬案 / 自我修订的 {shown.length} 章。
          </div>
        )}

        <div className="timeline">
          {shown.map((c) => (
            <div
              className="chapter"
              key={c.id}
              ref={(el) => (cardRefs.current[c.id] = el)}
            >
              <span className="node" style={{ color: nodeColor(c) }} />
              <ChapterCard
                run={run}
                chapter={c}
                open={!!expanded[c.id]}
                flash={flash === c.id}
                compact={onlyDecisions}
                evidenceOpen={evidenceOpen}
                onToggle={() => toggleChapter(c.id)}
                onToggleEvidence={(aid) =>
                  setEvidenceOpen((s) => ({ ...s, [aid]: !s[aid] }))
                }
              />
            </div>
          ))}
        </div>
      </div>

      <aside className="rail">
        <h3>只盯这些</h3>
        <div className="sub2">
          这一整趟里，真正需要你拿主意的 {top.length} 处（按"需要你决定"排序，非对错分）
        </div>
        {top.map((item) => (
          <button
            key={item.key}
            className={`attn ${kindMeta[item.kind].cls}`}
            onClick={() => focusFromRail(item)}
          >
            <div className="ak">{kindMeta[item.kind].label}</div>
            <div className="at">{stripPrefix(item.title)}</div>
          </button>
        ))}
        <div className="foot">
          随读只帮你把该看的顶出来——不打分、不放行、不替你判对错。点一条即跳到叙事中的对应位置。
        </div>
      </aside>
    </div>
  );
}

function nodeColor(c: Chapter): string {
  if (c.relatedLooseEndIds.length) return 'var(--loose)';
  if (c.relatedAssumptionIds.length) return 'var(--attention)';
  if (c.relatedSelfEditIds.length) return 'var(--self)';
  return 'var(--border)';
}

function stripPrefix(title: string): string {
  return title.replace(/^它替你假设：|^悬而未决：|^它给自己改了：/, '');
}

function ChapterCard(props: {
  run: AgentRun;
  chapter: Chapter;
  open: boolean;
  flash: boolean;
  compact: boolean;
  evidenceOpen: Record<string, boolean>;
  onToggle: () => void;
  onToggleEvidence: (aid: string) => void;
}) {
  const { run, chapter: c, open, flash, compact, evidenceOpen, onToggleEvidence } = props;

  const assumptions = c.relatedAssumptionIds
    .map((id) => assumptionById(run, id))
    .filter(Boolean);
  const looseEnds = c.relatedLooseEndIds
    .map((id) => looseEndById(run, id))
    .filter(Boolean);
  const selfEdits = c.relatedSelfEditIds
    .map((id) => selfEditById(run, id))
    .filter(Boolean);

  // compact（"只看需要我决定的"）模式：始终展开、只显示 callouts。
  const bodyOpen = compact || open;

  return (
    <div className={`card ${bodyOpen ? 'open' : ''} ${flash ? 'flash' : ''}`}>
      <div className="head" onClick={props.onToggle}>
        <PhaseTag phase={c.phase} />
        <div className="htext">
          <div className="ctitle">{c.title}</div>
          <div className="oneliner">{c.oneLiner}</div>
          <div className="metarow">
            {c.touchedFiles.length === 0 ? (
              <span className="tag">只读 · 未改文件</span>
            ) : (
              c.touchedFiles.map((f) => (
                <span className="tag file mono" key={f}>
                  {f}
                </span>
              ))
            )}
            <span className="tag">{c.durationMin} 分</span>
            {assumptions.length > 0 && (
              <span className="tag assume">假设 ×{assumptions.length}</span>
            )}
            {looseEnds.length > 0 && (
              <span className="tag loose">悬案 ×{looseEnds.length}</span>
            )}
            {selfEdits.length > 0 && (
              <span className="tag self">自改 ×{selfEdits.length}</span>
            )}
          </div>
        </div>
        {!compact && <span className="chev">▶</span>}
      </div>

      {bodyOpen && (
        <div className="body">
          {!compact && <div className="why">{c.why}</div>}

          {assumptions.map((a) => (
            <div className="callout assume" key={a!.id}>
              <div className="clabel">它替你做的假设（你可能不同意）</div>
              <div className="ctext">{a!.text}</div>
              <div className="crat">{a!.rationale}</div>
              <button className="evbtn" onClick={() => onToggleEvidence(a!.id)}>
                {evidenceOpen[a!.id] ? '收起依据' : '它凭哪一步这么假设？'}
              </button>
              {evidenceOpen[a!.id] && (
                <div className="evidence">
                  触发于原始日志第 <b>{a!.evidenceStep}</b> 步：
                  <span className="mono"> {rawLogStep(run, a!.evidenceStep)?.text}</span>
                </div>
              )}
            </div>
          ))}

          {looseEnds.map((l) => (
            <div className="callout loose" key={l!.id}>
              <div className="clabel">
                悬而未决
                <span className={`sev s${l!.severity}`}>严重度 {l!.severity}/3</span>
              </div>
              <div className="ctext">{l!.text}</div>
            </div>
          ))}

          {selfEdits.map((s) => (
            <div className="callout self" key={s!.id}>
              <div className="clabel">
                它给自己改了 · {s!.op === 'add' ? '新增' : '更新'} {s!.kind}「{s!.name}」
              </div>
              <div className="ctext">{s!.after}</div>
              <div className="crat">下次影响：{s!.futureImpact}</div>
            </div>
          ))}

          {!compact && c.diff.length > 0 && (
            <>
              <div className="sub">改动 diff</div>
              <DiffView diff={c.diff} />
            </>
          )}

          {!compact && c.tools.length > 0 && (
            <>
              <div className="sub">工具调用</div>
              <div className="tools">
                {c.tools.map((t, i) => (
                  <span className="toolpill mono" key={i}>
                    <b>{t.tool}</b> {t.arg}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
