import type { Decision } from '../types';
import { PathBadge } from './shared';

export default function DecisionTab({ decision }: { decision: Decision }) {
  const confLabel =
    decision.confidence === 'high' ? '高' : decision.confidence === 'medium' ? '中' : '低';
  return (
    <div>
      <p className="h-note">
        <b>该不该微调？</b> 副驾先回答这个最容易被跳过、却最烧钱的问题——把"该不该调、走哪条路"的推理{' '}
        <b>显性化</b>，而不是像黑箱工具那样替你悄悄决定。
      </p>

      <div className="verdict-card">
        <PathBadge path={decision.path} />
        <h3>{decision.headline}</h3>
        <div className="conf">
          推荐方法：<b style={{ color: 'var(--text)' }}>{decision.method}</b> · 结论置信度：{confLabel}
        </div>
        <ul className="reasons">
          {decision.reasons.map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ul>
      </div>

      <div className="grid-2">
        <div className="mini">
          <h4>结论会在什么情况下改变（敏感度）</h4>
          <ul>
            {decision.sensitivity.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
        <div className="mini warn">
          <h4>如果选错方法的代价</h4>
          <ul>
            <li>{decision.wrongChoiceCost}</li>
          </ul>
        </div>
      </div>

      <details className="disclosure">
        <summary>这份判断是怎么来的？（透明、可审计 —— 与黑箱自动化的关键区别）</summary>
        <div className="formula">
{`决策优先级（纯规则，无 LLM、无随机）：
1. 需求是"新鲜/私有事实知识"        → 先别微调，用 RAG
2. 数据量 tiny(<~50)               → 先别微调，用 few-shot / prompt
3. 任务是"大模型→小模型"           → 蒸馏
4. 任务是"偏好/行为对齐":
     有成对偏好 + 低显存(<=6GB)     → SimPO（免参考模型，省显存）
     有成对偏好 + 显存宽裕          → ORPO（单阶段）
     只有二元 好/坏 标签            → KTO
     无任何偏好信号                → 先收集偏好数据，暂用 prompt
5. 其余(格式/风格/抽取) + 有标注    → SFT-LoRA
6. 其余 + 无标注                    → 先补数据 / 用 prompt

厂商中立：给出的是"用哪类方法"，你可落到 Soup / Unsloth / Axolotl 任意后端。`}
        </div>
      </details>
    </div>
  );
}
