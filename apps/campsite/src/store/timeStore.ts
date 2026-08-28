import { create } from "zustand";

/**
 * Centralised time-of-day state.
 * `progress` maps 0–1 to a 24 h cycle starting at 6 AM:
 *   0.00 = 6 AM (dawn)
 *   0.25 = noon
 *   0.50 = 6 PM (sunset)
 *   0.75 = midnight
 *   1.00 = 6 AM (next day)
 */

interface TimeState {
  /** 0–1 cycle progress */
  progress: number;
  /** True when the user is dragging the time wheel */
  isManual: boolean;
  setProgress: (p: number) => void;
  setManual: (v: boolean) => void;
}

export const useTimeStore = create<TimeState>()((set) => ({
  progress: progressFromSystemClock(),
  isManual: false,
  setProgress: (p) => set({ progress: ((p % 1) + 1) % 1 }), // wrap to 0–1
  setManual: (v) => set({ isManual: v }),
}));

// Hand-rolled rather than THREE.MathUtils: this store is read outside the
// Canvas, and importing three puts the 3D bundle on the blog's critical path.
export function smoothstep(t: number): number {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  return t * t * (3 - 2 * t);
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

// ─── Derived helpers (call outside React or inside selectors) ────

/** Convert a Date (or now) to 0–1 progress. */
export function progressFromSystemClock(date = new Date()): number {
  const h = date.getHours() + date.getMinutes() / 60;
  return ((h - 6 + 24) % 24) / 24;
}

/** Convert progress to human-readable hours/minutes + helpers. */
export function getTimeOfDay(progress: number) {
  const totalHours = (progress * 24 + 6) % 24;
  const hours = Math.floor(totalHours);
  const minutes = Math.floor((totalHours - hours) * 60);
  const isDaytime = hours >= 6 && hours < 18;
  const h12 = hours % 12 || 12;
  const ampm = hours < 12 ? "am" : "pm";
  const timeStr = `${h12}:${String(minutes).padStart(2, "0")} ${ampm}`;
  return { hours, minutes, isDaytime, timeStr, h12, ampm };
}

/**
 * Compute a smooth "night factor" (0 = full day, 1 = full night).
 * Transitions smoothly during dawn (progress ~0.00–0.06) and
 * dusk (progress ~0.46–0.54).
 */
export function getNightFactor(progress: number): number {
  // Dawn transition: night→day around progress 0.00–0.06 (6 AM – 7:30 AM)
  // Dusk transition: day→night around progress 0.46–0.54 (5 PM – 7 PM)
  if (progress < 0.06) {
    // Dawn: fading from night
    return smoothstep(1 - progress / 0.06);
  } else if (progress < 0.46) {
    // Full day
    return 0;
  } else if (progress < 0.54) {
    // Dusk: transitioning to night
    return smoothstep((progress - 0.46) / 0.08);
  } else {
    // Full night
    return 1;
  }
}

/**
 * Keyframe interpolation: given an array of { t, value } stops sorted by t,
 * lerp between the surrounding two stops. Works for numbers.
 */
export function lerpKeyframes(stops: { t: number; value: number }[], t: number): number {
  if (t <= stops[0].t) return stops[0].value;
  if (t >= stops[stops.length - 1].t) return stops[stops.length - 1].value;
  for (let i = 0; i < stops.length - 1; i++) {
    if (t >= stops[i].t && t <= stops[i + 1].t) {
      const frac = (t - stops[i].t) / (stops[i + 1].t - stops[i].t);
      const smooth = smoothstep(frac);
      return lerp(stops[i].value, stops[i + 1].value, smooth);
    }
  }
  return stops[stops.length - 1].value;
}
