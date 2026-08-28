import * as THREE from "three";

import { smoothstep } from "../../store/timeStore";

// Kept out of the time store, where its numeric twin lives: THREE.Color was
// that store's only reason to touch three, and it is read outside the Canvas.
export function lerpColorKeyframes(
  stops: { t: number; color: THREE.Color }[],
  t: number,
  target?: THREE.Color,
): THREE.Color {
  const out = target ?? new THREE.Color();
  if (t <= stops[0].t) return out.copy(stops[0].color);
  if (t >= stops[stops.length - 1].t) return out.copy(stops[stops.length - 1].color);
  for (let i = 0; i < stops.length - 1; i++) {
    if (t >= stops[i].t && t <= stops[i + 1].t) {
      const frac = (t - stops[i].t) / (stops[i + 1].t - stops[i].t);
      return out.copy(stops[i].color).lerp(stops[i + 1].color, smoothstep(frac));
    }
  }
  return out.copy(stops[stops.length - 1].color);
}
