import { useEffect, useState } from "react";

import { startRain, setRainVolume, stopRain, isRainPlaying } from "../../audio/rainSynth";
import { useSceneStore } from "../../store/sceneStore";
import { useSessionStore } from "../../store/sessionStore";
import { useTimeStore, getNightFactor } from "../../store/timeStore";

/** Scaled by the night factor, so these are peaks rather than absolutes. */
const DOOR_OPEN_VOLUME = 0.12;
const DOOR_CLOSED_VOLUME = 0.04;

/**
 * Sole owner of the rain ambience. Nothing else may call `startRain` — only this
 * component's effect drives `setRainVolume`, so a second caller gets rain whose
 * volume never tracks the tent door or the day/night arc, and which the toggle
 * cannot stop.
 *
 * Web Audio refuses to sound before a user gesture, so a start can fail and has
 * to be retried on one.
 */
export default function RainAudio() {
  const ambienceEnabled = useSessionStore((s) => s.ambienceEnabled);
  const doorState = useSceneStore((s) => s.tentDoorState);
  const progress = useTimeStore((s) => s.progress);
  // State rather than a ref, though nothing renders it: the volume effect
  // below has to re-run once the rain is live, and a ref wouldn't wake it.
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!ambienceEnabled) {
      stopRain();
      setPlaying(false);
      return;
    }

    function tryStart() {
      startRain(0); // silent — the volume effect takes it from here
      if (!isRainPlaying()) return false;
      setPlaying(true);
      return true;
    }

    if (tryStart()) return;

    function removeListeners() {
      window.removeEventListener("click", onGesture);
      window.removeEventListener("touchstart", onGesture);
      window.removeEventListener("keydown", onGesture);
    }
    function onGesture() {
      if (tryStart()) removeListeners();
    }
    window.addEventListener("click", onGesture);
    window.addEventListener("touchstart", onGesture);
    window.addEventListener("keydown", onGesture);
    return removeListeners;
  }, [ambienceEnabled]);

  useEffect(() => {
    if (!playing) return;

    const nightFactor = getNightFactor(progress);
    if (nightFactor < 0.05) {
      setRainVolume(0, 2.0);
      return;
    }

    const doorOpen = doorState === "open" || doorState === "opening";
    setRainVolume((doorOpen ? DOOR_OPEN_VOLUME : DOOR_CLOSED_VOLUME) * nightFactor, 1.0);
  }, [doorState, playing, progress]);

  return null;
}
