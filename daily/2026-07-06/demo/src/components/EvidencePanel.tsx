import type {
  Criterion,
  EvidencePayload,
  HttpEvidence,
  LogEvidence,
  ScreenshotEvidence,
  TestEvidence,
} from '../types';
import { transitionOf, TRANSITION_META } from '../logic/verdict';
import { FakeScreenshot } from './FakeScreenshot';

const TYPE_LABEL: Record<string, string> = {
  screenshot: '截图',
  http: 'HTTP trace',
  log: '日志',
  test: '测试结果',
};

export function EvidencePanel({ criterion }: { criterion: Criterion | null }) {
  if (!criterion) {
    return (
      <div className="evidence empty">
        <p className="hint">← 点击左侧任意验收标准，查看它在「基线 vs 当前」两次 run 中的证据 delta。</p>
      </div>
    );
  }

  const t = transitionOf(criterion);
  const meta = TRANSITION_META[t];

  return (
    <div className="evidence">
      <div className="evidence-head">
        <div>
          <div className="evidence-type">{TYPE_LABEL[criterion.evidenceType]} 证据</div>
          <h3>{criterion.text}</h3>
        </div>
        <span className={`chip chip-${meta.tone}`}>{meta.label}</span>
      </div>

      <div className="evidence-cols">
        <EvidenceColumn label="基线 run" payload={criterion.baseline} side="baseline" />
        <div className="arrow" aria-hidden>
          →
        </div>
        <EvidenceColumn label="当前 run" payload={criterion.current} side={t} />
      </div>

      <div className={`rationale rationale-${meta.tone}`}>
        <span className="rationale-tag">判定依据</span>
        <p>{criterion.rationale}</p>
      </div>
    </div>
  );
}

function EvidenceColumn({
  label,
  payload,
  side,
}: {
  label: string;
  payload: EvidencePayload;
  side: string;
}) {
  const flavor = side === 'regressed' ? 'col-bad' : side === 'improved' ? 'col-good' : '';
  return (
    <div className={`evidence-col ${flavor}`}>
      <div className="evidence-col-label">{label}</div>
      <EvidenceBody payload={payload} />
    </div>
  );
}

function EvidenceBody({ payload }: { payload: EvidencePayload }) {
  switch (payload.kind) {
    case 'screenshot':
      return <FakeScreenshot shot={payload as ScreenshotEvidence} />;
    case 'http':
      return <HttpBody e={payload as HttpEvidence} />;
    case 'log':
      return <LogBody e={payload as LogEvidence} />;
    case 'test':
      return <TestBody e={payload as TestEvidence} />;
    default:
      return null;
  }
}

function HttpBody({ e }: { e: HttpEvidence }) {
  const ok = e.status >= 200 && e.status < 300;
  return (
    <div className="http">
      <div className="http-line">
        <span className="http-method">{e.method}</span>
        <span className="http-path">{e.path}</span>
      </div>
      <div className="http-meta">
        <span className={`http-status ${ok ? 'ok' : 'bad'}`}>{e.status}</span>
        <span className="http-latency">{e.latencyMs} ms</span>
      </div>
      {e.note && <div className="http-note">{e.note}</div>}
    </div>
  );
}

function LogBody({ e }: { e: LogEvidence }) {
  return (
    <div className="log">
      {e.lines.map((l, i) => (
        <div key={i} className={`log-line log-${l.level}`}>
          <span className="log-level">{l.level.toUpperCase()}</span>
          <span className="log-text">{l.text}</span>
        </div>
      ))}
    </div>
  );
}

function TestBody({ e }: { e: TestEvidence }) {
  const ok = e.failed === 0;
  return (
    <div className="test">
      <div className="test-summary">
        <span className="test-pass">{e.passed} passed</span>
        <span className={`test-fail ${ok ? 'muted' : ''}`}>{e.failed} failed</span>
      </div>
      {e.failing.length > 0 && (
        <ul className="test-failing">
          {e.failing.map((f, i) => (
            <li key={i}>✗ {f}</li>
          ))}
        </ul>
      )}
      {ok && <div className="test-ok">全部通过</div>}
    </div>
  );
}
