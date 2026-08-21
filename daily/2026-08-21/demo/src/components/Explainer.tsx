import { Card } from './ui';
import { TYPE_ICON, TYPE_LABEL } from '../labels';
import type { ItemType } from '../types';

const TAXONOMY: { type: ItemType; risk: string; note: string }[] = [
  { type: 'user_constraint', risk: '最高', note: '丢了会违约、翻车。压缩最该保住的东西。' },
  { type: 'decision', risk: '高', note: '丢了会重新纠结已定方案，来回绕路。' },
  { type: 'error_learned', risk: '高', note: '丢了会二次踩同一个坑。' },
  { type: 'file_ref', risk: '看情况', note: '活跃工作面要留；已弃用文件可安全淡出。' },
  { type: 'todo', risk: '中', note: '未完成的要留个提醒；已完成的可丢。' },
  { type: 'chatter', risk: '低', note: '过程闲聊，丢了通常最安全。' },
];

export function Explainer({ onStart }: { onStart: () => void }) {
  return (
    <div className="explainer">
      <Card className="hero">
        <div className="hero__kicker">买方侧 · 厂商中立 · 纯前端 mock 演示</div>
        <h1 className="hero__title">
          你的 Agent 又<span className="hl">忘了</span>你的要求？
          <br />
          问题可能出在<span className="hl">上下文压缩</span>那一步。
        </h1>
        <p className="hero__lead">
          长程 Agent 跑到一半，上下文会膨胀。为了降本提速，模型 / harness 会把长会话
          <b>静默压缩</b>成一段摘要——这一步默默替你决定了「什么留、什么扔」。 扔错一条
          <b>硬约束</b>或<b>已定决策</b>，Agent 会在几十步后「忘了自己答应过什么」而跑偏，代价是<b>整段返工</b>。
        </p>
        <p className="hero__lead">
          <b>留痕 Liúhén</b> 站在压缩这一步<b>之上</b>，把每一次压缩变成可读的
          <b>「折叠差异」</b>（压缩前 vs 压缩后，逐条分类 + 风险标注）， 让你维护一份
          <b>「保命清单」</b>规定压缩时必须保留哪些条目，再用<b>回放</b>证明：钉住它，就不会跑偏。
        </p>
        <button className="btn btn--primary hero__cta" onClick={onStart}>
          进入折叠台，看这次压缩扔了什么 →
        </button>
      </Card>

      <div className="explainer__grid">
        <Card>
          <h3 className="card__h">压缩为什么会让 Agent 跑偏？</h3>
          <ol className="steps">
            <li>
              <b>看不见</b>：压缩是黑盒——你不知道它把哪条硬约束/决策折叠没了。
            </li>
            <li>
              <b>有代价的遗忘</b>：丢一条「绝不改 public API 签名」，几十步后 Agent 顺手改了签名。
            </li>
            <li>
              <b>难归因</b>：跑偏时你只看到结果错了，很难倒查到「是第 N-1 步压缩丢的」。
            </li>
          </ol>
        </Card>

        <Card>
          <h3 className="card__h">留痕做了什么不一样？</h3>
          <ul className="ticks">
            <li>把「一次压缩」拆成 before/after 的<b>折叠差异</b>，逐条给出保留 / 有损 / 丢弃。</li>
            <li>给被丢弃项<b>分类 + 风险标注</b>，把高危丢弃一眼挑出来。</li>
            <li>
              提供<b>保命清单（pin）</b>这个<b>控制</b>动作——不只是看，还能规定「这条压缩时必须留」。
            </li>
            <li>
              用<b>回放</b>把「丢了 X → 第 N 步跑偏 → 失败」的因果讲清，并对比钉住后的结局。
            </li>
          </ul>
        </Card>
      </div>

      <Card>
        <h3 className="card__h">上下文条目的风险分类法（taxonomy）</h3>
        <div className="taxo">
          {TAXONOMY.map((t) => (
            <div key={t.type} className="taxo__row">
              <span className="taxo__ico">{TYPE_ICON[t.type]}</span>
              <span className="taxo__name">{TYPE_LABEL[t.type]}</span>
              <span className={`taxo__risk taxo__risk--${t.risk === '最高' || t.risk === '高' ? 'high' : t.risk === '中' ? 'mid' : 'low'}`}>
                丢弃风险：{t.risk}
              </span>
              <span className="taxo__note">{t.note}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card className="notclone">
        <h3 className="card__h">留痕不是什么（诚实边界）</h3>
        <ul className="ticks ticks--muted">
          <li>
            <b>不是 Grok 4.6 那样的模型</b>：模型是<b>产出</b>压缩的一方；留痕站在其上、厂商中立，替使用方<b>审计与控制</b>压缩。
          </li>
          <li>
            <b>不是通用 trace / token 看板</b>（Langfuse/Helicone 类）：只聚焦「压缩这一步」，做 before/after 差异 + 风险标注 + 保命清单<b>控制</b>。
          </li>
          <li>
            <b>不是记忆库信任闸</b>：不在「回忆持久记忆」时打分，而是审计「单次长运行内、压缩折叠掉了什么」。
          </li>
          <li>
            <b>不真跑模型/后端</b>：这是确定性 mock 引擎的演示，数据与轨迹均为虚构。
          </li>
        </ul>
      </Card>
    </div>
  );
}
