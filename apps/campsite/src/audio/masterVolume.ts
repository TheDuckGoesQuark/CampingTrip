/* The master fader for this app's Web Audio graph. Howls mix in Howler's own
   context and take the same level through `./howlerBus`. */

import { useSessionStore } from "../store/sessionStore";
import { getAudioContext } from "./audioContext";

/** Long enough not to click, short enough to feel like the drag caused it. */
const RAMP_SECONDS = 0.02;

let bus: GainNode | null = null;

export function masterVolume(): number {
  return useSessionStore.getState().volume;
}

/* Guarded on the value: the session store also holds what has been typed into a
   text file, and every keystroke would otherwise re-gain every source. */
export function onMasterVolumeChange(listener: (volume: number) => void): () => void {
  let applied = masterVolume();
  return useSessionStore.subscribe((state) => {
    if (state.volume === applied) return;
    applied = state.volume;
    listener(state.volume);
  });
}

export function getMasterBus(): GainNode {
  if (bus) return bus;

  const ac = getAudioContext();
  const gain = ac.createGain();
  gain.gain.value = masterVolume();
  gain.connect(ac.destination);

  onMasterVolumeChange((volume) => {
    const now = ac.currentTime;
    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(gain.gain.value, now);
    gain.gain.linearRampToValueAtTime(volume, now + RAMP_SECONDS);
  });

  bus = gain;
  return bus;
}
