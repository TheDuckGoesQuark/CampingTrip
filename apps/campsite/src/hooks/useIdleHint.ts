import { useEffect, useState } from "react";

/** Anything that means the visitor is still here, deciding what to touch. */
const ACTIVITY = ["pointerdown", "pointermove", "keydown", "wheel", "touchstart"] as const;

/**
 * True once the visitor has been still for `delayMs`, and false again the moment
 * they do anything at all.
 *
 * `armed` gates the whole thing rather than the caller ignoring the result, so a
 * hint is never counting down behind a loading screen or an open overlay and
 * then firing the instant one closes.
 */
export function useIdleHint(armed: boolean, delayMs: number): boolean {
  const [idle, setIdle] = useState(false);

  useEffect(() => {
    if (!armed) {
      setIdle(false);
      return;
    }

    let timer = window.setTimeout(() => setIdle(true), delayMs);
    const restart = () => {
      setIdle(false);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setIdle(true), delayMs);
    };

    for (const event of ACTIVITY) window.addEventListener(event, restart, { passive: true });
    return () => {
      window.clearTimeout(timer);
      for (const event of ACTIVITY) window.removeEventListener(event, restart);
    };
  }, [armed, delayMs]);

  return idle;
}
