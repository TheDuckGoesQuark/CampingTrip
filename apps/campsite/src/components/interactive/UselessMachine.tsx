import { Button, Text } from "@jordanscamp/ds";
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

/** Point the pupils at the pointer. Direction goes onto the element as custom
 *  properties, not through state: a render per pointermove is a render per pixel. */
function useGaze(target: React.RefObject<HTMLDivElement | null>, watching: boolean): void {
  useEffect(() => {
    const element = target.current;
    if (!element || !watching) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

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

/** Switch it on, and a cat reaches out of the box to switch it back off. It
 *  watches the pointer between goes, and takes repeat pressing personally. */
export default function UselessMachine() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [presses, setPresses] = useState(0);
  const root = useRef<HTMLDivElement>(null);

  const mood = moodFor(presses);
  const lit = isLit(phase);
  useGaze(root, phase === "idle");

  const press = useCallback(() => {
    setPresses((n) => n + 1);
    // Mid-reach a press only feeds the mood: restarting the arc would teleport it.
    setPhase((current) => (current === "reaching" || current === "lit" ? current : "lit"));
  }, []);

  // The phase guards let these hang off two elements: an animation from a phase
  // already left behind cannot drag the machine backwards.
  const lidSettled = useCallback(() => {
    setPhase((current) => (current === "lit" ? "reaching" : current));
  }, []);

  const pawSettled = useCallback(() => {
    setPhase((current) => {
      if (current === "reaching") return "retreating";
      if (current === "retreating") return "idle";
      return current;
    });
  }, []);

  return (
    <div className={styles.machine} data-phase={phase} data-mood={mood} ref={root}>
      <div className={styles.box} aria-hidden="true">
        <div className={styles.interior}>
          <div className={styles.eyes}>
            <span className={styles.eye}>
              <span className={styles.pupil} />
            </span>
            <span className={styles.eye}>
              <span className={styles.pupil} />
            </span>
          </div>
        </div>
        <div className={styles.arm} data-testid="machine-paw" onAnimationEnd={pawSettled}>
          <span className={styles.limb} />
          <span className={styles.pad}>
            <span className={styles.toe} />
            <span className={styles.toe} />
            <span className={styles.toe} />
            <span className={styles.toe} />
          </span>
        </div>
        <div className={styles.lid} data-testid="machine-lid" onAnimationEnd={lidSettled} />
      </div>

      <div className={styles.panel}>
        <span className={styles.lamp}>
          <span className={styles.led} />
          <Text variant="label" tone="muted" as="span">
            {lit ? "ON" : "OFF"}
          </Text>
        </span>
        <Button size="sm" aria-pressed={lit} onClick={press}>
          Do not press
        </Button>
      </div>

      {/* Without this, only sighted visitors learn the machine answered back. */}
      <p className={styles.announcement} aria-live="polite">
        {phase === "retreating" ? "The cat switched it off." : ""}
      </p>
    </div>
  );
}
