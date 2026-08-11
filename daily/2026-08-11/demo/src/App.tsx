import { useMemo, useState } from 'react';
import { READER_POOL } from './data/readers';
import { SAMPLES } from './data/samples';
import ConfigBar from './components/ConfigBar';
import ReadingRoom from './components/ReadingRoom';
import HeatmapTab from './components/HeatmapTab';
import BeforeAfterTab from './components/BeforeAfterTab';

type Tab = 'reading' | 'heatmap' | 'beforeafter';

const TABS: { id: Tab; label: string }[] = [
  { id: 'reading', label: '① 围读台' },
  { id: 'heatmap', label: '② 接收热力图' },
  { id: 'beforeafter', label: '③ 改前改后' },
];

export default function App() {
  const [sampleId, setSampleId] = useState(SAMPLES[0].sample.id);
  const base = useMemo(() => SAMPLES.find((s) => s.sample.id === sampleId)!, [sampleId]);
  const [targetReaderId, setTargetReaderId] = useState(base.sample.targetReaderId);
  const [activeEditIds, setActiveEditIds] = useState<string[]>([]);
  const [tab, setTab] = useState<Tab>('reading');

  // 用当前选中的“目标读者”覆盖样本，让流失点/接收分随目标不同而变化
  const data = useMemo(
    () => ({ ...base, sample: { ...base.sample, targetReaderId } }),
    [base, targetReaderId],
  );

  const onSample = (id: string) => {
    const next = SAMPLES.find((s) => s.sample.id === id)!;
    setSampleId(id);
    setTargetReaderId(next.sample.targetReaderId);
    setActiveEditIds([]);
  };

  const onToggle = (id: string) =>
    setActiveEditIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  return (
    <>
      <div className="hero">
        <h1>
          众读 <span className="accent">Zhòngdú</span>
        </h1>
        <p className="tagline">
          发送前，先让<strong>一屋子目标读者</strong>替你把这段字读一遍——看清他们在<strong>哪一句流失</strong>、哪句困惑、哪句反感。
          众读只诊断<strong>接收效果</strong>，<strong>不替你改写</strong>：改的决定权永远在你手里。
        </p>
        <div className="pills">
          <span className="pill">把「多 AI 同台」从辩论表演 → 接收模拟</span>
          <span className="pill">词/句级注意力 · 困惑 · 反感 · 流失点</span>
          <span className="pill warn">离线 Demo：读者反应为预计算脚本，真实产品由 persona 条件化 LLM 在线生成</span>
        </div>
      </div>

      <ConfigBar
        samples={SAMPLES}
        current={data}
        onSample={onSample}
        readerPool={READER_POOL}
        targetReaderId={targetReaderId}
        onTarget={setTargetReaderId}
      />

      <div className="tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`tab-btn${tab === t.id ? ' active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'reading' && <ReadingRoom data={data} readerPool={READER_POOL} activeEditIds={activeEditIds} />}
      {tab === 'heatmap' && <HeatmapTab data={data} readerPool={READER_POOL} activeEditIds={activeEditIds} />}
      {tab === 'beforeafter' && (
        <BeforeAfterTab data={data} readerPool={READER_POOL} activeEditIds={activeEditIds} onToggle={onToggle} />
      )}

      <div className="footer">
        众读 Zhòngdú · product-opportunity-lab 每日机会 Demo（2026-08-11）。纯前端静态原型，全部读者反应为 mock 脚本，
        不接后端 / LLM / 数据库 / 登录 / 支付 / 外部 API。灵感来自 Product Hunt 雷达 2026-08-11「AI Group Call」信号，
        但反转其形态：不是让 AI 替你辩论，而是模拟你的读者替你预读。
      </div>
    </>
  );
}
