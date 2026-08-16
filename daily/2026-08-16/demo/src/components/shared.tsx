import type { Action, Decision } from '../types';
import { CAT_LABEL, DATA_LABEL, DEC_EMOJI, DEC_LABEL, SCOPE_LABEL } from '../labels';

export function DecisionPill({ decision }: { decision: Decision }) {
  return (
    <span className={`pill pill-${decision}`}>
      {DEC_EMOJI[decision]} {DEC_LABEL[decision]}
    </span>
  );
}

export function ScopeTag({ scope }: { scope: Action['scope'] }) {
  return <span className={`tag scope-${scope}`}>{SCOPE_LABEL[scope]}</span>;
}

export function DataTag({ dataClass }: { dataClass: Action['dataClass'] }) {
  if (dataClass === 'none') return <span className="tag tag-muted">无数据</span>;
  return <span className={`tag data-${dataClass}`}>{DATA_LABEL[dataClass]}</span>;
}

export function ReversibleTag({ reversible }: { reversible: boolean }) {
  return reversible ? (
    <span className="tag tag-ok">↩ 可逆</span>
  ) : (
    <span className="tag tag-danger">⚠ 不可逆</span>
  );
}

export function RiskDots({ value }: { value: number }) {
  return (
    <span className="risk" title={`基础风险 ${value}/5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= value ? 'dot on' : 'dot'} />
      ))}
    </span>
  );
}

export function ActionMeta({ action }: { action: Action }) {
  return (
    <div className="meta-row">
      <span className="tag tag-cat">{CAT_LABEL[action.category]}</span>
      <ScopeTag scope={action.scope} />
      <ReversibleTag reversible={action.reversible} />
      <DataTag dataClass={action.dataClass} />
      <span className="tag tag-muted">
        风险 <RiskDots value={action.riskBase} />
      </span>
    </div>
  );
}

export function Delta({ value, goodWhenNegative = true }: { value: number; goodWhenNegative?: boolean }) {
  if (value === 0) return <span className="delta zero">±0</span>;
  const isGood = goodWhenNegative ? value < 0 : value > 0;
  const sign = value > 0 ? '+' : '';
  return <span className={isGood ? 'delta good' : 'delta bad'}>{`${sign}${value}`}</span>;
}
