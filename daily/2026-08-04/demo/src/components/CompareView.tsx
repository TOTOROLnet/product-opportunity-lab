import { useMemo } from 'react';
import { analyzeSession, coachCompare } from '../logic/engine';
import { FEATURED, VIS_LABEL } from '../data/sessions';
import type { RepResult } from '../types';
import { C, StatChip, cx } from './shared';

interface Cell {
  key: number;
  color: string;
  glyph: string;
  title: string;
  dim?: boolean;
  ring?: string;
}

function pleaserCell(r: RepResult): Cell {
  if (!r.seen) {
    return { key: r.idx, color: C.stop, glyph: '!', title: `#${r.idx} ${VIS_LABEL[r.input.visibility]}：看不清却自信喊纠 = 盲纠（受伤风险），还照数` };
  }
  return { key: r.idx, color: C.good, glyph: '✓', title: `#${r.idx} 一律「great job」，照数（含硬撑）` };
}

function yoshuCell(r: RepResult): Cell {
  if (!r.seen) {
    return { key: r.idx, color: C.unseen, glyph: '?', title: `#${r.idx} ${VIS_LABEL[r.input.visibility]}：看不清，明说、不计数、不瞎纠` };
  }
  if (r.afterStop) {
    return { key: r.idx, color: C.unseen, glyph: '×', title: `#${r.idx} 喊停后硬撑，不计入`, dim: true };
  }
  if (r.isStop) {
    return { key: r.idx, color: C.stop, glyph: '■', title: `#${r.idx} 疲劳、动作垮 → 喊停`, ring: C.stop };
  }
  if (r.verdict === 'good') return { key: r.idx, color: C.good, glyph: '✓', title: `#${r.idx} 看清且达标，计入` };
  return { key: r.idx, color: C.fix, glyph: '△', title: `#${r.idx} 看清但需调整（${r.why ?? ''}），计入并提醒` };
}

function Strip({ cells }: { cells: Cell[] }) {
  return (
    <div className="strip">
      {cells.map((c) => (
        <div
          key={c.key}
          className={cx('strip-cell', c.dim && 'strip-dim')}
          style={{ background: c.color + '22', color: c.color, boxShadow: c.ring ? `0 0 0 2px ${c.ring} inset` : undefined }}
          title={c.title}
        >
          <span className="sc-glyph">{c.glyph}</span>
          <span className="sc-idx">{c.key}</span>
        </div>
      ))}
    </div>
  );
}

export default function CompareView() {
  const S = useMemo(() => analyzeSession(FEATURED), []);
  const cmp = useMemo(() => coachCompare(S), [S]);
  const pleaserCells = S.reps.map(pleaserCell);
  const yoshuCells = S.reps.map(yoshuCell);

  return (
    <div>
      <div className="card">
        <div className="view-head">
          <div>
            <h2>同一组训练，两种教练</h2>
            <p className="muted small">{S.label}：一样的 12 次深蹲（含 3 次镜头看不清、后半段疲劳掉深度），看两种教练分别怎么处理每一下。</p>
          </div>
        </div>
        <div className="strip-legend small muted">
          <span><b style={{ color: C.good }}>✓</b> 达标计入</span>
          <span><b style={{ color: C.fix }}>△</b> 提醒计入</span>
          <span><b style={{ color: C.unseen }}>?</b> 看不清未计</span>
          <span><b style={{ color: C.stop }}>■</b> 喊停</span>
          <span><b style={{ color: C.unseen }}>×</b> 硬撑未计</span>
          <span><b style={{ color: C.stop }}>!</b> 盲纠（受伤风险）</span>
        </div>
      </div>

      <div className="compare-cols">
        <div className="card coach-col col-pleaser">
          <div className="col-head">
            <span className="col-badge bad">讨好型教练</span>
            <span className="muted small">数满 · 一律夸 · 从不喊停</span>
          </div>
          <Strip cells={pleaserCells} />
          <div className="col-stats">
            <StatChip label="报给你的次数" value={cmp.pleaser.counted} color={C.fix} sub="全数进去" />
            <StatChip label="看不清却硬纠" value={cmp.pleaser.blindCorrections} color={C.stop} sub="受伤风险" />
            <StatChip label="是否喊停" value="否" color={C.stop} sub="练到力竭" />
            <StatChip label="声称达标" value={cmp.pleaser.claimedGood} color={C.fix} sub="含没看清/硬撑的" />
          </div>
          <p className="col-note">短期最爽：12/12「great job」。代价是——3 次它其实没看清也照喊纠正（可能教你错误发力），还把硬撑的垃圾次数算成进步。</p>
        </div>

        <div className="card coach-col col-yoshu">
          <div className="col-head">
            <span className="col-badge good">有数</span>
            <span className="muted small">看得见才教 · 只认可信 · 疲劳喊停</span>
          </div>
          <Strip cells={yoshuCells} />
          <div className="col-stats">
            <StatChip label="可信计数" value={cmp.yoshu.counted} color={C.good} sub={`达标 ${cmp.yoshu.verifiedGood}·提醒 ${S.countedFix}`} />
            <StatChip label="盲纠" value={cmp.yoshu.blindCorrections} color={C.good} sub="看不清就明说" />
            <StatChip label="喊停" value={`第 ${cmp.yoshu.stoppedAt} 次`} color={C.stop} sub="动作垮就停" />
            <StatChip label="如实未计" value={cmp.yoshu.refusedUnseen + cmp.yoshu.overexertionSkipped} color={C.unseen} sub={`看不清 ${cmp.yoshu.refusedUnseen}·硬撑 ${cmp.yoshu.overexertionSkipped}`} />
          </div>
          <p className="col-note">短期没那么爽，但每一个「达标」它都真看清了、敢担保；看不清就说看不清、绝不瞎纠；第 {cmp.yoshu.stoppedAt} 次动作垮了就喊停，不把你练伤、也不让你把水分当进步。</p>
        </div>
      </div>

      <div className="card verdict-strip">
        <b>差别不在功能多少，在「值不值得信」。</b>
        讨好型把「教练在场感」最大化（数得满、夸得勤）；有数把「教练值得信」最大化——它宁可少数几个、承认看不清、也不给你一个假的「标准！」。
        在健身这种「一次错误发力就可能受伤」的场景，可信度才是留存与口碑的真护城河。
      </div>
    </div>
  );
}
