import { useEffect, useState, lazy, Suspense } from 'react';
import { useSessionStore } from './store/sessionStore';
import WelcomeScreen from './components/WelcomeScreen/WelcomeScreen';
import CampfireLoadingScreen from './components/CampfireLoadingScreen';

// Lazy-load the heavy 3D scene so the welcome screen renders instantly.
// The dynamic import fires as soon as App mounts, so Three.js / R3F download
// in the background while the user is on the welcome screen.
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
