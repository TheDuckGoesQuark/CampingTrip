import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SessionState {
  /** One-shots fired by something the visitor just did. */
  soundEnabled: boolean;
  /** Looping beds — rain on the tent at night, birdsong by day. Off by
   *  default: a continuous noise is intrusive in a way a click on a laptop
   *  lid isn't. */
  ambienceEnabled: boolean;
  effectsEnabled: boolean;
  hasCompletedWelcome: boolean;
  lastVisitedAt: string | null;
  setSoundEnabled: (v: boolean) => void;
  setAmbienceEnabled: (v: boolean) => void;
  setEffectsEnabled: (v: boolean) => void;
  completeWelcome: () => void;
  resetWelcome: () => void;
  updateLastVisited: () => void;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      soundEnabled: true,
      ambienceEnabled: false,
      effectsEnabled: true,
      hasCompletedWelcome: false,
      lastVisitedAt: null,
      setSoundEnabled: (v) => set({ soundEnabled: v }),
      setAmbienceEnabled: (v) => set({ ambienceEnabled: v }),
      setEffectsEnabled: (v) => set({ effectsEnabled: v }),
      completeWelcome: () => set({ hasCompletedWelcome: true }),
      resetWelcome: () => set({ hasCompletedWelcome: false }),
      updateLastVisited: () => set({ lastVisitedAt: new Date().toISOString() }),
    }),
    { name: "campingtrip-session" },
  ),
);
