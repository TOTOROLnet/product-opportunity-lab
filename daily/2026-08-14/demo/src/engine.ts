import type { Shot, DirectorNote, ShotStatus, DiffToken, Regen } from './types';

// ---------------------------------------------------------------------------
// 「导演引擎」——脚本化、确定性、可解释的镜头改写。
//
// 这是一个 mock 引擎：它不调用任何 LLM / 视频生成模型 / 外部 API，
// 而是用一组明确的规则模拟「按导演意图重生成一个镜头」，并产出
// tracked-changes 式的 diff（删除铺垫词 / 插入冲击开场 / 高亮强调短语）
// 与逐条「改了什么、为什么」的说明，避免黑盒。
//
// 真实产品里，这一层会把导演意图翻译成对上游生成 agent 的镜头级重生成指令；
// Demo 用确定性规则演示「理想形态」。（详见 README 的诚实声明。）
// ---------------------------------------------------------------------------

interface Mark {
  start: number;
  end: number;
  kind: 'del' | 'emph';
}

/** 判断某条说戏是否包含有效改稿意图（锁定除外） */
export function hasEdit(note: DirectorNote): boolean {
  return (
    note.text.trim() !== '' ||
    note.pace === 'fast' ||
    note.pace === 'slow' ||
    note.energyDelta !== 0 ||
    note.emphasize ||
    note.tone !== ''
  );
}

export function statusOf(note: DirectorNote): ShotStatus {
  if (note.locked) return 'locked';
  if (hasEdit(note)) return 'toRevise';
  return 'untouched';
}

function overlaps(marks: Mark[], start: number, end: number): boolean {
  return marks.some((m) => start < m.end && end > m.start);
}

/** 把原文按 marks（删除/强调）切成 token，并在首尾插入 add token */
function buildTokens(
  script: string,
  marks: Mark[],
  addPrefix: string,
  addSuffix: string,
): DiffToken[] {
  const sorted = [...marks].sort((a, b) => a.start - b.start);
  const tokens: DiffToken[] = [];
  if (addPrefix) tokens.push({ text: addPrefix, kind: 'add' });

  let cursor = 0;
  for (const m of sorted) {
    if (m.start < cursor) continue; // 跳过重叠标记
    if (m.start > cursor) tokens.push({ text: script.slice(cursor, m.start), kind: 'same' });
    tokens.push({ text: script.slice(m.start, m.end), kind: m.kind });
    cursor = m.end;
  }
  if (cursor < script.length) tokens.push({ text: script.slice(cursor), kind: 'same' });

  if (addSuffix) tokens.push({ text: addSuffix, kind: 'add' });
  return tokens;
}

function stripDeletions(script: string, marks: Mark[]): string {
  const dels = marks.filter((m) => m.kind === 'del').sort((a, b) => a.start - b.start);
  let out = '';
  let cursor = 0;
  for (const m of dels) {
    if (m.start < cursor) continue;
    out += script.slice(cursor, m.start);
    cursor = m.end;
  }
  out += script.slice(cursor);
  return out;
}

/** 对单个镜头执行「重生成」。仅当 status==='toRevise' 时调用；locked/untouched 走保留路径。 */
export function regenerate(shot: Shot, note: DirectorNote): Regen {
  const text = note.text;
  const wantTighten = note.pace === 'fast' || /(短|快|砍|精简|啰嗦|删|收紧|铺垫)/.test(text);
  const wantSlow = note.pace === 'slow' || /(慢|放慢|留白|舒缓)/.test(text);
  const wantPunch =
    note.energyDelta > 0 || /(钩子|冲突|抓|带劲|有劲|狠|紧迫|直接|强一点|抢眼)/.test(text);
  const wantSoft = note.energyDelta < 0 || /(温和|克制|平和|降一点|柔)/.test(text);
  const wantEmph = note.emphasize || /(强调|突出|加粗)/.test(text);

  const rationale: string[] = [];
  const marks: Mark[] = [];
  let addPrefix = '';
  let addSuffix = '';
  let pace = shot.pace;
  let energy = shot.energy;
  let duration = shot.durationSec;

  if (wantTighten) {
    for (const f of shot.fillers) {
      let idx = shot.script.indexOf(f);
      while (idx >= 0) {
        if (!overlaps(marks, idx, idx + f.length)) marks.push({ start: idx, end: idx + f.length, kind: 'del' });
        idx = shot.script.indexOf(f, idx + f.length);
      }
    }
    pace = 'fast';
    duration = Math.max(2, Math.round(shot.durationSec * 0.6));
    rationale.push(`节奏收紧：剪掉铺垫/缓冲词（划掉部分），时长 ${shot.durationSec}s → ${duration}s`);
  }

  if (wantSlow) {
    pace = 'slow';
    duration = Math.round(shot.durationSec * 1.3);
    rationale.push(`节奏放慢：加停顿留白，时长 ${shot.durationSec}s → ${duration}s`);
  }

  if (wantPunch) {
    const delta = note.energyDelta > 0 ? note.energyDelta : 1;
    energy = Math.min(5, shot.energy + delta);
    addPrefix = shot.hookPrefix;
    addSuffix = '！';
    rationale.push(`情绪加强：加冲击开场「${shot.hookPrefix}」并收束为感叹，情绪 ${shot.energy} → ${energy}`);
  }

  if (wantSoft) {
    energy = Math.max(1, shot.energy - 1);
    rationale.push(`情绪降调：更克制内敛，情绪 ${shot.energy} → ${energy}`);
  }

  if (wantEmph && shot.keyPhrase) {
    const idx = shot.script.indexOf(shot.keyPhrase);
    if (idx >= 0 && !overlaps(marks, idx, idx + shot.keyPhrase.length)) {
      marks.push({ start: idx, end: idx + shot.keyPhrase.length, kind: 'emph' });
      rationale.push(`强调：突出关键短语「${shot.keyPhrase}」`);
    }
  }

  if (note.tone) rationale.push(`语气：整体调成「${note.tone}」`);
  if (text.trim()) rationale.push(`按你的说戏：${text.trim()}`);
  if (rationale.length === 0) rationale.push('（未给出有效说戏，镜头保持原样）');

  const tokens = buildTokens(shot.script, marks, addPrefix, addSuffix);
  const script = addPrefix + stripDeletions(shot.script, marks) + addSuffix;

  return { tokens, rationale, result: { script, pace, energy, durationSec: duration } };
}

/** 应用改稿后，某镜头的最终文案/元数据（locked & untouched 逐字保留原样） */
export function effectiveShot(shot: Shot, note: DirectorNote): Shot {
  if (statusOf(note) !== 'toRevise') return shot;
  const r = regenerate(shot, note);
  return { ...shot, script: r.result.script, pace: r.result.pace, energy: r.result.energy, durationSec: r.result.durationSec };
}
