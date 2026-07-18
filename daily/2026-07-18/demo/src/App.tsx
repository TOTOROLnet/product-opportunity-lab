import { useState } from 'react';
import type { ModelState, Question, SelectionScore } from './types';
import {
  initModel,
  nextQuestion,
  computeSelectionScores,
  applyAnswer,
  applyCorrectionSlip,
  applyInterest,
  applyManualMastery,
} from './logic/engine';
import StudyView from './components/StudyView';
import KnowledgeMapView from './components/KnowledgeMapView';
import CompareView from './components/CompareView';

type Tab = 'study' | 'map' | 'compare';

interface Session {
  model: ModelState;
  turn: number;
  answered: Set<string>;
  activeQ: Question | null;
  activeScores: SelectionScore[];
  picked: number | null;
  last: { skillId: string; delta: number; correct: boolean } | null;
}

function initSession(): Session {
  const model = initModel();
  const { question, scores } = nextQuestion(model, new Set<string>(), 1);
  return {
    model,
    turn: 1,
    answered: new Set<string>(),
    activeQ: question,
    activeScores: scores,
    picked: null,
    last: null,
  };
}

export default function App() {
  const [tab, setTab] = useState<Tab>('study');
  const [session, setSession] = useState<Session>(initSession);

  const answer = (i: number) =>
    setSession((s) => {
      if (s.picked !== null || !s.activeQ) return s;
      const correct = i === s.activeQ.correctIndex;
      const { model, delta } = applyAnswer(s.model, s.activeQ, correct, s.turn);
      const answered = new Set(s.answered);
      answered.add(s.activeQ.id);
      return {
        ...s,
        model,
        answered,
        picked: i,
        last: { skillId: s.activeQ.skillId, delta, correct },
      };
    });

  const next = () =>
    setSession((s) => {
      const turn = s.turn + 1;
      const { question, scores } = nextQuestion(s.model, s.answered, turn);
      return { ...s, turn, activeQ: question, activeScores: scores, picked: null, last: null };
    });

  const transformModel = (fn: (m: ModelState, turn: number) => ModelState) =>
    setSession((s) => {
      const model = fn(s.model, s.turn);
      return { ...s, model, activeScores: computeSelectionScores(model, s.turn) };
    });

  const correctSlip = (id: string) => transformModel((m, t) => applyCorrectionSlip(m, id, t));
  const setInterest = (id: string, dir: 1 | -1) =>
    transformModel((m, t) => applyInterest(m, id, dir, t));
  const setManual = (id: string, v: number) =>
    transformModel((m, t) => applyManualMastery(m, id, v, t));
  const reset = () => setSession(initSession());

  return (
    <div className="app">
      <header className="header">
        <div className="brand">
          <div className="logo">🪞</div>
          <div>
            <h1>明镜 GlassTutor</h1>
            <div className="sub">可被你校正的「玻璃盒」自适应导师 · 静态 Demo</div>
          </div>
        </div>
        <p className="tagline">
          别的自适应学习把「它以为你会什么」锁进服务端黑盒。明镜把这份
          <b>「AI 对你的认知模型」</b>摊开、告诉你每道题<b>为什么现在考它</b>，并让你
          <b>亲手校正</b>它对你的判断。
        </p>
      </header>

      <nav className="tabs">
        <button className={`tab${tab === 'study' ? ' active' : ''}`} onClick={() => setTab('study')}>
          <span className="n">01</span>学习舱
        </button>
        <button className={`tab${tab === 'map' ? ' active' : ''}`} onClick={() => setTab('map')}>
          <span className="n">02</span>认知地图（玻璃盒）
        </button>
        <button
          className={`tab${tab === 'compare' ? ' active' : ''}`}
          onClick={() => setTab('compare')}
        >
          <span className="n">03</span>黑盒 vs 玻璃盒
        </button>
      </nav>

      {tab === 'study' && (
        <StudyView
          model={session.model}
          turn={session.turn}
          activeQ={session.activeQ}
          activeScores={session.activeScores}
          picked={session.picked}
          last={session.last}
          onAnswer={answer}
          onNext={next}
          onCorrectSlip={correctSlip}
          onReset={reset}
        />
      )}
      {tab === 'map' && (
        <KnowledgeMapView
          model={session.model}
          turn={session.turn}
          onSetManualMastery={setManual}
          onSetInterest={setInterest}
        />
      )}
      {tab === 'compare' && <CompareView />}

      <p className="footnote">
        全部为纯前端静态 Demo：无后端 / 无数据库 / 无登录 / 无 LLM / 无外部 API。技能图谱、题库均为 mock；
        掌握度更新、选题理由、校正后的路径重排、对比页的省题数，全部由 <code>src/logic/engine.ts</code>
        的确定性引擎实时算出。数据来源信号见当日 <code>opportunity.md</code>（Paradigm 自适应学习）。
      </p>
    </div>
  );
}
