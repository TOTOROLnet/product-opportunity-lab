import type { Reader, SampleData } from '../types';

interface Props {
  samples: SampleData[];
  current: SampleData;
  onSample: (id: string) => void;
  readerPool: Record<string, Reader>;
  targetReaderId: string;
  onTarget: (id: string) => void;
}

export default function ConfigBar({ samples, current, onSample, readerPool, targetReaderId, onTarget }: Props) {
  return (
    <div className="configbar">
      <div className="field">
        <label>① 选一段要发出去的文字</label>
        <select value={current.sample.id} onChange={(e) => onSample(e.target.value)}>
          {samples.map((s) => (
            <option key={s.sample.id} value={s.sample.id}>
              {s.sample.title}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label>② 你真正想打动谁（目标读者）</label>
        <select value={targetReaderId} onChange={(e) => onTarget(e.target.value)}>
          {current.sample.panel.map((rid) => (
            <option key={rid} value={rid}>
              {readerPool[rid].emoji} {readerPool[rid].name}
            </option>
          ))}
        </select>
      </div>
      <div className="scene-note">
        <strong>场景：</strong>
        {current.sample.scene}
      </div>
    </div>
  );
}
