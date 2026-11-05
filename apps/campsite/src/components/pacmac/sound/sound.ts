import { getAudioContext } from "../../../audio/audioContext";
import { getMasterBus } from "../../../audio/masterVolume";
import { useSessionStore } from "../../../store/sessionStore";
import { asset } from "../../../utils/assetPath";
import type { Cue, Syllable } from "./cues";
import {
  type Siren,
  startSiren,
  synthBite,
  synthDeath,
  synthFruit,
  synthGhostEaten,
  synthJingle,
} from "./synth";

/** Jordan's recording of the word. Until it exists, `synthBite` says it. */
export const MACKA_CLIP = asset("audio/pacmac/macka.mp3");

/** The game's level against the rest of the site, under the master fader. */
const GAME_LEVEL = 0.5;

function isMuted(): boolean {
  return !useSessionStore.getState().soundEnabled;
}

let bus: GainNode | null = null;

function gameBus(ac: AudioContext): GainNode {
  if (bus) return bus;
  bus = ac.createGain();
  bus.gain.value = GAME_LEVEL;
  bus.connect(getMasterBus());
  return bus;
}

let clip: AudioBuffer | null = null;
let clipRequested = false;

/**
 * Fetches the recorded clip once. A missing file, which the dev server and the
 * live site both answer with the app's HTML, fails to decode and leaves the
 * synthesised bite in place.
 */
export async function loadClip(fetchClip: typeof fetch = fetch): Promise<void> {
  if (clipRequested) return;
  clipRequested = true;
  try {
    const response = await fetchClip(MACKA_CLIP);
    if (!response.ok) return;
    clip = await getAudioContext().decodeAudioData(await response.arrayBuffer());
  } catch {
    clip = null;
  }
}

/** The recording split in two at its middle: the first half says "mac", the second "ka". */
function playClipHalf(ac: AudioContext, out: AudioNode, buffer: AudioBuffer, syllable: Syllable) {
  const half = buffer.duration / 2;
  const source = ac.createBufferSource();
  source.buffer = buffer;
  source.connect(out);
  source.start(ac.currentTime, syllable === "mac" ? 0 : half, half);
}

/**
 * The first sound has to start inside a key press, or the browser keeps the
 * context suspended; the start key calls this before anything else.
 */
export function unlockAudio(): void {
  if (isMuted()) return;
  getAudioContext();
  void loadClip();
}

export function play(cue: Cue): void {
  if (isMuted()) return;
  const ac = getAudioContext();
  const out = gameBus(ac);
  switch (cue.kind) {
    case "bite":
      if (clip) playClipHalf(ac, out, clip, cue.syllable);
      else synthBite(ac, out, cue.syllable);
      return;
    case "start":
      synthJingle(ac, out);
      return;
    case "death":
      synthDeath(ac, out);
      return;
    case "fruit":
      synthFruit(ac, out);
      return;
    case "ghostEaten":
      synthGhostEaten(ac, out);
      return;
  }
}

let siren: Siren | null = null;

/** Sets the siren to a level, starting it if need be, or silences it with `null`. */
export function setSiren(level: number | null): void {
  if (level === null || isMuted()) {
    siren?.stop();
    siren = null;
    return;
  }
  if (siren) siren.setLevel(level);
  else siren = startSiren(getAudioContext(), gameBus(getAudioContext()), level);
}

/** For tests: forget the bus, clip and siren between module loads. */
export function resetSound(): void {
  bus = null;
  clip = null;
  clipRequested = false;
  siren = null;
}
