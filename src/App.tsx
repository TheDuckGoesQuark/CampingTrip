import { useEffect, lazy, Suspense } from 'react';
import { useSessionStore } from './store/sessionStore';
import { initAudioManager } from './audio/audioManager';
import WelcomeScreen from './components/WelcomeScreen/WelcomeScreen';

const TentScene = lazy(() => import('./components/TentScene/TentScene'));

export default function App() {
  const hasCompletedWelcome = useSessionStore((s) => s.hasCompletedWelcome);

  useEffect(() => {
    initAudioManager();
  }, []);

  return (
    <>
      {!hasCompletedWelcome && <WelcomeScreen />}
      {/* TentScene is always mounted so it can preload assets during welcome */}
      <Suspense fallback={null}>
        <TentScene visible={hasCompletedWelcome} />
      </Suspense>
    </>
  );
}
