import { useEffect, useState, lazy, Suspense } from 'react';
import { useSessionStore } from './store/sessionStore';
import { initAudioManager } from './audio/audioManager';
import WelcomeScreen from './components/WelcomeScreen/WelcomeScreen';
import CampfireLoadingScreen from './components/CampfireLoadingScreen';

const TentScene = lazy(() => import('./components/TentScene/TentScene'));

export default function App() {
  const hasCompletedWelcome = useSessionStore((s) => s.hasCompletedWelcome);

  // Keep welcome mounted during its fade-out animation, and bring it back on reset
  const [showWelcome, setShowWelcome] = useState(!hasCompletedWelcome);
  useEffect(() => {
    if (hasCompletedWelcome && showWelcome) {
      // Fade-out done → unmount
      const timer = setTimeout(() => setShowWelcome(false), 1400);
      return () => clearTimeout(timer);
    }
    if (!hasCompletedWelcome && !showWelcome) {
      // Reset triggered → bring welcome back
      setShowWelcome(true);
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
      {/* Defer TentScene until welcome completes so typing animation gets full CPU */}
      {hasCompletedWelcome && (
        <Suspense fallback={null}>
          <TentScene visible={hasCompletedWelcome} />
        </Suspense>
      )}
    </>
  );
}
