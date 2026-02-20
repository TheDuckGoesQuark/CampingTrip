import { useSessionStore } from '../../store/sessionStore';
import styles from './WelcomeScreen.module.css';

interface OptionButtonsProps {
  visible: boolean;
}

export default function OptionButtons({ visible }: OptionButtonsProps) {
  const { setSoundEnabled, setEffectsEnabled, completeWelcome } = useSessionStore();

  async function handleFullExperience() {
    setSoundEnabled(true);
    setEffectsEnabled(true);

    // Request iOS DeviceOrientation permission from a user gesture
    if (
      typeof DeviceOrientationEvent !== 'undefined' &&
      // @ts-expect-error — requestPermission is iOS-only
      typeof DeviceOrientationEvent.requestPermission === 'function'
    ) {
      try {
        // @ts-expect-error
        await DeviceOrientationEvent.requestPermission();
      } catch {
        // Permission denied — parallax falls back to touch
      }
    }

    completeWelcome();
  }

  function handleJustBrowsing() {
    setSoundEnabled(false);
    setEffectsEnabled(false);
    completeWelcome();
  }

  return (
    <div className={`${styles.buttons} ${visible ? styles.visible : ''}`}>
      <button className={styles.btn} onClick={handleFullExperience}>
        <span className={styles.prefix}>&gt;</span>
        full experience (sound + motion)
      </button>
      <button className={styles.btn} onClick={handleJustBrowsing}>
        <span className={styles.prefix}>&gt;</span>
        just browsing (no sound, reduced motion)
      </button>
    </div>
  );
}
