import type { Bundle } from '../App';
import { FIXES } from '../data/rectify';
import { INTENTS } from '../data/intents';

const KIND_LABEL: Record<string, string> = {
  sharpen: '补齐语义', tighten: '收紧描述', guard: '确认闸', namespace: '命名空间', mixed: '组合',
};

function Cell({ lab, from, to, unit = '' }: { lab: string; from: number; to: number; unit?: string }) {
  return (
    <div className="cell">
      <div className="lab">{lab}</div>
      <div className="vals">
        <span className="from">{from}{unit}</span>
        <span className="arr">→</span>
        <span className="to">{to}{unit}</span>
      </div>
    </div>
  );
}

function opSummary(op: { toolId: string; removeTags?: string[]; addTags?: string[]; rename?: string; guard?: string[] }): string {
  const parts: string[] = [];
  if (op.removeTags?.length) parts.push(`去标签 [${op.removeTags.join(' ')}]`);
  if (op.addTags?.length) parts.push(`加标签 [${op.addTags.join(' ')}]`);
  if (op.guard?.length) parts.push(`加确认闸（需含 ${op.guard.join('/')}）`);
  if (op.rename) parts.push(`改名 → ${op.rename}`);
  return `${op.toolId}：${parts.join('；')}`;
}

export default function Rectify({ before, after }: { before: Bundle; after: Bundle }) {
  const intentText = (id?: string) => INTENTS.find((i) => i.id === id)?.text ?? '结构性修复';

  return (
    <div>
      <div className="panel">
        <p className="section-title">正名前 → 正名后（整片工具面）</p>
        <div className="ba">
          <Cell lab="对号率" from={Math.round(before.summary.matchRate * 100)} to={Math.round(after.summary.matchRate * 100)} unit="%" />
          <Cell lab="危险近邻" from={before.summary.dangerous} to={after.summary.dangerous} />
          <Cell lab="盲区" from={before.summary.blindspot} to={after.summary.blindspot} />
          <Cell lab="多义" from={before.summary.ambiguous} to={after.summary.ambiguous} />
          <Cell lab="命名冲突" from={before.collisions.length} to={after.collisions.length} />
        </div>
        <p className="hint" style={{ marginTop: 12 }}>
          顶部「应用正名」开关切到 ON，即可在<b>对号台</b>与<b>影子雷达</b>里看到同样的翻转。下面是每条正名提案做了什么。
        </p>
      </div>

      <div style={{ marginTop: 16 }}>
        {FIXES.map((f) => (
          <div key={f.id} className="fix">
            <div className="fhead">
              <span className="kind">{KIND_LABEL[f.kind] ?? f.kind}</span>
              <span className="ftitle">{f.title}</span>
            </div>
            <div className="hint" style={{ marginTop: 4 }}>针对意图：「{intentText(f.targetIntentId)}」</div>
            <div className="frow before"><span className="k">修前</span><span>{f.before}</span></div>
            <div className="frow after"><span className="k">修后</span><span>{f.after}</span></div>
            <div className="frow"><span className="k">操作</span>
              <span className="hint mono">{f.ops.map(opSummary).join(' ｜ ')}</span>
            </div>
            {f.persistAmbiguous && (
              <div className="persist">⚠ 命名空间只解决「名撞车」；两个追踪器语义等价，对号台仍标「多义」——正名不替你做业务选择，需团队指定首选。</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
