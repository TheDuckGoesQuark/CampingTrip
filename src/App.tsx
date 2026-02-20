import { useEffect } from 'react';
import { useSessionStore } from './store/sessionStore';
import { initAudioManager } from './audio/audioManager';
import WelcomeScreen from './components/WelcomeScreen/WelcomeScreen';
import TentScene from './components/TentScene/TentScene';

export default function App() {
  const hasCompletedWelcome = useSessionStore((s) => s.hasCompletedWelcome);

  useEffect(() => {
    initAudioManager();
  }, []);

  return (
    <>
      {!hasCompletedWelcome && <WelcomeScreen />}
      {/* TentScene is always mounted so it can preload assets during welcome */}
      <TentScene visible={hasCompletedWelcome} />
    </>
  );
}
