import { useEffect, useRef, useState } from 'react';
import type { Scenario } from '../types';

export function ScanConsole({
  scenario,
  onGotoLedger,
}: {
  scenario: Scenario;
  onGotoLedger: () => void;
}) {
  const [revealed, setRevealed] = useState(0);
  const [running, setRunning] = useState(false);
  const timer = useRef<number | null>(null);
  const boxRef = useRef<HTMLDivElement | null>(null);
  const total = scenario.scanLog.length;
  const done = revealed >= total;

  const clear = () => {
    if (timer.current !== null) {
      window.clearInterval(timer.current);
      timer.current = null;
    }
  };

  const run = () => {
    clear();
    setRevealed(0);
    setRunning(true);
    timer.current = window.setInterval(() => {
      setRevealed((n) => {
        if (n + 1 >= total) {
          clear();
          setRunning(false);
          return total;
        }
        return n + 1;
      });
    }, 520);
  };

  useEffect(() => () => clear(), []);
  useEffect(() => {
    if (boxRef.current) boxRef.current.scrollTop = boxRef.current.scrollHeight;
  }, [revealed]);

  return (
    <>
      <div className="panel">
        <h2>① 扫描台 · 把 agent 指令当可执行规格</h2>
        <p className="sub">
          对表不读代码语义、也不要你迁移到新契约——它把这些「给 agent 看的」文件里的命令 / 版本 /
          端口 / 环境变量抽成声明，逐条对着 CI 真值核对。
        </p>

        <div className="repo-card">
          <div className="repo-head">
            <span className="repo-dot" />
            <b>{scenario.repo.name}</b>
            <span className="repo-stack">{scenario.repo.stack}</span>
          </div>
          <div className="files">
            {scenario.files.map((f) => (
              <div key={f.path} className={`file ${f.isSourceOfTruth ? 'is-truth' : ''}`}>
                <code>{f.path}</code>
                <span className="file-role">{f.role}</span>
                {f.isSourceOfTruth && <span className="truth-badge">真值源</span>}
              </div>
            ))}
          </div>
        </div>

        <div className="scan-actions">
          <button className="btn primary" onClick={run} disabled={running}>
            {running ? '扫描中…' : done ? '↻ 重新扫描' : '▶ 运行契约扫描'}
          </button>
          {done && (
            <button className="btn" onClick={onGotoLedger}>
              查看契约账本 →
            </button>
          )}
        </div>
      </div>

      <div className="panel">
        <h2>模拟终端回放</h2>
        <p className="sub">确定性重放，非真实执行——全部判决来自 mock 仓库快照。</p>
        <div className="terminal" ref={boxRef}>
          {scenario.scanLog.slice(0, revealed).map((l, i) => (
            <div key={i} className={`tline tone-${l.tone}`}>
              {l.line}
            </div>
          ))}
          {running && <div className="tline cursor-line">▍</div>}
          {revealed === 0 && !running && (
            <div className="tline tone-dim">（点击「运行契约扫描」开始回放）</div>
          )}
        </div>
      </div>
    </>
  );
}
