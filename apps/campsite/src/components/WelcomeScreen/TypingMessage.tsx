import { useState, useEffect, useRef } from 'react';
import { useTypingSound } from '../../hooks/useTypingSound';
import { useSessionStore } from '../../store/sessionStore';
import styles from './WelcomeScreen.module.css';

interface TypingMessageProps {
  text: string;
  onComplete: () => void;
  speed?: number; // ms per character
}

export default function TypingMessage({
  text,
  onComplete,
  speed = 38,
}: TypingMessageProps) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone]           = useState(false);
  const playNote = useTypingSound();
  const soundEnabled = useSessionStore((s) => s.soundEnabled);
  const indexRef = useRef(0);

  useEffect(() => {
    indexRef.current = 0;
    setDisplayed('');
    setDone(false);

    const interval = setInterval(() => {
      const i = indexRef.current;
      if (i >= text.length) {
        clearInterval(interval);
        setDone(true);
        onComplete();
        return;
      }
      const char = text[i];
      setDisplayed((prev) => prev + char);
      if (soundEnabled && char !== ' ') playNote();
      indexRef.current = i + 1;
    }, speed);

    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  return (
    <p className={styles.message}>
      {displayed}
      {!done && <span className={styles.cursor} />}
    </p>
  );
}
