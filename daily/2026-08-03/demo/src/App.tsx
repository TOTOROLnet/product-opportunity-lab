import { useState } from 'react';
import type { Autonomy, Profile, Situation, Topic, TopicRule } from './types';
import { applyDecision, defaultProfile, tightenTopic } from './logic/engine';
import RehearsalView from './components/RehearsalView';
import ProfileView from './components/ProfileView';
import ReplayView from './components/ReplayView';

type Tab = 'rehearsal' | 'profile' | 'replay';

const TABS: { id: Tab; label: string; sub: string }[] = [
  { id: 'rehearsal', label: '① 彩排台', sub: '教它你的分寸' },
  { id: 'profile', label: '② 分寸画像', sub: '看/调你的边界' },
  { id: 'replay', label: '③ 一周回放', sub: '看它会怎么做' },
];

export default function App() {
  const [tab, setTab] = useState<Tab>('rehearsal');
  const [profile, setProfile] = useState<Profile>(() => defaultProfile());
  const [decidedLevel, setDecidedLevel] = useState<Record<string, Autonomy>>({});
  const [voice, setVoice] = useState<Record<string, boolean>>({});

  function handleDecide(situation: Situation, level: Autonomy) {
    setDecidedLevel((d) => ({ ...d, [situation.id]: level }));
    setProfile((p) => applyDecision(p, situation, level));
  }

  function handleVoice(situationId: string, soundsLikeMe: boolean) {
    setVoice((vv) => ({ ...vv, [situationId]: soundsLikeMe }));
  }

  function handleEditRule(topic: Topic, rule: TopicRule) {
    setProfile((p) => ({ topics: { ...p.topics, [topic]: rule } }));
  }

  function handleTighten(topic: Topic) {
    setProfile((p) => tightenTopic(p, topic));
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          <span className="logo">分寸</span>
          <div className="brand-text">
            <h1>分寸 Poise</h1>
            <p>个人 AI 代表「上岗前的分寸彩排 + 授权边界」台</p>
          </div>
        </div>
        <div className="neutral-chip" title="Poise 自己不持有任何号码，不打真实电话、不发真实消息，也不替你做任何对外动作。">
          厂商中立 · 只彩排不执行
        </div>
      </header>

      <div className="why-strip">
        <span>
          个人 AI 代表（Zinley / Vela / Pally 式）的生死不在功能多少，而在<b>信任设计</b>——它什么时候替你行动、什么时候回来找你。
          Poise 让你在任何真实电话 / 邮件发生<b>之前</b>，先把这条边界<b>教清楚、看明白、调到安心</b>。
        </span>
      </div>

      <nav className="tabs">
        {TABS.map((t) => (
          <button key={t.id} className={t.id === tab ? 'tab tab-on' : 'tab'} onClick={() => setTab(t.id)}>
            <b>{t.label}</b>
            <small>{t.sub}</small>
          </button>
        ))}
      </nav>

      <main className="main">
        {tab === 'rehearsal' && (
          <RehearsalView
            decidedLevel={decidedLevel}
            voice={voice}
            onDecide={handleDecide}
            onVoice={handleVoice}
            onGoProfile={() => setTab('profile')}
          />
        )}
        {tab === 'profile' && (
          <ProfileView profile={profile} voice={voice} onEditRule={handleEditRule} onGoReplay={() => setTab('replay')} />
        )}
        {tab === 'replay' && (
          <ReplayView profile={profile} onTighten={handleTighten} onGoRehearsal={() => setTab('rehearsal')} />
        )}
      </main>

      <footer className="app-footer">
        <span>
          分寸 Poise · 2026-08-03 机会实验室 Demo · 纯前端静态原型，全部数据为 mock，无后端 / LLM / 数据库 / 登录 / 支付 / 外部 API / 真实电话邮件。
        </span>
        <span className="rev">rev.1 · 演示的是"上岗前的信任校准"创新切入点，非 Zinley 克隆（它执行，我们只彩排）。</span>
      </footer>
    </div>
  );
}
