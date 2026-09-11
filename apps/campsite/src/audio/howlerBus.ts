/* The master fader for the beds and the music. Howler's global volume multiplies
   every Howl on top of its own, so a bed keeps its place in the day/night mix and
   a fade in flight still lands scaled; scaling each Howl ourselves would instead
   cost a re-mix per drag. */

import { Howler } from "howler";

import { masterVolume, onMasterVolumeChange } from "./masterVolume";

let subscribed = false;

/** Called by whoever is about to play a Howl, since only they know it has loaded. */
export function syncHowlerVolume() {
  Howler.volume(masterVolume());
  if (subscribed) return;
  subscribed = true;
  onMasterVolumeChange((volume) => Howler.volume(volume));
}
