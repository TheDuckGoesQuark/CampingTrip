import { useCallback, useEffect, useRef, useState } from "react";

import styles from "./UselessMachine.module.css";

/** Every phase but `idle` ends on a CSS animation's last frame, so the
 *  stylesheet owns the timing and no duration is written down twice. */
type Phase = "idle" | "lit" | "reaching" | "retreating";

type Mood = "calm" | "annoyed" | "feral";

function moodFor(presses: number): Mood {
  if (presses >= 5) return "feral";
  if (presses >= 3) return "annoyed";
  return "calm";
}

function isLit(phase: Phase): boolean {
  return phase === "lit" || phase === "reaching";
}

/** How far from the box a pointer still moves the eyes, in px. */
const GAZE_RANGE = 420;

/** How long one look lasts, and the range of quiet between two of them. */
const PEEK_HOLD_MS = 2600;
const PEEK_GAP_MS = [4000, 11_000];

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Point the pupils at the pointer. Direction goes onto the element as custom
 *  properties, not through state: a render per pointermove is a render per pixel. */
function useGaze(target: React.RefObject<HTMLDivElement | null>, watching: boolean): void {
  useEffect(() => {
    const element = target.current;
    if (!element || !watching || prefersReducedMotion()) return;

    function follow(event: PointerEvent) {
      if (!element) return;
      const box = element.getBoundingClientRect();
      const x = event.clientX - (box.left + box.width / 2);
      const y = event.clientY - (box.top + box.height / 2);
      const distance = Math.hypot(x, y) || 1;
      const stretch = Math.min(1, distance / GAZE_RANGE);
      element.style.setProperty("--gaze-x", String((x / distance) * stretch));
      element.style.setProperty("--gaze-y", String((y / distance) * stretch));
    }

    window.addEventListener("pointermove", follow);
    return () => window.removeEventListener("pointermove", follow);
  }, [target, watching]);
}

/**
 * Look out of the box now and then, but only once the visitor has seen what
 * lives in it: eyes before that give the joke away before anyone has pressed
 * anything.
 */
function useOccasionalPeek(active: boolean): boolean {
  const [peeking, setPeeking] = useState(false);

  useEffect(() => {
    if (!active) {
      setPeeking(false);
      return;
    }
    const [min, max] = PEEK_GAP_MS;
    const quiet = () => min + Math.random() * (max - min);
    let timer = 0;
    const hide = () => {
      setPeeking(false);
      timer = window.setTimeout(show, quiet());
    };
    const show = () => {
      setPeeking(true);
      timer = window.setTimeout(hide, PEEK_HOLD_MS);
    };
    timer = window.setTimeout(show, quiet());
    return () => window.clearTimeout(timer);
  }, [active]);

  return peeking;
}

/** Switch it on, and a cat lifts the box it lives under to swat the switch back
 *  off. It takes repeat pressing personally. */
export default function UselessMachine() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [presses, setPresses] = useState(0);
  const [seenOnce, setSeenOnce] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  const lit = isLit(phase);
  const peeking = useOccasionalPeek(seenOnce && phase === "idle");
  useGaze(root, peeking);

  const press = useCallback(() => {
    setPresses((n) => n + 1);
    // Mid-reach a press only feeds the mood: restarting the arc would teleport it.
    setPhase((current) => (current === "reaching" || current === "lit" ? current : "lit"));
  }, []);

  // The box ends two phases and the paw one, because the drop has to come after
  // the withdraw: a phase that ended on the paw could never wait for the box.
  // The guards are what let both hang off their own element safely.
  const boxSettled = useCallback(() => {
    setPhase((current) => {
      if (current === "lit") return "reaching";
      if (current !== "retreating") return current;
      setSeenOnce(true);
      return "idle";
    });
  }, []);

  const pawSettled = useCallback(() => {
    setPhase((current) => (current === "reaching" ? "retreating" : current));
  }, []);

  return (
    <div
      className={styles.machine}
      data-phase={phase}
      data-mood={moodFor(presses)}
      data-peeking={peeking}
      ref={root}
    >
      <span className={styles.underneath} aria-hidden="true" />

      <span className={styles.lookout} aria-hidden="true">
        <span className={styles.eye}>
          <span className={styles.pupil} />
        </span>
        <span className={styles.eye}>
          <span className={styles.pupil} />
        </span>
      </span>

      <span className={styles.armRig} aria-hidden="true">
        <span className={styles.arm} data-testid="machine-paw" onAnimationEnd={pawSettled}>
          <span className={styles.foreleg} />
          <span className={styles.pad}>
            <span className={styles.toe} />
            <span className={styles.toe} />
            <span className={styles.toe} />
            <span className={styles.toe} />
          </span>
        </span>
      </span>

      <div className={styles.box} data-testid="machine-box" onAnimationEnd={boxSettled}>
        <span className={styles.tape} aria-hidden="true" />
        <span className={styles.stencil} aria-hidden="true">
          This way up
        </span>
        <div className={styles.panel}>
          <span className={styles.lamp}>
            <span className={styles.port} aria-hidden="true">
              <span className={styles.led} />
            </span>
            <span className={styles.state}>{lit ? "ON" : "OFF"}</span>
          </span>
          <button type="button" className={styles.plunger} aria-pressed={lit} onClick={press}>
            <span className={styles.cap} aria-hidden="true" />
            Do not press
          </button>
        </div>
      </div>

      {/* Without this, only sighted visitors learn the machine answered back. */}
      <p className={styles.announcement} aria-live="polite">
        {phase === "retreating" ? "The cat switched it off." : ""}
      </p>
    </div>
  );
}
