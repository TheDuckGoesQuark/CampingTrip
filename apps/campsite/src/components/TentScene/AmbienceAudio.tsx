import { useEffect } from "react";

import { startAmbience, setAmbienceMix, stopAmbience } from "../../audio/ambienceBeds";
import { useSceneStore } from "../../store/sceneStore";
import { useSessionStore } from "../../store/sessionStore";
import { useTimeStore, getNightFactor } from "../../store/timeStore";

/**
 * Birdsong sits below rain at matched door state because the dawn chorus is
 * made of transients that draw the ear, where rain is a flat bed.
 */
const DOOR_OPEN = { rain: 0.12, day: 0.1 };
const DOOR_CLOSED = { rain: 0.04, day: 0.035 };

/**
 * Sole owner of the ambience beds. Nothing else may call into `ambienceBeds`: a
 * second caller gets beds whose volume never tracks the tent door or the
 * day/night arc, and which the toggle cannot stop.
 */
export default function AmbienceAudio() {
  const ambienceEnabled = useSessionStore((s) => s.ambienceEnabled);
  const doorState = useSceneStore((s) => s.tentDoorState);
  const progress = useTimeStore((s) => s.progress);

  useEffect(() => {
    if (!ambienceEnabled) {
      stopAmbience();
      return;
    }
    startAmbience();
  }, [ambienceEnabled]);

  useEffect(() => {
    if (!ambienceEnabled) return;

    // `getNightFactor` smoothsteps across dawn and dusk, so a bed on it and a
    // bed on its complement crossfade without either dropping out.
    const nightFactor = getNightFactor(progress);
    const doorOpen = doorState === "open" || doorState === "opening";
    const peak = doorOpen ? DOOR_OPEN : DOOR_CLOSED;

    setAmbienceMix({
      rain: peak.rain * nightFactor,
      day: peak.day * (1 - nightFactor),
    });
  }, [ambienceEnabled, doorState, progress]);

  return null;
}
