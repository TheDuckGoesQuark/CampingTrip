import { useEffect } from "react";

import { startAmbience, setAmbienceMix, stopAmbience } from "../../audio/ambienceBeds";
import { useSessionStore } from "../../store/sessionStore";
import { useTimeStore, getNightFactor } from "../../store/timeStore";

/**
 * Birdsong peaks below rain because the dawn chorus is made of transients that
 * draw the ear, where rain is a flat bed.
 */
const PEAK = { rain: 0.12, day: 0.1 };

/**
 * Sole owner of the ambience beds. Nothing else may call into `ambienceBeds`: a
 * second caller gets beds whose volume never tracks the day/night arc, and
 * which the toggle cannot stop.
 */
export default function AmbienceAudio() {
  const ambienceEnabled = useSessionStore((s) => s.ambienceEnabled);
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

    setAmbienceMix({
      rain: PEAK.rain * nightFactor,
      day: PEAK.day * (1 - nightFactor),
    });
  }, [ambienceEnabled, progress]);

  return null;
}
