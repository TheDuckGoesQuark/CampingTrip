import { useEffect, useRef } from 'react';
import { useSceneStore } from '../../store/sceneStore';
import { useSessionStore } from '../../store/sessionStore';
import { useTimeStore, getNightFactor } from '../../store/timeStore';
import { startRain, setRainVolume, stopRain, isRainPlaying } from '../../audio/rainSynth';

/**
 * Manages rain audio — only plays at night.
 * Web Audio requires a user gesture to start, so we listen for the
 * first click/touch/keypress before initialising.
 */
export default function RainAudio() {
  const soundEnabled = useSessionStore((s) => s.soundEnabled);
  const doorState = useSceneStore((s) => s.tentDoorState);
  const progress = useTimeStore((s) => s.progress);
  const started = useRef(false);

  // Start rain on first user gesture (Web Audio policy)
  useEffect(() => {
    if (!soundEnabled) return;

    function tryStart() {
      if (started.current) return;
      started.current = true;
      startRain(0); // start silent — volume controlled by time/door effect
      window.removeEventListener('click', tryStart);
      window.removeEventListener('touchstart', tryStart);
      window.removeEventListener('keydown', tryStart);
    }

    // Try immediately (works if user already interacted, e.g. welcome screen click)
    tryStart();

    // Also listen for gestures in case AudioContext was blocked
    if (!isRainPlaying()) {
      started.current = false;
      window.addEventListener('click', tryStart, { once: true });
      window.addEventListener('touchstart', tryStart, { once: true });
      window.addEventListener('keydown', tryStart, { once: true });
    }

    return () => {
      window.removeEventListener('click', tryStart);
      window.removeEventListener('touchstart', tryStart);
      window.removeEventListener('keydown', tryStart);
    };
  }, [soundEnabled]);

  // Stop rain if sound disabled
  useEffect(() => {
    if (!soundEnabled && started.current) {
      stopRain();
      started.current = false;
    }
  }, [soundEnabled]);

  // Volume responds to door state + time of day (night only)
  useEffect(() => {
    if (!soundEnabled || !started.current) return;

    const nf = getNightFactor(progress);
    if (nf < 0.05) {
      // Daytime — silence rain
      setRainVolume(0, 2.0);
      return;
    }

    const doorOpen = doorState === 'open' || doorState === 'opening';
    const baseVol = doorOpen ? 0.22 : 0.08;
    setRainVolume(baseVol * nf, 1.0);
  }, [doorState, soundEnabled, progress]);

  return null;
}
