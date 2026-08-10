import type { DataProfile, DataSizeBucket, LabConfig } from '../types';
import { TASKS } from '../data/tasks';
import { MODELS } from '../data/models';
import { HARDWARE } from '../data/hardware';

const SIZE_LABELS: Record<DataSizeBucket, string> = {
  tiny: '极少 <50',
  small: '少 50–500',
  medium: '中 0.5k–5k',
  large: '多 >5k',
};

export default function ConfigPanel({
  config,
  onChange,
}: {
  config: LabConfig;
  onChange: (c: LabConfig) => void;
}) {
  const task = TASKS.find((t) => t.id === config.taskId)!;
  const setData = (patch: Partial<DataProfile>) =>
    onChange({ ...config, data: { ...config.data, ...patch } });

  return (
    <div className="card panel">
      <h2>飞行前配置</h2>

      <div className="field">
        <label>任务意图</label>
        <select
          value={config.taskId}
          onChange={(e) => onChange({ ...config, taskId: e.target.value })}
        >
          {TASKS.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <div className="hint">{task.desc}</div>
      </div>

      <div className="field">
        <label>基座模型</label>
        <select
          value={config.modelId}
          onChange={(e) => onChange({ ...config, modelId: e.target.value })}
        >
          {MODELS.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label>硬件 / 显存</label>
        <select
          value={config.hardwareId}
          onChange={(e) => onChange({ ...config, hardwareId: e.target.value })}
        >
          {HARDWARE.map((h) => (
            <option key={h.id} value={h.id}>
              {h.name}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label>数据规模</label>
        <div className="seg">
          {(Object.keys(SIZE_LABELS) as DataSizeBucket[]).map((b) => (
            <button
              key={b}
              className={config.data.sizeBucket === b ? 'on' : ''}
              onClick={() => setData({ sizeBucket: b })}
            >
              {SIZE_LABELS[b]}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <label>数据形态</label>
        <div className="seg toggle-row">
          <button
            className={config.data.hasLabels ? 'on' : ''}
            onClick={() => setData({ hasLabels: !config.data.hasLabels })}
          >
            {config.data.hasLabels ? '✓ ' : ''}有标注/示例
          </button>
          <button
            className={config.data.hasPreferencePairs ? 'on' : ''}
            onClick={() => setData({ hasPreferencePairs: !config.data.hasPreferencePairs })}
          >
            {config.data.hasPreferencePairs ? '✓ ' : ''}有成对偏好
          </button>
        </div>
        <div className="hint">
          "成对偏好" = 同一问题有 chosen/rejected 两条；"标注/示例" 含二元 好/坏 或 输入→输出。
        </div>
      </div>

      <div className="field">
        <label>数据质量</label>
        <div className="seg">
          {(['noisy', 'ok', 'clean'] as const).map((q) => (
            <button
              key={q}
              className={config.data.quality === q ? 'on' : ''}
              onClick={() => setData({ quality: q })}
            >
              {q === 'noisy' ? '偏脏' : q === 'ok' ? '一般' : '干净'}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
