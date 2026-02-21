import { useEffect, useState, lazy, Suspense } from 'react';
import { useSessionStore } from './store/sessionStore';
import { initAudioManager } from './audio/audioManager';
import WelcomeScreen from './components/WelcomeScreen/WelcomeScreen';
import CampfireLoadingScreen from './components/CampfireLoadingScreen';

const TentScene = lazy(() => import('./components/TentScene/TentScene'));

export default function App() {
  const hasCompletedWelcome = useSessionStore((s) => s.hasCompletedWelcome);

  // Keep welcome mounted during its fade-out animation (1.2s CSS transition)
  const [showWelcome, setShowWelcome] = useState(!hasCompletedWelcome);
  useEffect(() => {
    if (hasCompletedWelcome && showWelcome) {
      const timer = setTimeout(() => setShowWelcome(false), 1400);
      return () => clearTimeout(timer);
    }
  }, [hasCompletedWelcome, showWelcome]);

  useEffect(() => {
    initAudioManager();
  }, []);

  return (
    <>
      {/* Welcome screen — fades out via CSS when completeWelcome fires, then unmounts */}
      {showWelcome && <WelcomeScreen />}
      {/* Campfire loading — always mounted, manages its own visibility/audio/fade */}
      <CampfireLoadingScreen />
      {/* TentScene loads behind everything and becomes visible last */}
      <Suspense fallback={null}>
        <TentScene visible={hasCompletedWelcome} />
      </Suspense>
    </>
  );
}
