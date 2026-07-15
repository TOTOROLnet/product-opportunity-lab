import { useState } from 'react';
import type { AnswerMap, Doc, UnitMastery } from './types';
import { LibraryView } from './components/LibraryView';
import { PlayerView } from './components/PlayerView';
import { RecapView } from './components/RecapView';

type Screen = 'library' | 'player' | 'recap';

interface Session {
  unitIds: string[];
  relisten: boolean;
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('library');
  const [doc, setDoc] = useState<Doc | null>(null);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [session, setSession] = useState<Session | null>(null);

  function startFull(d: Doc) {
    setDoc(d);
    setAnswers({});
    setSession({ unitIds: d.units.map((u) => u.id), relisten: false });
    setScreen('player');
  }

  function restartSameDoc() {
    if (!doc) return;
    setAnswers({});
    setSession({ unitIds: doc.units.map((u) => u.id), relisten: false });
    setScreen('player');
  }

  function relistenUnit(m: UnitMastery) {
    if (!doc) return;
    // 清掉该概念旧作答，让重听是一次干净的再测。
    setAnswers((prev) => {
      const next = { ...prev };
      delete next[m.unitId];
      return next;
    });
    setSession({ unitIds: [m.unitId], relisten: true });
    setScreen('player');
  }

  function onSessionComplete(sessionAnswers: AnswerMap) {
    setAnswers((prev) => ({ ...prev, ...sessionAnswers }));
    setScreen('recap');
  }

  function backToLibrary() {
    setScreen('library');
    setDoc(null);
    setAnswers({});
    setSession(null);
  }

  return (
    <div className="app">
      {screen === 'library' && <LibraryView onStart={startFull} />}

      {screen === 'player' && doc && session && (
        <PlayerView
          doc={doc}
          unitIds={session.unitIds}
          relisten={session.relisten}
          onComplete={onSessionComplete}
          onExit={() => setScreen(doc && Object.keys(answers).length > 0 ? 'recap' : 'library')}
        />
      )}

      {screen === 'recap' && doc && (
        <RecapView
          doc={doc}
          answers={answers}
          onRelisten={relistenUnit}
          onRestart={restartSameDoc}
          onBackToLibrary={backToLibrary}
        />
      )}

      <footer className="app__footer">
        耳记 · Earmark — 主动回忆式音频学习台 · 纯前端 mock demo（Vite + React + TS）
      </footer>
    </div>
  );
}
