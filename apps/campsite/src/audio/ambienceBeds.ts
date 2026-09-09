import { Howl } from "howler";

import { asset } from "../utils/assetPath";

/**
 * Howler resumes a suspended context on the first user gesture itself
 * (`Howler.autoUnlock`) and queues volume changes made before a file has
 * loaded, so callers need neither a gesture retry nor a readiness check.
 *
 * Both files carry the same integrated loudness, which is what lets one set of
 * gain constants serve either bed; docs/ambience-beds.md cuts a replacement so
 * that stays true.
 */

export type BedName = "rain" | "day";

const SOURCES: Record<BedName, string> = {
  rain: "audio/ambience/rain-on-tent.mp3",
  day: "audio/ambience/dawn-chorus.mp3",
};

const BED_NAMES = Object.keys(SOURCES) as BedName[];

let beds: Record<BedName, Howl> | null = null;

export function startAmbience() {
  if (beds) return;

  const loaded = {} as Record<BedName, Howl>;
  for (const name of BED_NAMES) {
    loaded[name] = new Howl({
      src: [asset(SOURCES[name])],
      loop: true,
      volume: 0,
      // The HTML5 Audio path gaps at the loop point and resists gain
      // automation, which are this module's only two jobs.
      html5: false,
    });
    loaded[name].play();
  }
  beds = loaded;
}

export function setAmbienceMix(targets: Record<BedName, number>, fadeMs = 1000) {
  if (!beds) return;
  for (const name of BED_NAMES) {
    const bed = beds[name];
    const from = bed.volume() as number;
    if (from === targets[name]) continue;
    bed.fade(from, targets[name], fadeMs);
  }
}

export function stopAmbience(fadeMs = 1500) {
  if (!beds) return;
  // Detached before the fade so a re-enable during it builds fresh beds rather
  // than racing the teardown timer for these ones.
  const stopping = beds;
  beds = null;

  for (const name of BED_NAMES) {
    stopping[name].fade(stopping[name].volume() as number, 0, fadeMs);
  }
  setTimeout(() => {
    for (const name of BED_NAMES) {
      stopping[name].stop();
      stopping[name].unload();
    }
  }, fadeMs + 200);
}

export function isAmbiencePlaying() {
  return beds !== null;
}
