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
  /** How loud everything is, 0–1. Scales the beds and the one-shots alike, so
   *  it is the only control that can quieten the tent from inside the laptop. */
  volume: number;
  hasCompletedWelcome: boolean;
  lastVisitedAt: string | null;
  /** What the visitor has typed into a text file on the desktop, keyed by the
   *  file's slug. Persisted because a text editor that forgets your typing the
   *  moment you close the window reads as a bug rather than as a scene. */
  textEdits: Record<string, string>;
  setSoundEnabled: (v: boolean) => void;
  setAmbienceEnabled: (v: boolean) => void;
  setEffectsEnabled: (v: boolean) => void;
  setVolume: (v: number) => void;
  completeWelcome: () => void;
  resetWelcome: () => void;
  updateLastVisited: () => void;
  editText: (slug: string, body: string) => void;
  revertText: (slug: string) => void;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      soundEnabled: true,
      ambienceEnabled: false,
      effectsEnabled: true,
      volume: 1,
      hasCompletedWelcome: false,
      lastVisitedAt: null,
      textEdits: {},
      setSoundEnabled: (v) => set({ soundEnabled: v }),
      setAmbienceEnabled: (v) => set({ ambienceEnabled: v }),
      setEffectsEnabled: (v) => set({ effectsEnabled: v }),
      setVolume: (v) => set({ volume: Math.min(1, Math.max(0, v)) }),
      completeWelcome: () => set({ hasCompletedWelcome: true }),
      resetWelcome: () => set({ hasCompletedWelcome: false }),
      updateLastVisited: () => set({ lastVisitedAt: new Date().toISOString() }),
      editText: (slug, body) => set((s) => ({ textEdits: { ...s.textEdits, [slug]: body } })),
      revertText: (slug) =>
        set((s) => {
          const { [slug]: _dropped, ...rest } = s.textEdits;
          return { textEdits: rest };
        }),
    }),
    { name: "campingtrip-session" },
  ),
);
