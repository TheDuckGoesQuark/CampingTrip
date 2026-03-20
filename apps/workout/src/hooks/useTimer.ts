import { useCallback, useEffect, useRef, useState } from 'react';
import { playTimerWarning } from '../audio/sounds';

interface UseTimerOptions {
  onComplete: () => void;
  beepAtSeconds?: number;
  autoStart?: boolean;
}

export function useTimer(totalSeconds: number, options: UseTimerOptions) {
  const { onComplete, beepAtSeconds = 5, autoStart = false } = options;
  const [remaining, setRemaining] = useState(totalSeconds);
  const [isActive, setIsActive] = useState(autoStart);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  // Reset when totalSeconds changes
  useEffect(() => {
    setRemaining(totalSeconds);
    setIsActive(autoStart);
  }, [totalSeconds, autoStart]);

  useEffect(() => {
    if (!isActive) return;

    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        const next = prev - 1;
        if (next <= beepAtSeconds && next > 0) {
          playTimerWarning();
        }
        if (next <= 0) {
          setIsActive(false);
          // Defer to avoid setState-during-render
          setTimeout(() => onCompleteRef.current(), 0);
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, beepAtSeconds]);

  const start = useCallback(() => setIsActive(true), []);
  const pause = useCallback(() => setIsActive(false), []);
  const skip = useCallback(() => {
    setIsActive(false);
    setRemaining(0);
    setTimeout(() => onCompleteRef.current(), 0);
  }, []);

  const progress = totalSeconds > 0 ? ((totalSeconds - remaining) / totalSeconds) * 100 : 100;

  return { remaining, isActive, progress, start, pause, skip };
}
